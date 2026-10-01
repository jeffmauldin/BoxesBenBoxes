import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { adManager } from './adManager';

interface AdBannerProps {
  testMode?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ testMode = true }) => {
  const adUnitId = adManager.getBannerUnitId();

  return (
    <View style={styles.container}>
      <View style={styles.adPlaceholder}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ADVERTISEMENT</Text>
        </View>
        <Text style={styles.subText}>
          {testMode ? `Google AdMob Banner (Test ID: ...${adUnitId.slice(-6)})` : 'Google Mobile Ads'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    backgroundColor: '#F3EFE6',
    borderTopWidth: 1,
    borderTopColor: THEME.paperBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  adPlaceholder: {
    width: '100%',
    maxWidth: 360,
    height: 44,
    backgroundColor: '#FAF7EE',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D4CBB6',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#E0D6C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#655C50',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 11,
    color: '#8D8274',
    fontStyle: 'italic',
  },
});
