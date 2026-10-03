import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { GameState } from '../types/game';
import { THEME } from '../constants/theme';
import { adManager } from '../ads/adManager';

interface GameOverModalProps {
  visible: boolean;
  state: GameState;
  onRematch: () => void;
  onNewSetup: () => void;
  onViewHistory: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  state,
  onRematch,
  onNewSetup,
  onViewHistory,
}) => {
  const { players, winnerIds } = state;

  useEffect(() => {
    if (visible) {
      adManager.showInterstitialIfEligible();
    }
  }, [visible]);

  if (!visible) return null;

  const winners = players.filter((p) => winnerIds.includes(p.id));
  const isTie = winners.length > 1;

  let bannerTitle = 'Game Complete!';
  let winnerSubtitle = '';

  if (isTie) {
    bannerTitle = '🤝 A Close Match!';
    winnerSubtitle = `Tied between ${winners.map((w) => w.name).join(' & ')}!`;
  } else if (winners.length === 1) {
    bannerTitle = `🏆 ${winners[0].name} Wins!`;
    winnerSubtitle = `Congratulations with ${winners[0].score} boxes!`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.trophyIcon}>🎉</Text>
          <Text style={styles.title}>{bannerTitle}</Text>
          <Text style={styles.subtitle}>{winnerSubtitle}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>FINAL SCORES</Text>
          <View style={styles.scoresList}>
            {players.map((p) => {
              const isWinner = winnerIds.includes(p.id);
              return (
                <View
                  key={p.id}
                  style={[
                    styles.scoreRow,
                    isWinner && styles.winnerScoreRow,
                  ]}
                >
                  <View style={styles.playerInfo}>
                    <View
                      style={[styles.initialBadge, { backgroundColor: p.color }]}
                    >
                      <Text style={styles.initialText}>{p.initial}</Text>
                    </View>
                    <Text style={[styles.playerName, isWinner && styles.winnerText]}>
                      {p.name}
                    </Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={[styles.scoreValue, { color: p.color }]}>
                      {p.score}
                    </Text>
                    <Text style={styles.boxLabel}>
                      {p.score === 1 ? 'box' : 'boxes'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={onRematch}
            >
              <Text style={styles.primaryButtonText}>🔄 Play Rematch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={onNewSetup}
            >
              <Text style={styles.secondaryButtonText}>⚙ Change Setup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              activeOpacity={0.8}
              onPress={onViewHistory}
            >
              <Text style={styles.outlineButtonText}>📜 View Match Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 25, 20, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FAF7EE',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: THEME.paperBorder,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  trophyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: THEME.paperBorder,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: THEME.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  scoresList: {
    width: '100%',
    gap: 8,
    marginBottom: 22,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    gap: 10,
  },
  initialBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  winnerText: {
    fontWeight: '800',
    color: '#8A5D00',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  boxLabel: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EFE9DA',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8CEBA',
  },
  secondaryButtonText: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButton: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
