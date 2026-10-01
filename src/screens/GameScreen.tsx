import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { EdgeOrientation, FinishedGameRecord, GameState, Player } from '../types/game';
import {
  claimEdge,
  createInitialState,
  undoMove,
} from '../logic/gameEngine';
import { computeAIMove } from '../logic/ai/aiOpponents';
import { saveFinishedGame } from '../logic/storage';
import { ScoreBar } from '../components/ScoreBar';
import { BoardView } from '../components/BoardView';
import { GreatGameCelebration } from '../components/GreatGameCelebration';
import { AdBanner } from '../ads/AdBanner';
import { THEME } from '../constants/theme';

interface GameScreenProps {
  gridRows: number;
  gridCols: number;
  players: Omit<Player, 'score'>[];
  allowUndo: boolean;
  onExitToMenu: () => void;
  onOpenHistory: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gridRows,
  gridCols,
  players,
  allowUndo,
  onExitToMenu,
  onOpenHistory,
}) => {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(gridRows, gridCols, players, allowUndo)
  );

  const [quitModalVisible, setQuitModalVisible] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pencilAnim = useRef(new Animated.Value(0)).current;

  // AI thinking pencil wiggle animation
  useEffect(() => {
    if (isAIThinking) {
      const wiggleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pencilAnim, {
            toValue: -1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(pencilAnim, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(pencilAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      wiggleLoop.start();
      return () => wiggleLoop.stop();
    } else {
      pencilAnim.setValue(0);
    }
  }, [isAIThinking]);

  // Automatically save match result when game ends
  useEffect(() => {
    if (gameState.isGameOver) {
      const winners = gameState.players.filter((p) =>
        gameState.winnerIds.includes(p.id)
      );

      const record: FinishedGameRecord = {
        id: `match_${Date.now()}`,
        date: new Date().toISOString(),
        gridRows: gameState.gridRows,
        gridCols: gameState.gridCols,
        players: gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          initial: p.initial,
          color: p.color,
          score: p.score,
          isComputer: p.isComputer,
        })),
        winnerNames: winners.map((w) => w.name),
        isTie: winners.length > 1,
      };

      saveFinishedGame(record);
    }
  }, [gameState.isGameOver]);

  // AI Turn Handling with observation delay
  useEffect(() => {
    if (gameState.isGameOver) {
      setIsAIThinking(false);
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isComputer) {
      setIsAIThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        const move = computeAIMove(
          gameState,
          currentPlayer.computerDifficulty || 'random'
        );

        if (move) {
          setGameState((current) =>
            claimEdge(current, move.orientation, move.row, move.col)
          );
        }
        setIsAIThinking(false);
      }, 700); // 700ms observation delay with pencil wiggle
    } else {
      setIsAIThinking(false);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [gameState.currentPlayerIndex, gameState.isGameOver, gameState.claimedEdgesCount]);

  const handleClaimEdge = (
    orientation: EdgeOrientation,
    row: number,
    col: number
  ) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isComputer || isAIThinking) {
      return; // prevent human input during AI turn
    }
    setGameState((current) => claimEdge(current, orientation, row, col));
  };

  const handleUndo = () => {
    if (isAIThinking) return;
    setGameState((current) => undoMove(current));
  };

  const handleRematch = () => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAIThinking(false);
    setGameState(createInitialState(gridRows, gridCols, players, allowUndo));
  };

  const activePlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setQuitModalVisible(true)}
        >
          <Text style={styles.navBtnText}>✕ Exit</Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>
            {gridRows}×{gridCols} Dots ({(gridRows - 1) * (gridCols - 1)} Boxes)
          </Text>
          {isAIThinking && (
            <View style={styles.thinkingPill}>
              <Animated.Text
                style={[
                  styles.pencilWiggle,
                  {
                    transform: [
                      {
                        rotate: pencilAnim.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: ['-25deg', '0deg', '25deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ✏️
              </Animated.Text>
              <Text style={styles.thinkingPillText}>
                {activePlayer.name} is thinking...
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.navBtn} onPress={onOpenHistory}>
          <Text style={styles.navBtnText}>📜</Text>
        </TouchableOpacity>
      </View>

      {/* Live Player Score Bar & Undo Button */}
      <ScoreBar
        players={gameState.players}
        currentPlayerIndex={gameState.currentPlayerIndex}
        allowUndo={gameState.allowUndo}
        canUndo={gameState.historyStack.length > 0 && !isAIThinking}
        onUndo={handleUndo}
        isGameOver={gameState.isGameOver}
      />

      {/* Main Interactive Board */}
      <View style={styles.boardContainer}>
        <BoardView state={gameState} onClaimEdge={handleClaimEdge} />
      </View>

      {/* Non-intrusive Kid-Friendly Ad Banner at bottom */}
      <AdBanner testMode={true} />

      {/* Animated Great Game Celebration */}
      <GreatGameCelebration
        visible={gameState.isGameOver}
        state={gameState}
        onRematch={handleRematch}
        onNewSetup={onExitToMenu}
        onViewHistory={onOpenHistory}
      />

      {/* Exit Confirmation Modal */}
      <Modal
        visible={quitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Leave Current Match?</Text>
            <Text style={styles.modalMessage}>
              Current match progress will be lost. Return to the setup screen?
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setQuitModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Continue Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmExitBtn}
                onPress={() => {
                  setQuitModalVisible(false);
                  if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
                  onExitToMenu();
                }}
              >
                <Text style={styles.confirmExitBtnText}>Exit to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.paperBackground,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.paperBorder,
    backgroundColor: '#FAF7EE',
  },
  navBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#EFE9DA',
    borderRadius: 8,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 0.4,
  },
  thinkingPill: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pencilWiggle: {
    fontSize: 13,
  },
  thinkingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E65100',
  },
  boardContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 25, 20, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FAF7EE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.paperBorder,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFE9DA',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  confirmExitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: THEME.accent,
    alignItems: 'center',
  },
  confirmExitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
