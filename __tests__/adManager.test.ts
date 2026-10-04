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

  it('provides official Google Test Banner Unit ID when forceTestAds is true', () => {
    expect(ADMOB_CONFIG.forceTestAds).toBe(true);
    const bannerId = adManager.getBannerUnitId();
    expect(bannerId).toBe(ADMOB_CONFIG.testBannerId);
    expect(bannerId).toBe('ca-app-pub-3940256099942544/6300978111');
  });

  it('provides official Google Test Interstitial Unit ID when forceTestAds is true', () => {
    expect(ADMOB_CONFIG.forceTestAds).toBe(true);
    const interstitialId = adManager.getInterstitialUnitId();
    expect(interstitialId).toBe(ADMOB_CONFIG.testInterstitialId);
    expect(interstitialId).toBe('ca-app-pub-3940256099942544/1033173712');
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
});
