# Google Play Store Publishing Guide for "BoxesBenBoxes"
**Account:** `jeffmauldinsoftware@gmail.com` | **Package Identifier:** `com.jeffmauldinsoftware.boxesbenboxes`
**AdMob App ID:** `ca-app-pub-4537394443614417~6765728644`
**AdMob Banner Unit ID:** `ca-app-pub-4537394443614417/9964512085`
**Live Privacy Policy:** [https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html](https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html)
**Live World Match Tracker:** [https://jeffmauldin.github.io/BoxesBenBoxes/](https://jeffmauldin.github.io/BoxesBenBoxes/)

This guide walks you through building your production Android App Bundle (`.aab`) or direct installable test APK (`.apk`), setting up your Google Play Console store listing, and publishing the app.

---

## 1. Quick Testing with Friends & Family (Direct APK)
Before submitting to the Play Store, you can generate an installable `.apk` file that your friends and family can download and install directly on their Android phones with a single link:

1. Create a free account on [expo.dev](https://expo.dev) if you haven't already.
2. In your terminal inside `/workspaces/boxes-game`, log in to Expo:
   ```bash
   npx eas login
   ```
3. Build a direct installable APK:
   ```bash
   npm run build:apk
   ```
   *(or `npx eas build -p android --profile preview`)*
4. EAS builds the `.apk` in the cloud in ~5–10 minutes. When finished, it provides a download link and QR code you can text or email to your family!

---

## 2. Google Play Console Access & App Creation
1. Navigate to [play.google.com/console](https://play.google.com/console).
2. Log into your Google Developer account (`jeffmauldinsoftware@gmail.com`).
3. Click **"Create app"**:
   - **App name:** `BoxesBenBoxes`
   - **Default language:** English (United States)
   - **App or game:** Game
   - **Free or paid:** Free
   - Accept the Developer Program Policies and US export laws checkboxes.

---

## 3. Google AdMob Status
Your AdMob app **BoxesBenBoxes** is already configured under `jeffmauldinsoftware@gmail.com`!
- **App ID:** `ca-app-pub-4537394443614417~6765728644`
- **Banner Ad Unit:** `ca-app-pub-4537394443614417/9964512085`
- Wired into [`src/ads/adManager.ts`](file:///workspaces/boxes-game/src/ads/adManager.ts) with full COPPA and Google Play Families G-rated child-safety compliance.

---

## 4. Building the Production Bundle (`.aab`)
Google Play requires an Android App Bundle (`.aab`) for store submissions:

1. Inside `/workspaces/boxes-game`, run:
   ```bash
   npm run build:aab
   ```
   *(or `npx eas build -p android --profile production`)*
2. EAS will prompt:
   - *"Generate a new Android Keystore?"* → Press **Y** (EAS will safely generate and backup your cryptographic signing key in the cloud so you never lose it).
3. Once completed, EAS will provide a direct download link for your signed production `.aab` file.

---

## 5. Completing the Google Play Store Setup Tasks
In the Play Console dashboard for your app, complete the mandatory checklist:

### A. Privacy Policy
- Use your live, compliant policy URL:
  **`https://jeffmauldin.github.io/BoxesBenBoxes/privacy.html`**

### B. App Access
- Select: *"All functionality is available without special access"* (no login or password required).

### C. Ads
- Select: *"Yes, my app contains ads"* (since Google AdMob is integrated).

### D. Content Rating
- Click **Start questionnaire**:
  - Category: Game
  - Violence, profanity, drugs: Select **No** to all.
  - User interaction: Local pass-and-play and public leaderboard (no unrestricted chat).
  - Rating received will be **PEGI 3 / Everyone (E)**, perfect for families and students.

### E. Target Audience & Content (Families Policy)
- Target age groups: Select **All ages** (including children under 13).
- Since children may play:
  - AdMob is already configured in code with `tagForChildDirectedTreatment: true` and `maxAdContentRating: 'G'` to strictly satisfy Google Play Families Ad policy.

### F. News Apps & Government Apps
- Select **No** to both.

### G. Data Safety Questionnaire
- **Does your app collect or share user data?**: Select **Yes**.
- **Data types**:
  - *App Activity / Game Play*: Compact match outcome scores and box counts (sent to Firestore to display on the live public website).
  - *Device or other IDs*: Device ID for leaderboard identification and AdMob diagnostic identifiers.
- **Data usage**: App functionality, analytics, and advertising.
- **Is data encrypted in transit?**: Select **Yes** (all cloud sync and ads use HTTPS/TLS).
- **Can users request data deletion?**: Yes (contact email provided in privacy policy).

---

## 6. Store Listing & Graphical Assets
Under **Store presence → Main store listing**:
1. **App Name:** `BoxesBenBoxes`
2. **Short description (80 chars max):**
   *Classic restaurant placemat pen & paper dot game with smart AI & live match feed.*
3. **Full description:** See [`store_assets/store_listing.txt`](file:///workspaces/boxes-game/store_assets/store_listing.txt).
4. **App Icon:** Upload [`store_assets/app_icon_512.jpg`](file:///workspaces/boxes-game/store_assets/app_icon_512.jpg) (512x512 PNG/JPEG).
5. **Feature Graphic:** 1024x500 banner (can be generated from placemat screenshot/canvas).
6. **Phone Screenshots:** Take 2–4 screenshots while running the game on your phone.

---

## 7. Releasing to Production
1. In the left menu, go to **Production** (or **Closed testing**).
2. Click **Create new release**.
3. Upload the `.aab` file built by EAS.
4. Name the release: `1.0.0 (Initial Release)`.
5. Enter release notes:
   *Welcome to BoxesBenBoxes! The classic restaurant placemat dots and boxes pass-and-play game for family and friends.*
6. Click **Next** → **Review release** → **Start rollout to Production**!
