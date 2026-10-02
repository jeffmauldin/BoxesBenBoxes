import { Platform } from 'react-native';

/**
 * Google AdMob Configuration & Safety Manager
 * 
 * Account: jeffmauldinsoftware@gmail.com
 * App: BoxesBenBoxes (Android)
 * App ID: ca-app-pub-4537394443614417~6765728644
 * Publisher ID: pub-4537394443614417
 */

export const ADMOB_CONFIG = {
  // Registered Google AdMob App & Publisher Information
  publisherAccount: 'jeffmauldinsoftware@gmail.com',
  publisherId: 'pub-4537394443614417',
  appIdAndroid: 'ca-app-pub-4537394443614417~6765728644',

  // Official Google AdMob Test Ad Unit IDs (used during development & Expo Go)
  testBannerId: Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }),
  testInterstitialId: Platform.select({
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }),

  // Insert your production AdMob unit IDs here from your AdMob dashboard:
  prodBannerIdAndroid: 'ca-app-pub-4537394443614417/9964512085',
  prodInterstitialIdAndroid: '',
  prodBannerIdIOS: '',
  prodInterstitialIdIOS: '',

  // User experience rules:
  // Show interstitial at most once every N games
  gamesBetweenInterstitials: 2,
  // Minimum time between interstitials (in ms): 120 seconds
  cooldownMs: 120 * 1000,

  // COPPA & Google Play Families Kid-Safety Enforcement:
  // Explicitly filters out alcohol, gambling, mature, or unrated ads
  tagForChildDirectedTreatment: true,
  maxAdContentRating: 'G', // G: General audiences only
  tagForUnderAgeOfConsent: true,
  nonPersonalizedAdsOnly: true,
};

class AdManager {
  private gamesCompletedCount = 0;
  private lastInterstitialTimestamp = 0;

  public getBannerUnitId(): string {
    const isProd = !__DEV__;
    if (isProd && Platform.OS === 'android' && ADMOB_CONFIG.prodBannerIdAndroid) {
      return ADMOB_CONFIG.prodBannerIdAndroid;
    }
    if (isProd && Platform.OS === 'ios' && ADMOB_CONFIG.prodBannerIdIOS) {
      return ADMOB_CONFIG.prodBannerIdIOS;
    }
    return ADMOB_CONFIG.testBannerId;
  }

  public shouldShowInterstitial(): boolean {
    this.gamesCompletedCount += 1;
    const now = Date.now();
    const isFrequencyMet =
      this.gamesCompletedCount % ADMOB_CONFIG.gamesBetweenInterstitials === 0;
    const isCooldownMet =
      now - this.lastInterstitialTimestamp >= ADMOB_CONFIG.cooldownMs;

    return isFrequencyMet && isCooldownMet;
  }

  public recordInterstitialShown(): void {
    this.lastInterstitialTimestamp = Date.now();
  }

  public resetCounters(): void {
    this.gamesCompletedCount = 0;
    this.lastInterstitialTimestamp = 0;
  }
}

export const adManager = new AdManager();
