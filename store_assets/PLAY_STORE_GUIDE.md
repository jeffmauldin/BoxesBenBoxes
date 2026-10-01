# Google Play Store Publishing Guide for "Boxes"
**Account:** `jamsoft68` | **Package Identifier:** `com.jamsoft68.boxes`

This guide walks you through every step to build your production Android App Bundle (`.aab`) or direct installable test APK (`.apk`), set up your Google Play Console and AdMob accounts, and publish the app to the Google Play Store.

---

## 1. Quick Testing with Friends & Family (Direct APK)
Before submitting to the Play Store, you can generate an installable `.apk` file that your friends and family can download and install directly on their Android phones with a single link:

1. Create a free account on [expo.dev](https://expo.dev) if you haven't already.
2. In your terminal inside `boxes-app`, log in to Expo:
   ```bash
   npx eas login
   ```
3. Configure the build profile:
   ```bash
   npx eas build:configure
   ```
4. Build a direct installable APK:
   ```bash
   npx eas build -p android --profile preview
   ```
5. EAS will build the `.apk` in the cloud in ~5–10 minutes. When finished, it provides a download link and QR code you can text or email to your family!

---

## 2. Google Play Console Access & Developer Verification
1. Navigate to [play.google.com/console](https://play.google.com/console).
2. Log into the Google account associated with your registered developer name (`jamsoft68`).
   - If your account was registered several years ago, your account is grandfathered and **does not** require the newer 20-tester requirement applied to personal accounts created after Nov 2023!
   - Ensure your developer email and phone verification are up to date under **Account details**.
3. Click **"Create app"**:
   - **App name:** `Boxes: Classic Dot Game`
   - **Default language:** English (United States)
   - **App or game:** Game
   - **Free or paid:** Free
   - Accept the Developer Program Policies and US export laws checkboxes.

---

## 3. Linking Google AdMob for Monetization
You mentioned having a Google Ads / AdMob login under `jamsoft68`.

1. Go to [admob.google.com](https://admob.google.com) and log in.
2. Click **Apps** → **Add App**:
   - Platform: **Android**
   - Is the app listed on a supported app store? Select **No** (until it is published).
   - App name: `Boxes`
3. Create two Ad Units:
   - **Ad Unit 1: Banner**
     - Type: Banner
     - Name: `Main Bottom Banner`
     - Copy the generated Ad Unit ID (looks like `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`).
   - **Ad Unit 2: Interstitial**
     - Type: Interstitial
     - Name: `Game Over Interstitial`
     - Under **Advanced settings**, set Frequency Capping: **1 impression per 3 minutes** (to protect user experience as requested!).
     - Copy the generated Ad Unit ID.
4. Paste these IDs into `boxes-app/src/ads/adManager.ts`:
   ```typescript
   export const ADMOB_CONFIG = {
     ...
     prodBannerIdAndroid: 'ca-app-pub-YOUR_ID/YOUR_BANNER_ID',
     prodInterstitialIdAndroid: 'ca-app-pub-YOUR_ID/YOUR_INTERSTITIAL_ID',
   };
   ```

---

## 4. Building the Production Bundle (`.aab`)
Google Play requires an Android App Bundle (`.aab`) for store submissions:

1. Inside `boxes-app`, run:
   ```bash
   npx eas build -p android --profile production
   ```
2. EAS will prompt:
   - *"Generate a new Android Keystore?"* → Press **Y** (EAS will safely generate and backup your cryptographic signing key in the cloud so you never lose it).
3. Once completed, EAS will provide a direct download link for `boxes-app.aab`.

---

## 5. Completing the Google Play Store Setup Tasks
In the Play Console dashboard for your app, complete the mandatory checklist:

### A. Privacy Policy
- Provide a public URL to your privacy policy. You can host the provided [privacy_policy.md](file:///workspaces/AllVibesDemo/boxes-app/store_assets/privacy_policy.md) on GitHub Pages, Google Sites, or Notion for free.

### B. App Access
- Select: *"All functionality is available without special access"* (no login or password required).

### C. Ads
- Select: *"Yes, my app contains ads"* (since Google AdMob is integrated).

### D. Content Rating
- Click **Start questionnaire**:
  - Category: Game
  - Violence, profanity, drugs: Select **No** to all.
  - User interaction: Local pass-and-play only (no online chat).
  - Rating received will be **PEGI 3 / Everyone (E)**, perfect for families and students.

### E. Target Audience
- Select target age groups: **Everyone / All ages (9-12, 13-17, 18+)**.

### F. Data Safety
Google Play asks what data is collected. For an offline game with AdMob:
- **Location:** No
- **Personal info:** No
- **Device or other IDs:** Select **Yes**
  - Purpose: **Advertising or Marketing**
  - Collected / Shared: Shared with Google AdMob
  - Encrypted in transit: Yes

---

## 6. Store Listing & Marketing Copy
Navigate to **Store presence** → **Main store listing**. Use the pre-written copy in [store_listing.txt](file:///workspaces/AllVibesDemo/boxes-app/store_assets/store_listing.txt):
- **App title:** `Boxes: Classic Dot Game`
- **Short description:** `The beloved restaurant placemat dot game! Connect dots, close boxes & win.`
- **Full description:** (Copy text from `store_listing.txt`).
- **Graphics:**
  - App Icon: 512x512 PNG (transparent or with paper background).
  - Feature Graphic: 1024x500 PNG.
  - Phone Screenshots: Take 3–4 screenshots of the Setup Screen, Active Board with initials, and Game Over celebration.

---

## 7. Submit for Review
1. Go to **Release** → **Production** (or **Closed testing**).
2. Click **Create new release**.
3. Upload the downloaded `.aab` file from step 4.
4. Name the release: `1.0.0 (Initial Release)`.
5. Click **Next** → **Review and rollout**.
6. Google typically approves updates within 24–48 hours!
