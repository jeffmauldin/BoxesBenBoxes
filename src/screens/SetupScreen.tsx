import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PLAYER_PALETTES, GAME_PRESETS } from '../constants/presets';
import { THEME } from '../constants/theme';
import { ComputerDifficulty, Player } from '../types/game';
import { loadDeviceProfile, saveDeviceProfile } from '../logic/worldSync';

export interface SavedSetupConfig {
  rows?: number;
  cols?: number;
  players?: Omit<Player, 'score'>[];
  numPlayers?: number;
  allowUndo?: boolean;
  selectedPresetId?: string;
}

interface SetupScreenProps {
  onStartGame: (
    rows: number,
    cols: number,
    players: Omit<Player, 'score'>[],
    allowUndo: boolean
  ) => void;
  onOpenHistory: () => void;
  lastSetup?: SavedSetupConfig | null;
}

const SETUP_STORAGE_KEY = '@boxes_saved_setup_v2';

interface PlayerSetupState {
  id: string;
  name: string;
  initial: string;
  color: string;
  isComputer: boolean;
  computerDifficulty: ComputerDifficulty;
}

function buildInitialPlayers(lastPlayers?: Omit<Player, 'score'>[] | null): PlayerSetupState[] {
  const defaultPlayers: PlayerSetupState[] = [
    {
      id: 'p1',
      name: 'Player 1',
      initial: '1',
      color: DEFAULT_PLAYER_PALETTES[0].color,
      isComputer: false,
      computerDifficulty: 'random',
    },
    {
      id: 'p2',
      name: 'Player 2',
      initial: '2',
      color: DEFAULT_PLAYER_PALETTES[1].color,
      isComputer: false,
      computerDifficulty: 'crafty',
    },
    {
      id: 'p3',
      name: 'Player 3',
      initial: '3',
      color: DEFAULT_PLAYER_PALETTES[2].color,
      isComputer: false,
      computerDifficulty: 'random',
    },
    {
      id: 'p4',
      name: 'Player 4',
      initial: '4',
      color: DEFAULT_PLAYER_PALETTES[3].color,
      isComputer: false,
      computerDifficulty: 'random',
    },
  ];

  if (!lastPlayers || lastPlayers.length === 0) {
    return defaultPlayers;
  }

  return defaultPlayers.map((def, idx) => {
    const existing = lastPlayers[idx];
    if (existing) {
      return {
        id: existing.id || def.id,
        name: existing.name || def.name,
        initial: existing.initial || def.initial,
        color: existing.color || def.color,
        isComputer: Boolean(existing.isComputer),
        computerDifficulty: existing.computerDifficulty || def.computerDifficulty,
      };
    }
    return def;
  });
}

const COMPUTER_TYPES: { id: ComputerDifficulty; label: string; initial: string; desc: string }[] = [
  { id: 'random', label: 'Random Dude 🎲', initial: 'RD', desc: 'Makes completely random legal moves' },
  { id: 'sees_boxes', label: 'Sees Boxes Dude 👀', initial: 'SB', desc: 'Finishes any completable box, else moves randomly' },
  { id: 'crafty', label: 'Somewhat Crafty 🦊', initial: 'CD', desc: 'Finishes boxes and avoids giving you an easy box' },
  { id: 'minimizer', label: 'Minimizer Dude 🧠', initial: 'MD', desc: 'When forced to give a box, chooses to give the fewest' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  onOpenHistory,
  lastSetup,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    if (lastSetup?.rows && lastSetup?.cols) {
      const match = GAME_PRESETS.find(
        (p) => p.rows === lastSetup.rows && p.cols === lastSetup.cols
      );
      return match ? match.id : 'custom';
    }
    return 'classic';
  });

  const [customRows, setCustomRows] = useState<number>(() => lastSetup?.rows || 4);
  const [customCols, setCustomCols] = useState<number>(() => lastSetup?.cols || 4);
  const [numPlayers, setNumPlayers] = useState<number>(() =>
    lastSetup?.players?.length ? Math.min(4, Math.max(2, lastSetup.players.length)) : 2
  );
  const [allowUndo, setAllowUndo] = useState<boolean>(() => Boolean(lastSetup?.allowUndo));
  const [playerHandle, setPlayerHandle] = useState<string>('');

  const [players, setPlayers] = useState<PlayerSetupState[]>(() =>
    buildInitialPlayers(lastSetup?.players)
  );

  useEffect(() => {
    loadDeviceProfile().then((profile) => {
      setPlayerHandle(profile.handle);
    });

    if (!lastSetup) {
      AsyncStorage.getItem(SETUP_STORAGE_KEY)
        .then((raw) => {
          if (raw) {
            const saved = JSON.parse(raw);
            if (saved.players && Array.isArray(saved.players) && saved.players.length > 0) {
              setPlayers(saved.players);
            }
            if (saved.numPlayers) setNumPlayers(saved.numPlayers);
            if (saved.selectedPresetId) setSelectedPresetId(saved.selectedPresetId);
            if (saved.customRows) setCustomRows(saved.customRows);
            if (saved.customCols) setCustomCols(saved.customCols);
            if (typeof saved.allowUndo === 'boolean') setAllowUndo(saved.allowUndo);
          }
        })
        .catch(() => {});
    }
  }, [lastSetup]);

  const handleUpdateHandle = (newHandle: string) => {
    setPlayerHandle(newHandle);
    saveDeviceProfile({ handle: newHandle.trim() || undefined });
  };

  const handleOpenTrackerWebsite = () => {
    Linking.openURL('https://jeffmauldin.github.io/BoxesBenBoxes/').catch((err) => {
      console.warn('Could not open tracker website:', err);
    });
  };


  // Anti-computer modal state
  const [pendingComputerChange, setPendingComputerChange] = useState<{
    playerIndex: number;
    difficulty: ComputerDifficulty;
  } | null>(null);

  const handlePlayerNameFocus = (index: number) => {
    const defaultName = `Player ${index + 1}`;
    if (players[index].name.trim().toLowerCase() === defaultName.toLowerCase()) {
      handlePlayerNameChange(index, '');
    }
  };

  const handlePlayerNameBlur = (index: number) => {
    if (players[index].name.trim() === '') {
      handlePlayerNameChange(index, `Player ${index + 1}`);
    }
  };

  const handlePlayerInitialFocus = (index: number) => {
    if (players[index].initial === `${index + 1}`) {
      handlePlayerInitialChange(index, '');
    }
  };

  const handlePlayerInitialBlur = (index: number) => {
    if (players[index].initial.trim() === '') {
      const name = players[index].name.trim();
      const fallbackInitial = name.length > 0 ? name[0].toUpperCase() : `${index + 1}`;
      handlePlayerInitialChange(index, fallbackInitial);
    }
  };

  const handlePlayerNameChange = (index: number, newName: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const initial =
        newName.trim().length > 0 ? newName.trim()[0].toUpperCase() : `${index + 1}`;
      updated[index] = {
        ...updated[index],
        name: newName,
        initial,
      };
      return updated;
    });
  };

  const handlePlayerInitialChange = (index: number, newInitial: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        initial: newInitial.slice(0, 2).toUpperCase(),
      };
      return updated;
    });
  };

// Session-level flag: prompt appears at most once per session
let sessionDismissedComputerPrompt = false;

  const handleSelectOpponentType = (index: number, type: 'human' | ComputerDifficulty) => {
    if (type === 'human') {
      setPlayers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: `Player ${index + 1}`,
          initial: `${index + 1}`,
          isComputer: false,
        };
        return updated;
      });
    } else {
      if (sessionDismissedComputerPrompt) {
        // Already acknowledged for this session, apply directly
        const botDef = COMPUTER_TYPES.find((b) => b.id === type)!;
        setPlayers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            name: botDef.label.split(' ')[0] + ' ' + botDef.label.split(' ')[1],
            initial: botDef.initial,
            isComputer: true,
            computerDifficulty: type,
          };
          return updated;
        });
      } else {
        // Trigger the anti-computer prompt for first time in session
        setPendingComputerChange({ playerIndex: index, difficulty: type });
      }
    }
  };

  const confirmComputerSelection = () => {
    if (!pendingComputerChange) return;
    const { playerIndex, difficulty } = pendingComputerChange;
    const botDef = COMPUTER_TYPES.find((b) => b.id === difficulty)!;

    sessionDismissedComputerPrompt = true; // remember for this session

    setPlayers((prev) => {
      const updated = [...prev];
      updated[playerIndex] = {
        ...updated[playerIndex],
        name: botDef.label.split(' ')[0] + ' ' + botDef.label.split(' ')[1],
        initial: botDef.initial,
        isComputer: true,
        computerDifficulty: difficulty,
      };
      return updated;
    });
    setPendingComputerChange(null);
  };

  const cancelComputerSelection = () => {
    setPendingComputerChange(null);
  };

  const handleStart = () => {
    let rows = 4;
    let cols = 4;

    if (selectedPresetId === 'custom') {
      rows = Math.min(8, Math.max(3, customRows));
      cols = Math.min(8, Math.max(3, customCols));
    } else {
      const preset = GAME_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        rows = preset.rows;
        cols = preset.cols;
      }
    }

    const activePlayers = players.slice(0, numPlayers).map((p, idx) => ({
      id: p.id,
      name: p.name.trim() || `Player ${idx + 1}`,
      initial: p.initial.trim() || `${idx + 1}`,
      color: p.color,
      isComputer: p.isComputer,
      computerDifficulty: p.computerDifficulty,
    }));

    // Save setup to AsyncStorage
    const setupToSave = {
      players,
      numPlayers,
      selectedPresetId,
      customRows,
      customCols,
      allowUndo,
    };
    AsyncStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setupToSave)).catch(() => {});

    onStartGame(rows, cols, activePlayers, allowUndo);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeLabel}>RESTAURANT PLACEMAT CLASSIC • v1.0.4</Text>
              <Text style={styles.title}>BoxesBenBoxes</Text>
            </View>
            <TouchableOpacity
              style={styles.headerHistoryBtn}
              activeOpacity={0.7}
              onPress={onOpenHistory}
            >
              <Text style={styles.headerHistoryBtnText}>📜 Records</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Connect dots, close squares, and claim your initials!
          </Text>
        </View>

      {/* 1. Grid Size Presets */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>1. CHOOSE GRID SIZE</Text>
        <Text style={styles.sectionHelp}>
          Select from quick presets or customize your paper dot grid
        </Text>

        <View style={styles.presetGrid}>
          {GAME_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  isSelected && styles.presetButtonActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedPresetId(preset.id)}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    isSelected && styles.presetLabelActive,
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.presetDesc,
                    isSelected && styles.presetDescActive,
                  ]}
                >
                  {preset.description}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.presetButton,
              selectedPresetId === 'custom' && styles.presetButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedPresetId('custom')}
          >
            <Text
              style={[
                styles.presetLabel,
                selectedPresetId === 'custom' && styles.presetLabelActive,
              ]}
            >
              Custom Size
            </Text>
            <Text
              style={[
                styles.presetDesc,
                selectedPresetId === 'custom' && styles.presetDescActive,
              ]}
            >
              Pick your own Rows × Cols
            </Text>
          </TouchableOpacity>
        </View>

        {selectedPresetId === 'custom' && (
          <View style={styles.customGridConfig}>
            <View style={styles.customStepper}>
              <Text style={styles.stepperLabel}>Dots Rows (Height):</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCustomRows((r) => Math.max(3, r - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{customRows}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCustomRows((r) => Math.min(8, r + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.customStepper}>
              <Text style={styles.stepperLabel}>Dots Cols (Width):</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCustomCols((c) => Math.max(3, c - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{customCols}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCustomCols((c) => Math.min(8, c + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 2. Players Setup & Opponent Selection */}
      <View style={styles.sectionCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>2. PLAYERS & OPPONENTS</Text>
          <View style={styles.playerCountSelector}>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countBtn,
                  numPlayers === count && styles.countBtnActive,
                ]}
                onPress={() => setNumPlayers(count)}
              >
                <Text
                  style={[
                    styles.countBtnText,
                    numPlayers === count && styles.countBtnTextActive,
                  ]}
                >
                  {count} Players
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.playerInputsList}>
          {players.slice(0, numPlayers).map((player, idx) => (
            <View key={player.id} style={styles.playerCardWrapper}>
              <View style={styles.playerInputCard}>
                <View
                  style={[styles.colorSwatch, { backgroundColor: player.color }]}
                />
                <View style={styles.inputColName}>
                  <Text style={styles.inputMiniLabel}>
                    Player {idx + 1} {player.isComputer ? '(Computer)' : '(Person)'}
                  </Text>
                  <TextInput
                    style={styles.nameTextInput}
                    value={player.name}
                    editable={!player.isComputer}
                    onFocus={() => handlePlayerNameFocus(idx)}
                    onBlur={() => handlePlayerNameBlur(idx)}
                    onChangeText={(text) => handlePlayerNameChange(idx, text)}
                    placeholder={`Player ${idx + 1}`}
                    placeholderTextColor={THEME.textMuted}
                    selectTextOnFocus={true}
                  />
                </View>
                <View style={styles.inputColInitial}>
                  <Text style={styles.inputMiniLabel}>Initial</Text>
                  <TextInput
                    style={styles.initialTextInput}
                    value={player.initial}
                    maxLength={2}
                    editable={!player.isComputer}
                    onFocus={() => handlePlayerInitialFocus(idx)}
                    onBlur={() => handlePlayerInitialBlur(idx)}
                    onChangeText={(text) => handlePlayerInitialChange(idx, text)}
                    placeholder={`${idx + 1}`}
                    placeholderTextColor={THEME.textMuted}
                    selectTextOnFocus={true}
                  />
                </View>
              </View>

              {/* Opponent Selector for Player 2, 3, 4 */}
              {idx > 0 && (
                <View style={styles.opponentSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typePill,
                      !player.isComputer && styles.typePillActive,
                    ]}
                    onPress={() => handleSelectOpponentType(idx, 'human')}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        !player.isComputer && styles.typePillTextActive,
                      ]}
                    >
                      Person 👤
                    </Text>
                  </TouchableOpacity>

                  {COMPUTER_TYPES.map((bot) => {
                    const isSelected =
                      player.isComputer && player.computerDifficulty === bot.id;
                    return (
                      <TouchableOpacity
                        key={bot.id}
                        style={[
                          styles.typePill,
                          isSelected && styles.typePillActive,
                        ]}
                        onPress={() => handleSelectOpponentType(idx, bot.id)}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            isSelected && styles.typePillTextActive,
                          ]}
                        >
                          {bot.label.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 3. Options & Rules */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. OPTIONS</Text>
        <View style={styles.optionRow}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Allow Move Undo</Text>
            <Text style={styles.optionSubtitle}>
              Default is OFF for authentic paper-and-pencil commitment.
            </Text>
          </View>
          <Switch
            value={allowUndo}
            onValueChange={setAllowUndo}
            trackColor={{ false: '#D9D2C2', true: THEME.accent }}
            thumbColor={allowUndo ? '#FFFFFF' : '#F4F0E6'}
          />
        </View>

        <View style={styles.optionDivider} />

        <View style={styles.handleSection}>
          <View style={styles.handleHeaderRow}>
            <Text style={styles.optionTitle}>Public / Family Handle</Text>
            <Text style={styles.handleBadge}>Live Cloud Sync</Text>
          </View>
          <Text style={styles.optionSubtitle}>
            Your display name shown on the world match feed website.
          </Text>
          <TextInput
            style={styles.handleInputField}
            value={playerHandle}
            onChangeText={handleUpdateHandle}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }}
            placeholder="e.g. Ben & Dad"
            placeholderTextColor={THEME.textMuted}
            maxLength={22}
            autoCorrect={false}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.trackerLinkBtn}
            activeOpacity={0.7}
            onPress={handleOpenTrackerWebsite}
          >
            <Text style={styles.trackerLinkText}>🌐 View World Match Tracker ↗</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionDivider} />

        <TouchableOpacity
          style={styles.historyOptionRow}
          activeOpacity={0.7}
          onPress={onOpenHistory}
        >
          <Text style={styles.historyOptionText}>📜 View Past Game Records</Text>
          <Text style={styles.historyOptionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Sticky Bottom Bar with Start Button */}
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.8}
        onPress={handleStart}
      >
        <Text style={styles.startButtonText}>✏ Start Game</Text>
      </TouchableOpacity>
    </View>

    {/* Anti-Computer Opponent Dialog */}
    <Modal
      visible={Boolean(pendingComputerChange)}
      transparent
      animationType="fade"
      onRequestClose={cancelComputerSelection}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalIcon}>👫</Text>
          <Text style={styles.modalTitle}>Play a Real Person?</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to play the computer? It's much more fun to play with a person right next to you!
          </Text>
          <View style={styles.modalActionGroup}>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={cancelComputerSelection}
            >
              <Text style={styles.modalConfirmBtnText}>
                You're right, let's play a person!
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalProceedBtn}
              onPress={confirmComputerSelection}
            >
              <Text style={styles.modalProceedBtnText}>
                Play computer anyway
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </KeyboardAvoidingView>
);
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: THEME.paperBackground,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.paperBackground,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  headerHistoryBtn: {
    backgroundColor: '#EFE8D8',
    borderWidth: 1.5,
    borderColor: '#DCD4C0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerHistoryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: THEME.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FAF7EE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.paperBorder,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: 0.8,
  },
  sectionHelp: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  presetGrid: {
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.paperBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetButtonActive: {
    borderColor: THEME.accent,
    backgroundColor: '#FFF8F3',
    borderWidth: 2,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  presetLabelActive: {
    color: THEME.accent,
  },
  presetDesc: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  presetDescActive: {
    color: THEME.accent,
    fontWeight: '600',
  },
  customGridConfig: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.paperBorder,
    gap: 10,
  },
  customStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#EFE9DA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerCountSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  countBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#EFE9DA',
  },
  countBtnActive: {
    backgroundColor: THEME.accent,
  },
  countBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  countBtnTextActive: {
    color: '#FFFFFF',
  },
  playerInputsList: {
    gap: 12,
  },
  playerCardWrapper: {
    gap: 6,
  },
  playerInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.paperBorder,
    borderRadius: 12,
    padding: 8,
    gap: 10,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  inputColName: {
    flex: 1,
  },
  inputColInitial: {
    width: 60,
  },
  inputMiniLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  nameTextInput: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DEC9',
  },
  initialTextInput: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.textPrimary,
    textAlign: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DEC9',
  },
  opponentSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 4,
  },
  typePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EAE4D5',
    borderRadius: 10,
  },
  typePillActive: {
    backgroundColor: THEME.accent,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  optionDivider: {
    height: 1,
    backgroundColor: THEME.paperBorder,
    marginVertical: 10,
  },
  handleSection: {
    marginTop: 4,
  },
  handleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.accent,
    backgroundColor: '#FDEEE9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  handleInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.paperBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginTop: 8,
  },
  trackerLinkBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  trackerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.accent,
    textDecorationLine: 'underline',
  },
  historyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  historyOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  historyOptionArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.textMuted,
  },
  bottomBar: {
    backgroundColor: '#FAF5E8',
    borderTopWidth: 2,
    borderTopColor: THEME.paperBorder,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 10,
  },
  startButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyButton: {
    backgroundColor: '#EFE9DA',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8CEBA',
  },
  historyButtonText: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
    maxWidth: 360,
    backgroundColor: '#FAF7EE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.paperBorder,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  modalActionGroup: {
    width: '100%',
    gap: 10,
  },
  modalConfirmBtn: {
    backgroundColor: THEME.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalProceedBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalProceedBtnText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
