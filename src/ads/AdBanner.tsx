import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { adManager } from './adManager';

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

  // Rotate tips occasionally
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PLACEMAT_TIPS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const adUnitId = adManager.getBannerUnitId();

  return (
    <View style={styles.container}>
      <View style={styles.adPlaceholder}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PLACEMAT TIP</Text>
        </View>
        <Text numberOfLines={1} style={styles.subText}>
          {PLACEMAT_TIPS[tipIndex]}
        </Text>
      </View>
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
  adPlaceholder: {
    width: '100%',
    maxWidth: 380,
    height: 38,
    backgroundColor: '#FAF7EE',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D4CBB6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  badge: {
    backgroundColor: '#EAE1CE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#706456',
    letterSpacing: 0.6,
  },
  subText: {
    flex: 1,
    fontSize: 11,
    color: '#6E6254',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
