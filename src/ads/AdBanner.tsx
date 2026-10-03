import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { THEME } from '../constants/theme';
import { adManager, BannerAd, BannerAdSize } from './adManager';

interface AdBannerProps {
  testMode?: boolean;
}

const PLACEMAT_TIPS = [
  '✏️ Restaurant Classic: Connect dots, close boxes, and claim your initials!',
  '💡 Pro Tip: Avoid adding a 3rd side to any box until you can chain them all!',
  '🍕 BoxesBenBoxes: Authentic paper & pencil pass-and-play fun!',
  '🧠 Strategy: Sometimes giving away 2 boxes lets you win the remaining 6!',
  '👫 Play together: Games are always more fun with someone across the table!',
];

export const AdBanner: React.FC<AdBannerProps> = ({ testMode = true }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  // Rotate tips occasionally
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PLACEMAT_TIPS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const adUnitId = adManager.getBannerUnitId();
  const canShowBanner = Boolean(
    BannerAd &&
    BannerAdSize &&
    !adFailed &&
    (Platform.OS === 'android' || Platform.OS === 'ios')
  );

  return (
    <View style={styles.container}>
      {canShowBanner ? (
        <View style={[styles.bannerWrapper, !adLoaded && styles.hiddenBanner]}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              setAdLoaded(true);
              setAdFailed(false);
            }}
            onAdFailedToLoad={(error: any) => {
              console.log('[AdMob] Banner load failed, displaying placemat tips:', error?.message);
              setAdFailed(true);
            }}
          />
        </View>
      ) : null}

      {(!canShowBanner || !adLoaded) && (
        <View style={styles.adPlaceholder}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PLACEMAT TIP</Text>
          </View>
          <Text numberOfLines={1} style={styles.subText}>
            {PLACEMAT_TIPS[tipIndex]}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: '#F4EFE6',
    borderTopWidth: 1,
    borderTopColor: THEME.paperBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bannerWrapper: {
    width: 320,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenBanner: {
    opacity: 0,
    position: 'absolute',
  },
  adPlaceholder: {
    width: '100%',
    maxWidth: 380,
    height: 38,
    backgroundColor: '#FAF7EE',
    borderWidth: 1,
    borderColor: '#E2DCB8',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  badge: {
    backgroundColor: '#E8E0C5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A7A56',
    letterSpacing: 0.5,
  },
  subText: {
    flex: 1,
    fontSize: 12,
    color: THEME.textMuted,
    fontStyle: 'italic',
  },
});
