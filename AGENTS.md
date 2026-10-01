# AGENTS.md — AI Developer & Agent Replication Guide

This document is written for AI agents and human developers who need to understand, maintain, test, or reproduce the **Boxes** codebase.

---

## 🎯 Project Mission & Context

- **App Name**: Boxes: Classic Dot Game (`com.jamsoft68.boxes`)
- **Origin & Vibe**: The timeless paper-and-pencil game played on restaurant placemats and kids' menus while waiting for food.
- **Audience**: Kids, families, and thinkers of all ages. Focuses on spatial observation, concentration, and real human-to-human connection.
- **Repository Location**: Dedicated standalone repository at `/workspaces/boxes-game`.

---

## 🛠 Tech Stack & Tools

- **Framework**: React Native 0.86 + Expo SDK 57 (TypeScript).
- **Styling**: React Native `StyleSheet` with restaurant placemat palette (`src/constants/theme.ts`).
- **Storage**: `@react-native-async-storage/async-storage` for local match history and settings.
- **Testing**: Jest + `ts-jest` for automated logic verification.
- **Cloud Builds**: Expo Application Services (EAS Build) for building Android `.apk` and `.aab` bundles.

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

## 🎨 UI & Touch Interaction Rules (`src/components/BoardView.tsx`)

- **Hitboxes**: Line touch targets must be at least **44pt** centered over the segment. Never force users to tap a thin 2px line.
- **Unclaimed Lines**: Subtle, faint guide line (`#DCD5C3`).
- **Claimed Lines**: Bold 6pt crayon stroke in the player's vibrant color with rounded caps (`borderRadius: 3`).
- **Completed Boxes**: Centered player initial in a dashed stamp ring with soft pastel background fill.

---

## 🛡 Kid-Safe Ad Compliance (`src/ads/adManager.ts`)

Under COPPA and Google Play Families policy:
- `tagForChildDirectedTreatment: true`
- `maxAdContentRating: 'G'`
- `tagForUnderAgeOfConsent: true`
- `nonPersonalizedAdsOnly: true`
- All ad units use official Google test IDs during development.
- Interstitial ads are capped to at most **once every 2 completed games**, with a minimum **2-minute cooldown**.

---

## 🧪 Verification & Development Commands

```bash
# 1. Run all unit tests
npm test

# 2. Typecheck with TypeScript
npx tsc --noEmit

# 3. Start local development server (web & mobile)
npx expo start

# 4. Export static web bundle
npx expo export -p web --output-dir dist
```

When making changes to this repo:
- Always run `npx tsc --noEmit` and `npm test` before committing.
- Preserve all comments and docstrings.
- Adhere to the restaurant paper placemat theme tokens in `src/constants/theme.ts`.
