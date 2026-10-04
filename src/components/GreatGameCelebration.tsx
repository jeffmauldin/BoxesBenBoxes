import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { GameState } from '../types/game';
import { THEME } from '../constants/theme';
import { adManager } from '../ads/adManager';

interface GreatGameCelebrationProps {
  visible: boolean;
  state: GameState;
  onRematch: () => void;
  onNewSetup: () => void;
  onViewHistory: () => void;
  onClose?: () => void;
}

const CONFETTI_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#FFD54F', '#00ACC1'];

export const GreatGameCelebration: React.FC<GreatGameCelebrationProps> = ({
  visible,
  state,
  onRematch,
  onNewSetup,
  onViewHistory,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Generate 24 animated confetti pieces
  const confettiAnimValues = useRef(
    Array.from({ length: 24 }, () => ({
      y: new Animated.Value(-20),
      x: (Math.random() - 0.5) * 280,
      rot: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 8,
      delay: Math.random() * 400,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate confetti falling
      confettiAnimValues.forEach((item) => {
        Animated.sequence([
          Animated.delay(item.delay),
          Animated.parallel([
            Animated.timing(item.y, {
              toValue: 400,
              duration: 2200 + Math.random() * 800,
              useNativeDriver: true,
            }),
            Animated.timing(item.rot, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      confettiAnimValues.forEach((item) => {
        item.y.setValue(-20);
        item.rot.setValue(0);
      });
    }
  }, [visible]);

  // Give player 1.5 seconds to celebrate and view results before showing ad
  useEffect(() => {
    let adTimer: NodeJS.Timeout | null = null;
    if (visible) {
      adTimer = setTimeout(() => {
        adManager.showInterstitialIfEligible();
      }, 1500);
    }
    return () => {
      if (adTimer) clearTimeout(adTimer);
    };
  }, [visible]);

  const handleRematchPress = () => {
    adManager.showInterstitialIfEligible(() => {
      onRematch();
    });
  };

  const handleNewSetupPress = () => {
    adManager.showInterstitialIfEligible(() => {
      onNewSetup();
    });
  };

  if (!visible) return null;

  const winners = state.players.filter((p) => state.winnerIds.includes(p.id));
  const isTie = winners.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || onNewSetup}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Animated Confetti Rain */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiAnimValues.map((item, idx) => {
            const rotateInterpolate = item.rot.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${(idx % 2 === 0 ? 1 : -1) * 360}deg`],
            });

            return (
              <Animated.View
                key={idx}
                style={[
                  styles.confettiPiece,
                  {
                    width: item.size,
                    height: item.size * 0.6,
                    backgroundColor: item.color,
                    transform: [
                      { translateX: item.x },
                      { translateY: item.y },
                      { rotate: rotateInterpolate },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Main Celebration Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>✨ GREAT GAME! ✨</Text>
            </View>

            <Text style={styles.title}>
              {isTie
                ? '🤝 A Thrilling Tie!'
                : `🏆 ${winners[0].name} Wins!`}
            </Text>

            <Text style={styles.subtitle}>
              {isTie
                ? `Tied between ${winners.map((w) => w.name).join(' & ')}!`
                : `Phenomenal observation & strategy with ${winners[0].score} boxes!`}
            </Text>

            <View style={styles.scoresList}>
              {state.players.map((p) => {
                const isWinner = state.winnerIds.includes(p.id);
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.scoreRow,
                      isWinner && styles.winnerScoreRow,
                    ]}
                  >
                    <View style={styles.playerInfo}>
                      <View style={[styles.avatarBadge, { backgroundColor: p.color }]}>
                        <Text style={styles.avatarText}>{p.initial}</Text>
                      </View>
                      <Text style={[styles.playerName, isWinner && styles.winnerText]}>
                        {p.name} {p.isComputer ? '🤖' : ''}
                      </Text>
                    </View>
                    <View style={styles.scorePill}>
                      <Text style={[styles.scoreNumber, { color: p.color }]}>
                        {p.score}
                      </Text>
                      <Text style={styles.scoreLabel}>
                        {p.score === 1 ? 'box' : 'boxes'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.actions}>
              {/* Primary action to return to setup */}
              <TouchableOpacity
                style={styles.setupBtn}
                onPress={handleNewSetupPress}
                activeOpacity={0.8}
              >
                <Text style={styles.setupBtnText}>⚙ Change Game Setup</Text>
                <Text style={styles.setupBtnSubtext}>
                  Change board size, players & opponents
                </Text>
              </TouchableOpacity>

              {/* Rematch action */}
              <TouchableOpacity
                style={styles.rematchBtn}
                onPress={handleRematchPress}
                activeOpacity={0.8}
              >
                <Text style={styles.rematchBtnText}>🔄 Play Rematch (Same Setup)</Text>
              </TouchableOpacity>

              {/* Option to inspect board */}
              {onClose && (
                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inspectBtnText}>👀 Inspect Finished Board</Text>
                </TouchableOpacity>
              )}

              {/* History action */}
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={onViewHistory}
                activeOpacity={0.7}
              >
                <Text style={styles.historyBtnText}>📜 View Past Match Records</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 20, 15, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confettiPiece: {
    position: 'absolute',
    top: 50,
    borderRadius: 2,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    backgroundColor: '#FAF7EE',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#E6DEC9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAE4D5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.textSecondary,
    lineHeight: 16,
  },
  cardScroll: {
    width: '100%',
  },
  cardScrollContent: {
    alignItems: 'center',
    padding: 20,
  },
  bannerBadge: {
    backgroundColor: THEME.accent,
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  scoresList: {
    width: '100%',
    gap: 8,
    marginBottom: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.paperBorder,
  },
  winnerScoreRow: {
    backgroundColor: THEME.winnerBadgeBg,
    borderColor: THEME.winnerGold,
    borderWidth: 1.5,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  winnerText: {
    fontWeight: '800',
    color: '#8A5D00',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  actions: {
    width: '100%',
    gap: 8,
  },
  setupBtn: {
    backgroundColor: THEME.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  setupBtnSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  rematchBtn: {
    backgroundColor: '#EFE9DA',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8CEBA',
  },
  rematchBtnText: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  inspectBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    alignItems: 'center',
  },
  inspectBtnText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  historyBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  historyBtnText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
