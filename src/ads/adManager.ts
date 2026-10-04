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

  // Official Google AdMob Test Ad Unit IDs (verified Google sample ads, 100% fill)
  testBannerId: 'ca-app-pub-3940256099942544/6300978111',
  testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',

  // Production Ad Unit IDs:
  prodBannerIdAndroid: 'ca-app-pub-4537394443614417/9964512085',
  prodInterstitialIdAndroid: '',

  // Set forceTestAds: true during testing so test ads load 100% of the time
  // without relying on Google Play Console / AdMob account approval.
  forceTestAds: true,

  // User experience rules:
  // When testing, trigger after every completed game; in prod, every 2 games
  gamesBetweenInterstitials: 1,
  // Cooldown between interstitials (5s during testing, 60s in production)
  cooldownMs: 5 * 1000,

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
    if (this.isInitialized) return;

    if (!MobileAds && (Platform.OS === 'android' || Platform.OS === 'ios')) {
      try {
        const gma = require('react-native-google-mobile-ads');
        MobileAds = gma.default || gma.MobileAds;
        InterstitialAd = gma.InterstitialAd;
        AdEventType = gma.AdEventType;
        TestIds = gma.TestIds;
        MaxAdContentRating = gma.MaxAdContentRating;
        BannerAd = gma.BannerAd;
        BannerAdSize = gma.BannerAdSize;
      } catch (e) {
        console.warn('[AdMob] Error requiring native ads module:', e);
      }
    }

    if (!MobileAds) {
      console.log('[AdMob] MobileAds not available in this environment');
      return;
    }

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
          console.log('[AdMob] Google Mobile Ads SDK initialized');
        }
      }
      this.loadInterstitial();
    } catch (err) {
      console.warn('[AdMob] Initialization warning:', err);
    }
  }

  public getBannerUnitId(): string {
    if (ADMOB_CONFIG.forceTestAds) {
      return TestIds?.BANNER || ADMOB_CONFIG.testBannerId;
    }
    const isProd = !__DEV__;
    if (isProd && Platform.OS === 'android' && ADMOB_CONFIG.prodBannerIdAndroid) {
      return ADMOB_CONFIG.prodBannerIdAndroid;
    }
    return TestIds?.BANNER || ADMOB_CONFIG.testBannerId;
  }

  public getInterstitialUnitId(): string {
    if (ADMOB_CONFIG.forceTestAds) {
      return TestIds?.INTERSTITIAL || ADMOB_CONFIG.testInterstitialId;
    }
    const isProd = !__DEV__;
    if (isProd && Platform.OS === 'android' && ADMOB_CONFIG.prodInterstitialIdAndroid) {
      return ADMOB_CONFIG.prodInterstitialIdAndroid;
    }
    return TestIds?.INTERSTITIAL || ADMOB_CONFIG.testInterstitialId;
  }

  public loadInterstitial(): void {
    if (!InterstitialAd) {
      console.log('[AdMob] InterstitialAd module not available');
      return;
    }

    try {
      const adUnitId = this.getInterstitialUnitId();
      console.log('[AdMob] Pre-loading interstitial with ID:', adUnitId);
      this.interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['puzzle', 'family', 'board game', 'casual'],
      });

      this.interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] Interstitial successfully loaded and ready to display');
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
    const frequency = ADMOB_CONFIG.forceTestAds ? 1 : ADMOB_CONFIG.gamesBetweenInterstitials;
    const cooldown = ADMOB_CONFIG.forceTestAds ? 5000 : ADMOB_CONFIG.cooldownMs;
    const isFrequencyMet = this.gamesCompletedCount % frequency === 0;
    const isCooldownMet = now - this.lastInterstitialTimestamp >= cooldown;

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
        let finished = false;
        const safeFinish = () => {
          if (!finished) {
            finished = true;
            finish();
          }
        };

        const unsubscribeClosed = this.interstitialInstance.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('[AdMob] Interstitial closed by user');
            this.lastInterstitialTimestamp = Date.now();
            this.isLoaded = false;
            unsubscribeClosed();
            this.loadInterstitial(); // Pre-load next ad
            safeFinish();
          }
        );

        const unsubscribeError = this.interstitialInstance.addAdEventListener(
          AdEventType.ERROR,
          (err: any) => {
            console.warn('[AdMob] Interstitial display error:', err);
            this.isLoaded = false;
            unsubscribeError();
            this.loadInterstitial();
            safeFinish();
          }
        );

        this.interstitialInstance.show().catch((err: any) => {
          console.warn('[AdMob] Show failed:', err);
          this.isLoaded = false;
          this.loadInterstitial();
          safeFinish();
        });
      } catch (err) {
        console.warn('[AdMob] Show exception:', err);
        finish();
      }
    } else {
      console.log('[AdMob] Interstitial not ready yet (isLoaded = ' + this.isLoaded + ')');
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
