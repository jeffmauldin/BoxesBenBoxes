# ✏️ Boxes: Classic Dot Game

> The nostalgic pen-and-paper dot game played on restaurant placemats and kids' menus, beautifully crafted as a cross-platform mobile app for **Android** and **iOS** using React Native and Expo.

---

## 🌟 Overview

Remember waiting for food at a restaurant booth with your family, armed with crayons and a paper kids' menu or paper placemat? 

**Boxes** (also known worldwide as *Dots & Boxes*, *Square-it*, or *Pigs in a Pen*) brings that pure pass-and-play experience to phones and tablets. No crumpled paper, no dull crayons, and no unevenly spaced dots!

### ✨ Key Features
- **Flexible Pass & Play (2–4 Players)**: Play human-to-human, human vs. computer, or mix multiple humans with a computer opponent in 3-player or 4-player games.
- **4 Computer Opponent Personalities**:
  - **Random Dude 🎲**: Makes purely random moves. Perfect for toddlers and newcomers.
  - **Sees Boxes Dude 👀**: Captures any completable 3-sided box immediately; otherwise moves randomly.
  - **Somewhat Crafty 🦊**: Grabs boxes and avoids giving you a 3-sided box unless forced.
  - **Minimizer Dude 🧠**: When forced to sacrifice boxes, calculates all chains and surrenders the minimum number of boxes.
- **Pencil Wiggle Observation Delay**: Computer turns feature an animated wiggling pencil (✏️) and a ~700ms pause so kids have time to watch the board and anticipate the move.
- **Friendly Anti-AI Prompt**: Reminds players once per session that *"It's more fun to play a person!"* to encourage real human interaction.
- **Faint-to-Bold Visual Lines**: Unclaimed edges appear as faint guide lines (`#DCD5C3`). Touching any line highlights it with generous **44pt touch hitboxes** and turns it into a bold 6pt crayon stroke in that player's distinct color.
- **Great Game! Celebration**: End-of-game celebration with animated falling confetti particles, winner medals, and rematch options.
- **Optional Undo**: Pre-game toggle (default **OFF** for paper-and-pencil commitment). Strictly disabled once the game concludes.
- **Persistent Match Records**: Saved locally via `AsyncStorage` with an easy one-tap reset.
- **Kid-Safe Advertising (COPPA & Google Play Families)**: Configured with `maxAdContentRating = 'G'` and `tagForChildDirectedTreatment = true`—no alcohol, dating, casino, or mature ads.

---

## 📱 Testing on Your Physical Android Phone

You do **not** need a Google Play Console account, Google Ads account, or credit card to test this on your phone right now!

### Method 1: Instant Live Testing with Expo Go (Recommended)
1. Install the free **Expo Go** app from Google Play on your Android phone.
2. In this repo, start the dev server:
   ```bash
   cd /workspaces/boxes-game
   npx expo start
   ```
3. A QR code will display in your terminal.
4. Open **Expo Go** on your phone, tap **"Scan QR code"**, and point your camera at the screen.
5. The game will launch on your phone immediately with live code reloading!

### Method 2: Installable Experimental `.apk` File
To create a standalone `.apk` you can text or email to family:
```bash
npx eas login
npx eas build -p android --profile preview
```
EAS builds the `.apk` in the cloud and provides a direct download link.

---

## 🚀 Running Locally & Web Preview

```bash
# Install dependencies
npm install

# Run automated test suite (11 unit tests)
npm test

# Typecheck with TypeScript
npx tsc --noEmit

# Run in web browser
npm run web
```

---

## 🏗 Project Architecture

```
boxes-game/
├── App.tsx                     # Main App container & screen routing
├── app.json                    # Expo config & Android package metadata
├── package.json                # Dependencies & test scripts
├── jest.config.js              # Jest TypeScript test configuration
├── tsconfig.json               # TypeScript compiler configuration
├── __tests__/
│   ├── gameEngine.test.ts      # Core rules, scoring, bonus turns, undo tests
│   └── aiOpponents.test.ts     # Unit tests for all 4 AI opponent tiers
├── src/
│   ├── types/
│   │   └── game.ts             # TypeScript definitions (Board, Players, Opponents, GameState)
│   ├── logic/
│   │   ├── gameEngine.ts       # Pure rules engine: edge claiming, box closure, bonus turns, undo
│   │   ├── storage.ts          # AsyncStorage for match history & settings
│   │   └── ai/
│   │       └── aiOpponents.ts  # The 4 AI Dude decision engines & chain simulation
│   ├── components/
│   │   ├── BoardView.tsx       # Faint guide lines, generous 44pt touch hitboxes, crayon rendering
│   │   ├── GreatGameCelebration.tsx # Animated confetti celebration modal
│   │   └── ScoreBar.tsx        # Player cards, turn pills, live scores, and undo button
│   ├── screens/
│   │   ├── SetupScreen.tsx     # Grid presets, 2–4 players, opponent selection, anti-AI prompt
│   │   ├── GameScreen.tsx      # Main gameplay loop, wiggling pencil AI pause, celebration trigger
│   │   ├── GameOverModal.tsx   # Final scores modal
│   │   └── HistoryScreen.tsx   # Past match records & reset modal
│   ├── ads/
│   │   ├── adManager.ts        # Kid-safe AdMob configuration (COPPA & Families G-rated)
│   │   └── AdBanner.tsx        # Bottom reserved ad banner
│   └── constants/
│       ├── presets.ts          # Grid presets (3x3, 4x4, 5x5, 6x6, custom) & crayon palettes
│       └── theme.ts            # Restaurant placemat paper colors & styling tokens
└── store_assets/
    ├── PLAY_STORE_GUIDE.md     # Step-by-step Google Play publishing guide
    ├── store_listing.txt       # Store title, short description, and full description
    ├── privacy_policy.md       # AdMob compliance privacy policy
    └── app_icon_512.jpg        # 512x512 high-resolution app icon
```

---

## 📄 License & Publishing
Created by **jamsoft68**. See [`store_assets/PLAY_STORE_GUIDE.md`](file:///workspaces/boxes-game/store_assets/PLAY_STORE_GUIDE.md) for publishing to Google Play Store and linking AdMob.
