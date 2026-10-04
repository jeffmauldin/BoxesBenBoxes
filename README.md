# ✏️ BoxesBenBoxes: Classic Restaurant Dot Game

> The nostalgic pen-and-paper dot game played on restaurant placemats and kids' menus, beautifully crafted as a cross-platform mobile app for **Android** and **iOS** using React Native and Expo. Named after playing with family.

[![CI Tests](https://github.com/jeffmauldin/BoxesBenBoxes/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jeffmauldin/BoxesBenBoxes)
[![Live Match Tracker](https://img.shields.io/badge/World%20Tracker-Live%20Website-brightgreen)](https://jeffmauldin.github.io/BoxesBenBoxes/)
[![Privacy Policy](https://img.shields.io/badge/Privacy%20Policy-Compliant-blue)](https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html)

---

## 🌟 Overview

Remember waiting for food at a restaurant booth with your family, armed with crayons and a paper kids' menu or paper placemat? 

**BoxesBenBoxes** (inspired by the classic *Dots & Boxes*, *Square-it*, or *Pigs in a Pen*) brings that pure pass-and-play experience to phones and tablets. No crumpled paper, no dull crayons, and no unevenly spaced dots!

---

### ✨ Key Features

- **Flexible Pass & Play (2–4 Players)**: Play human-to-human, human vs. computer, or mix multiple humans with a computer opponent in 3-player or 4-player games.
- **Smart Form & Persistent Player Rosters**:
  - Remembers your chosen names and colors across matches—switch grid sizes without having to re-enter your names.
  - Auto-clearing defaults: tapping into "Player 1" or "Player 2" immediately clears the default text so you can start typing without backspacing.
  - Safe fallback: leaving a name blank safely restores the clean default.
- **Sticky Start Game Action Bar**: The primary **✏ Start Game** button is permanently docked in a sticky bottom bar—no scrolling required to start a match.
- **Responsive Keyboard Handling**: The entire setup screen automatically glides clear of the on-screen soft keyboard so text boxes are never obscured.
- **4 Computer Opponent Personalities**:
  - **Random Dude 🎲**: Makes purely random moves. Perfect for toddlers and newcomers.
  - **Sees Boxes Dude 👀**: Captures any completable 3-sided box immediately; otherwise moves randomly.
  - **Somewhat Crafty 🦊**: Grabs boxes and avoids giving you a 3-sided box unless forced.
  - **Minimizer Dude 🧠**: When forced to sacrifice boxes, calculates all chains and surrenders the minimum number of boxes.
- **Pencil Wiggle Observation Delay**: Computer turns feature an animated wiggling pencil (✏️) and a ~700ms pause so kids have time to watch the board and anticipate the move.
- **Friendly Anti-AI Prompt**: Reminds players once per session that *"It's more fun to play a person!"* to encourage real human interaction.
- **Faint-to-Bold Visual Lines**: Unclaimed edges appear as faint guide lines (`#DCD5C3`). Touching any line highlights it with generous **44pt touch hitboxes** and turns it into a bold 6pt crayon stroke in that player's distinct color.
- **Great Game! Celebration**: End-of-game celebration with animated falling confetti particles, winner medals, and interactive board replay.
- **Optional Move Undo**: Pre-game toggle (default **OFF** for authentic paper-and-pencil commitment). Strictly disabled once the game concludes.
- **Live 24/7 Global Match Feed**:
  - Every completed match automatically syncs to a Google Firebase Firestore cloud database.
  - Anyone can visit the **[Live World Match Tracker](https://jeffmauldin.github.io/BoxesBenBoxes/)** to view recent matches, live community stats, and interactive placemat board replays.
  - **Offline-First Resilience**: If a device is offline or in airplane mode, gameplay is never stalled—offline matches are dropped silently with zero error alerts or UI freezing.
- **Kid-Safe Advertising (COPPA & Google Play Families)**: Configured with `maxAdContentRating = 'G'` and `tagForChildDirectedTreatment = true`—no alcohol, dating, casino, or mature ads.

---

## 🌐 Live Web Services

- **Global Match Tracker Website**: [https://jeffmauldin.github.io/BoxesBenBoxes/](https://jeffmauldin.github.io/BoxesBenBoxes/)
- **Official Privacy Policy**: [https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html](https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html)
- **Source Code Repository**: [https://github.com/jeffmauldin/BoxesBenBoxes](https://github.com/jeffmauldin/BoxesBenBoxes)

---

## 📱 Running & Testing on Your Physical Phone

### Method 1: Instant Live Testing with Expo Go (Development)

1. Install the free **Expo Go** app from Google Play (Android) or App Store (iOS).
2. Start the development server with tunneling:
   ```bash
   cd /workspaces/boxes-game
   npm run tunnel
   ```
3. A large QR code will appear in your terminal.
4. Scan the QR code using the Expo Go app (Android) or Camera app (iOS) to load the game with live code reloading.

---

### Method 2: Building Standalone Android Release Binaries (EAS Build)

The project includes pre-configured **EAS (Expo Application Services)** build profiles in [`eas.json`](file:///workspaces/boxes-game/eas.json):

- **Verified Standalone APK v1.0.1 (Google Ads & Interstitials)**: [Download BoxesBenBoxes v1.0.1 APK](https://expo.dev/artifacts/eas/6bsMVJKaS_IVG0g7XedbS6lYsqbFyJSulvn3sd_9Xpw.apk) (Direct 1-tap installation)
- **Expo Cloud Dashboard**: [BoxesBenBoxes on Expo](https://expo.dev/accounts/jamsoft68/projects/boxesbenboxes)
- **Build ID**: `2d31adf1-27f3-4c3f-b07c-d6d0fa2a6237` (Version `1.0.1`, `versionCode: 2`)

To trigger new builds:
```bash
# 1. Log in to your Expo account (CLI-based, container safe)
npx eas login --no-browser

# 2. Build a standalone installable .apk (for direct phone install & sideloading):
npm run build:apk

# 3. Build a production signed .aab bundle (for Google Play Store submission):
npm run build:aab
```

EAS builds the application in the cloud and provides a direct download link and QR code when complete.

---

## 🚀 Running Locally & Web Browser Preview

```bash
# Install dependencies
npm install

# Run automated test suite (21 unit tests across 4 suites)
npm test

# Typecheck with TypeScript
npx tsc --noEmit

# Run in desktop web browser
npm run web
```

---

## 🏗 Project Structure

```
boxes-game/
├── App.tsx                     # Main App container, navigation & setup state retention
├── app.json                    # Expo config & Android package metadata
├── eas.json                    # EAS build profiles for Android APK and Google Play AAB
├── package.json                # Dependencies, test scripts & build shortcuts
├── jest.config.js              # Jest TypeScript test configuration
├── tsconfig.json               # TypeScript compiler configuration
├── docs/                       # 24/7 GitHub Pages public website
│   ├── index.html              # Live Global Match Tracker & placemat replayer
│   └── privacy.html            # Google Play Store compliant Privacy Policy
├── __tests__/
│   ├── gameEngine.test.ts      # Core rules, scoring, bonus turns, undo tests
│   ├── aiOpponents.test.ts     # Unit tests for all 4 AI opponent tiers
│   └── worldSync.test.ts       # Firestore REST serialization & offline resilience tests
├── src/
│   ├── types/
│   │   └── game.ts             # TypeScript definitions (Board, Players, Opponents, GameState)
│   ├── logic/
│   │   ├── gameEngine.ts       # Pure rules engine: edge claiming, box closure, bonus turns, undo
│   │   ├── storage.ts          # AsyncStorage for local match history & player preferences
│   │   ├── worldSync.ts        # Fire-and-forget sync to Google Firebase Firestore
│   │   └── ai/
│   │       └── aiOpponents.ts  # The 4 AI Dude decision engines & chain simulation
│   ├── components/
│   │   ├── BoardView.tsx       # Faint guide lines, generous 44pt touch hitboxes, crayon rendering
│   │   ├── GreatGameCelebration.tsx # Animated confetti celebration modal
│   │   └── ScoreBar.tsx        # Player cards, turn pills, live scores, and undo button
│   ├── screens/
│   │   ├── SetupScreen.tsx     # Grid presets, player rosters, sticky Start button, keyboard avoidance
│   │   ├── GameScreen.tsx      # Main gameplay loop, wiggling pencil AI pause, celebration trigger
│   │   ├── GameOverModal.tsx   # Final scores modal
│   │   └── HistoryScreen.tsx   # Past match records & reset modal
│   ├── ads/
│   │   ├── adManager.ts        # AdMob configuration (COPPA & Families G-rated, Banner ID)
│   │   └── AdBanner.tsx        # Bottom reserved ad banner & placemat rotating tips
│   └── constants/
│       ├── presets.ts          # Grid presets (3x3, 4x4, 5x5, 6x6, custom) & crayon palettes
│       └── theme.ts            # Restaurant placemat paper colors & styling tokens
└── store_assets/
    ├── PLAY_STORE_GUIDE.md     # Step-by-step Google Play publishing guide
    ├── store_listing.txt       # Store title, short description, and full description
    └── app_icon_512.jpg        # 512x512 high-resolution app icon
```

---

## 📄 License & Publishing
Created by **Jeff Mauldin Software** (`jeffmauldinsoftware@gmail.com`). 
See [`store_assets/PLAY_STORE_GUIDE.md`](file:///workspaces/boxes-game/store_assets/PLAY_STORE_GUIDE.md) for publishing to the Google Play Store and linking AdMob.
