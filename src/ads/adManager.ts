import { Platform } from 'react-native';

/**
 * Google AdMob Configuration & Safety Manager
 * 
 * Account: jeffmauldinsoftware@gmail.com
 * App: BoxesBenBoxes (Android)
 * App ID: ca-app-pub-4537394443614417~6765728644
 * Publisher ID: pub-4537394443614417
 */

// Safely resolve native Google Mobile Ads modules across Native, Web, and Jest
let MobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
let MaxAdContentRating: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const gma = require('react-native-google-mobile-ads');
    MobileAds = gma.default || gma.MobileAds;
    InterstitialAd = gma.InterstitialAd;
    AdEventType = gma.AdEventType;
    TestIds = gma.TestIds;
    MaxAdContentRating = gma.MaxAdContentRating;
    BannerAd = gma.BannerAd;
    BannerAdSize = gma.BannerAdSize;
  }
} catch (e) {
  // Graceful fallback for Web, Expo Go, and Jest test environments
}

export { BannerAd, BannerAdSize };

export const ADMOB_CONFIG = {
  // Registered Google AdMob App & Publisher Information
  publisherAccount: 'jeffmauldinsoftware@gmail.com',
  publisherId: 'pub-4537394443614417',
  appIdAndroid: 'ca-app-pub-4537394443614417~6765728644',

  // Official Google AdMob Test Ad Unit IDs (verified Google sample ads)
  testBannerId: 'ca-app-pub-3940256099942544/6300978111',
  testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',

  // Production Ad Unit IDs:
  // Using test IDs until user creates the dedicated Interstitial in AdMob
  prodBannerIdAndroid: 'ca-app-pub-4537394443614417/9964512085',
  prodInterstitialIdAndroid: '',

  // User experience rules:
  // Show interstitial at most once every 2 completed games
  gamesBetweenInterstitials: 2,
  // 60-second cooldown between interstitials to respect player flow
  cooldownMs: 60 * 1000,

  // COPPA & Google Play Families Kid-Safety Enforcement:
  tagForChildDirectedTreatment: true,
  maxAdContentRating: 'G',
  tagForUnderAgeOfConsent: true,
  nonPersonalizedAdsOnly: true,
};

class AdManager {
  private gamesCompletedCount = 0;
  private lastInterstitialTimestamp = 0;
  private interstitialInstance: any = null;
  private isLoaded = false;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || !MobileAds) return;
    this.isInitialized = true;

    try {
      if (typeof MobileAds === 'function') {
        const ads = MobileAds();
        if (ads?.setRequestConfiguration) {
          await ads.setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating?.G,
            tagForChildDirectedTreatment: true,
            tagForUnderAgeOfConsent: true,
          });
        }
        if (ads?.initialize) {
          await ads.initialize();
        }
      }
      this.loadInterstitial();
    } catch (err) {
      console.warn('[AdMob] Initialization warning:', err);
    }
  }

  public getBannerUnitId(): string {
    const isProd = !__DEV__;
    if (isProd && Platform.OS === 'android' && ADMOB_CONFIG.prodBannerIdAndroid) {
      return ADMOB_CONFIG.prodBannerIdAndroid;
    }
    return TestIds?.BANNER || ADMOB_CONFIG.testBannerId;
  }

  public getInterstitialUnitId(): string {
    const isProd = !__DEV__;
    if (isProd && Platform.OS === 'android' && ADMOB_CONFIG.prodInterstitialIdAndroid) {
      return ADMOB_CONFIG.prodInterstitialIdAndroid;
    }
    return TestIds?.INTERSTITIAL || ADMOB_CONFIG.testInterstitialId;
  }

  private loadInterstitial(): void {
    if (!InterstitialAd) return;

    try {
      const adUnitId = this.getInterstitialUnitId();
      this.interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['puzzle', 'family', 'board game', 'casual'],
      });

      this.interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
      });

      this.interstitialInstance.addAdEventListener(AdEventType.ERROR, (err: any) => {
        this.isLoaded = false;
        console.warn('[AdMob] Interstitial load error:', err);
      });

      this.interstitialInstance.load();
    } catch (e) {
      console.warn('[AdMob] Failed to create interstitial:', e);
    }
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

  public showInterstitialIfEligible(onDone?: () => void): void {
    const finish = () => {
      if (onDone) onDone();
    };

    if (!this.shouldShowInterstitial()) {
      finish();
      return;
    }

    if (this.isLoaded && this.interstitialInstance) {
      try {
        const unsubscribeClosed = this.interstitialInstance.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            this.lastInterstitialTimestamp = Date.now();
            this.isLoaded = false;
            unsubscribeClosed();
            this.loadInterstitial(); // Pre-load next ad
            finish();
          }
        );

        this.interstitialInstance.show().catch((err: any) => {
          console.warn('[AdMob] Show error:', err);
          this.isLoaded = false;
          this.loadInterstitial();
          finish();
        });
      } catch (err) {
        console.warn('[AdMob] Show failed:', err);
        finish();
      }
    } else {
      // Ad was not ready yet - continue without blocking user
      if (!this.isLoaded) {
        this.loadInterstitial();
      }
      finish();
    }
  }

  public recordInterstitialShown(): void {
    this.lastInterstitialTimestamp = Date.now();
  }

  public isInterstitialReady(): boolean {
    return this.isLoaded;
  }

  public resetCounters(): void {
    this.gamesCompletedCount = 0;
    this.lastInterstitialTimestamp = 0;
  }
}

export const adManager = new AdManager();
