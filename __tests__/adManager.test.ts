jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (dict: any) => dict.android,
  },
}));

import { adManager, ADMOB_CONFIG } from '../src/ads/adManager';

describe('adManager', () => {
  beforeEach(() => {
    adManager.resetCounters();
  });

  it('provides production Banner and Interstitial Unit IDs when forceTestAds is false', () => {
    expect(ADMOB_CONFIG.forceTestAds).toBe(false);
    expect(adManager.getBannerUnitId()).toBe('ca-app-pub-4537394443614417/9964512085');
    expect(adManager.getInterstitialUnitId()).toBe('ca-app-pub-4537394443614417/7650088360');
  });

  it('enforces strict COPPA & Google Play Families G-rated kid-safe ad configuration', () => {
    expect(ADMOB_CONFIG.tagForChildDirectedTreatment).toBe(true);
    expect(ADMOB_CONFIG.maxAdContentRating).toBe('G');
    expect(ADMOB_CONFIG.tagForUnderAgeOfConsent).toBe(true);
    expect(ADMOB_CONFIG.nonPersonalizedAdsOnly).toBe(true);
  });

  it('falls back to official Google Test Unit IDs when forceTestAds is true', () => {
    ADMOB_CONFIG.forceTestAds = true;
    try {
      expect(adManager.getBannerUnitId()).toBe('ca-app-pub-3940256099942544/6300978111');
      expect(adManager.getInterstitialUnitId()).toBe('ca-app-pub-3940256099942544/1033173712');
    } finally {
      ADMOB_CONFIG.forceTestAds = false;
    }
  });

  it('evaluates interstitial eligibility after 1 game in test mode', () => {
    // In test mode, gamesBetweenInterstitials is 1
    const eligibleOnFirstGame = adManager.shouldShowInterstitial();
    expect(eligibleOnFirstGame).toBe(true);
  });

  it('respects cooldown between back-to-back checks', () => {
    adManager.recordInterstitialShown();
    // Immediately calling shouldShowInterstitial right after showing ad should be false due to cooldown
    const eligibleImmediately = adManager.shouldShowInterstitial();
    expect(eligibleImmediately).toBe(false);
  });

  it('invokes callback immediately if interstitial is not loaded', () => {
    const mockCallback = jest.fn();
    adManager.showInterstitialIfEligible(mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('strictly prevents a second interstitial during the same game cycle', () => {
    // First trigger of game cycle
    adManager.showInterstitialIfEligible();
    // Subsequent checks during the same celebration or menu transition must be false
    expect(adManager.shouldShowInterstitial()).toBe(false);

    const secondCallback = jest.fn();
    adManager.showInterstitialIfEligible(secondCallback);
    expect(secondCallback).toHaveBeenCalled();
  });

  it('allows a new interstitial once next game is started and cooldown passes', () => {
    adManager.showInterstitialIfEligible();
    expect(adManager.shouldShowInterstitial()).toBe(false);

    // Starting a new game resets the current game flag
    adManager.onGameStarted();

    // Still blocked if within cooldown window
    expect(adManager.shouldShowInterstitial()).toBe(false);

    // Fast-forward beyond cooldown
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 20000);
    expect(adManager.shouldShowInterstitial()).toBe(true);
    jest.restoreAllMocks();
  });
});
