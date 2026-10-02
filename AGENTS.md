# AGENTS.md — AI Developer & Agent Replication Guide

This document is written for AI agents and human developers who need to understand, maintain, test, or reproduce the **BoxesBenBoxes** codebase.

---

## 🎯 Project Mission & Context

- **App Name**: BoxesBenBoxes (`com.jeffmauldinsoftware.boxesbenboxes`)
- **Origin & Vibe**: The timeless paper-and-pencil game played on restaurant placemats and kids' menus while waiting for food. Named after playing with family.
- **Audience**: Kids, families, and thinkers of all ages. Focuses on spatial observation, concentration, and real human-to-human connection.
- **Repository Location**: Dedicated standalone repository at `/workspaces/boxes-game`.
- **Public Git Remote**: `https://github.com/jeffmauldin/BoxesBenBoxes.git`
- **Live Match Tracker**: `https://jeffmauldin.github.io/BoxesBenBoxes/`
- **Privacy Policy**: `https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html`

---

## 🛠 Tech Stack & Tools

- **Framework**: React Native 0.86 + Expo SDK 57 (TypeScript).
- **Styling**: React Native `StyleSheet` with restaurant placemat palette (`src/constants/theme.ts`).
- **Local Storage**: `@react-native-async-storage/async-storage` for match records and player setup preferences.
- **Cloud Database**: Google Firebase Firestore via direct REST API (`src/logic/worldSync.ts`).
- **Web Hosting**: GitHub Pages serving the interactive canvas match replayer from `docs/index.html`.
- **Testing**: Jest + `ts-jest` for automated logic verification (16 unit tests).
- **Cloud Builds**: Expo Application Services (EAS Build) for building Android `.apk` and `.aab` bundles (`eas.json`).

---

## 📐 Mathematical Model & Game Engine (`src/logic/gameEngine.ts`)

Given an $R \times C$ grid of dots (where $R$ is rows and $C$ is columns):
1. **Boxes**: $(R - 1) \times (C - 1)$ boxes.
   - Bounded by:
     - Top: `h_${r}_${c}`
     - Bottom: `h_${r + 1}_${c}`
     - Left: `v_${r}_${c}`
     - Right: `v_${r}_${c + 1}`
2. **Horizontal Edges**: $R \times (C - 1)$ segments (`h_r_c`).
3. **Vertical Edges**: $(R - 1) \times C$ segments (`v_r_c`).
4. **Turn Mechanics**:
   - Players rotate sequentially ($0 \rightarrow 1 \rightarrow \dots \rightarrow N-1 \rightarrow 0$).
   - Claiming an edge checks up to 2 adjacent boxes.
   - If any box reaches degree 4 (all 4 edges claimed), active player captures it, gains 1 point per box, and **must move again** (bonus turn).
   - If 0 boxes are completed, turn passes to next player.
5. **Undo Engine**:
   - Controlled by `allowUndo` flag (default **false**).
   - If enabled, tracks a `MoveRecord` stack.
   - Undoing pops the last move, sets the edge back to `null`, clears any captured boxes, deducts points, and restores the previous player's turn.
   - **Crucial Rule**: Undo is strictly prohibited once `isGameOver === true`.

---

## 🤖 AI Opponents Engine (`src/logic/ai/aiOpponents.ts`)

Four distinct computer opponent tiers are supported:
1. **`random` (Random Dude 🎲)**:
   - Uniform random selection among all currently unclaimed edges (`getAllLegalMoves`).
2. **`sees_boxes` (Sees Boxes Dude 👀)**:
   - Scans all boxes for degree 3 (`findBoxCompletingMoves`).
   - If found, claims the missing 4th edge to complete the box. Otherwise falls back to random.
3. **`crafty` (Somewhat Crafty 🦊)**:
   - Priority 1: Take any completable box (degree 3).
   - Priority 2: Filter for safe moves using `isMoveSafe`. A move is safe iff claiming it does NOT elevate any adjacent box from degree 2 to degree 3.
   - Priority 3: If no safe moves exist, picks a move.
4. **`minimizer` (Minimizer Dude 🧠)**:
   - Priority 1: Complete available boxes.
   - Priority 2: Make safe moves.
   - Priority 3: When forced to sacrifice, runs `simulateSacrificeCost` by chaining degree-3 closures and selects the candidate edge that yields the **minimal opponent box count**.

### AI Pacing & UX Rules
- **Observation Delay**: Computer turns wait **700ms** before making a move.
- **Pencil Wiggle Animation**: Displays a rotating pencil icon (`✏️`) with `isAIThinking` state.
- **Anti-AI Prompt**: Prompt appears **at most once per app session** (`sessionDismissedComputerPrompt`), encouraging players to play a human.

---

## 🌍 Global Match Sync (`src/logic/worldSync.ts`)

- **Firestore Endpoint**: Direct REST API call to Google Firebase Firestore collection `matches`:
  `https://firestore.googleapis.com/v1/projects/boxesbenboxes/databases/(default)/documents/matches`
- **Schema**: Typed REST document format via `formatForFirestore(payload: CompactMatchPayload)`.
  Stores:
  - `matchId`: Unique match identifier (`m_${Date.now()}_${random}`).
  - `timestamp`: ISO-8601 UTC timestamp.
  - `deviceId`: Persistent device identifier (`dev_${random}`).
  - `handle`: Player/family public handle (default generated, editable in setup).
  - `gridRows` & `gridCols`: Board dimensions.
  - `totalBoxes`: Total claimable boxes.
  - `players`: Array of player names, initials, colors, scores, and computer flags.
  - `winnerNames`: Array of winners (or multiple if tied).
  - `isTie`: Boolean flag.
  - `boardBoxes`: Ultra-compact string encoding the owner player index for each box (e.g., `"010011010"`), allowing the web replayer to reconstruct the final placemat.
- **Offline Resilience Invariant**:
  - The fetch call enforces an `AbortController` with a strict **2500ms timeout**.
  - Wrapped in fire-and-forget promise handlers with `.catch()`.
  - If the device is offline or in airplane mode, the match payload is silently dropped with **zero delay to the victory confetti animation, zero UI blocking, and zero error dialogs**.

---

## 🎨 UI, Navigation & Form UX Rules

1. **Sticky Bottom Action Bar**:
   - The primary **"✏ Start Game"** button is pinned at the bottom in `styles.bottomBar` outside the `ScrollView`.
   - Users never have to scroll down a long form to find the Start button.
2. **Setup State Persistence**:
   - `App.tsx` retains `lastSetup` in memory across game exits.
   - `SetupScreen.tsx` additionally persists the roster to `AsyncStorage` (`@boxes_saved_setup_v2`).
   - Custom player names ("Grandjam", "Fake Theo", etc.) and colors are retained when navigating between screens or restarting the app.
3. **Auto-Clearing Form Defaults**:
   - Tapping into a player name box where `name === 'Player X'` automatically clears the field (`onFocus`) so users can type immediately without manual backspacing.
   - Leaving the name blank or typing only whitespace restores the clean default on blur (`onBlur`).
4. **Soft Keyboard Avoidance**:
   - The setup screen is wrapped in a `KeyboardAvoidingView`.
   - The Public / Family Handle text input has full width and triggers an automatic `scrollToEnd` on focus so the input is never obscured by the virtual keyboard.
5. **Touch Hitboxes**:
   - Board line touch targets are at least **44pt** centered over the segment.
6. **Crayon Aesthetics**:
   - Unclaimed edges: Faint guide lines (`#DCD5C3`).
   - Claimed edges: Bold 6pt crayon stroke in player's vibrant color with rounded caps.
   - Completed boxes: Centered initial inside a stamped dashed circle.

---

## 🛡 Kid-Safe Ad Compliance (`src/ads/adManager.ts`)

Under COPPA and Google Play Families policy:
- `tagForChildDirectedTreatment: true`
- `maxAdContentRating: 'G'`
- `tagForUnderAgeOfConsent: true`
- `nonPersonalizedAdsOnly: true`
- Production AdMob IDs:
  - Account: `jeffmauldinsoftware@gmail.com`
  - App ID: `ca-app-pub-4537394443614417~6765728644`
  - Android Banner Unit ID: `ca-app-pub-4537394443614417/9964512085`
- Interstitial ads are capped to at most **once every 2 completed games**, with a minimum **2-minute cooldown**.
- Fallback / Expo Go banner displays rotating restaurant placemat tips and strategy trivia.

---

## 🚀 Build & Deployment Commands

```bash
# 1. Run full test suite (16 tests)
npm test

# 2. Typecheck with TypeScript
npx tsc --noEmit

# 3. Start local development server with tunnel (for phone testing)
npm run tunnel

# 4. Run in desktop web browser
npm run web

# 5. Build standalone installable Android .apk (EAS Build)
npm run build:apk

# 6. Build Google Play Store release .aab (EAS Build)
npm run build:aab
```

When making changes to this repo:
- Always run `npx tsc --noEmit` and `npm test` before committing.
- Preserve all existing comments and docstrings.
- Adhere to the restaurant paper placemat theme tokens in `src/constants/theme.ts`.
