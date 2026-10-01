import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player } from '../types/game';
import { THEME } from '../constants/theme';

interface ScoreBarProps {
  players: Player[];
  currentPlayerIndex: number;
  allowUndo: boolean;
  canUndo: boolean;
  onUndo: () => void;
  isGameOver: boolean;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  players,
  currentPlayerIndex,
  allowUndo,
  canUndo,
  onUndo,
  isGameOver,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.playersRow}>
        {players.map((player, idx) => {
          const isCurrent = idx === currentPlayerIndex && !isGameOver;
          return (
            <View
              key={player.id}
              style={[
                styles.playerCard,
                isCurrent && {
                  borderColor: player.color,
                  borderWidth: 2.5,
                  backgroundColor: '#FFFFFF',
                  transform: [{ scale: 1.03 }],
                },
              ]}
            >
              {isCurrent && (
                <View style={[styles.turnPill, { backgroundColor: player.color }]}>
                  <Text style={styles.turnPillText}>TURN</Text>
                </View>
              )}
              <View style={styles.playerHeader}>
                <View
                  style={[
                    styles.initialBadge,
                    { backgroundColor: player.color },
                  ]}
                >
                  <Text style={styles.initialText}>{player.initial}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.playerName,
                    isCurrent && { fontWeight: '700', color: THEME.textPrimary },
                  ]}
                >
                  {player.name}
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreNumber, { color: player.color }]}>
                  {player.score}
                </Text>
                <Text style={styles.scoreLabel}>
                  {player.score === 1 ? 'box' : 'boxes'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {allowUndo && !isGameOver && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.undoButton,
              !canUndo && styles.undoButtonDisabled,
            ]}
            onPress={onUndo}
            disabled={!canUndo}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.undoButtonText,
                !canUndo && styles.undoButtonTextDisabled,
              ]}
            >
              ↺ Undo Move
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  playerCard: {
    flex: 1,
    maxWidth: 140,
    backgroundColor: '#FAF7EE',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: THEME.paperBorder,
    alignItems: 'center',
    shadowColor: THEME.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  turnPill: {
    position: 'absolute',
    top: -9,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 8,
  },
  turnPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  initialBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  playerName: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '600',
    maxWidth: 75,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingRight: 4,
  },
  undoButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#EFE9DA',
    borderWidth: 1,
    borderColor: '#D8CEBA',
  },
  undoButtonDisabled: {
    opacity: 0.4,
  },
  undoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  undoButtonTextDisabled: {
    color: THEME.textMuted,
  },
});
