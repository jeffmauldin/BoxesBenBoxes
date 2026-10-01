import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { FinishedGameRecord } from '../types/game';
import { clearGameHistory, loadGameHistory } from '../logic/storage';
import { THEME } from '../constants/theme';

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<FinishedGameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    const records = await loadGameHistory();
    setHistory(records);
    setLoading(false);
  };

  const handleClearHistory = async () => {
    await clearGameHistory();
    setHistory([]);
    setConfirmResetVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Records</Text>
        {history.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setConfirmResetVisible(true)}
          >
            <Text style={styles.clearBtnText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Finished Games Yet</Text>
            <Text style={styles.emptySubtitle}>
              Play a match to record final scores and family bragging rights!
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {history.map((record) => {
              const formattedDate = new Date(record.date).toLocaleDateString(
                undefined,
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              return (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.gridTag}>
                      {record.gridRows}×{record.gridCols} Dots (
                      {(record.gridRows - 1) * (record.gridCols - 1)} Boxes)
                    </Text>
                    <Text style={styles.recordDate}>{formattedDate}</Text>
                  </View>

                  <View style={styles.winnerTextContainer}>
                    <Text style={styles.winnerText}>
                      {record.isTie
                        ? `🤝 Tie: ${record.winnerNames.join(' & ')}`
                        : `🏆 Winner: ${record.winnerNames.join(', ')}`}
                    </Text>
                  </View>

                  <View style={styles.playersScoreRow}>
                    {record.players.map((p) => (
                      <View key={p.id} style={styles.playerScoreChip}>
                        <View
                          style={[
                            styles.chipColorBadge,
                            { backgroundColor: p.color },
                          ]}
                        >
                          <Text style={styles.chipInitial}>{p.initial}</Text>
                        </View>
                        <Text style={styles.chipName} numberOfLines={1}>
                          {p.name}:
                        </Text>
                        <Text
                          style={[
                            styles.chipScore,
                            record.winnerNames.includes(p.name) &&
                              styles.chipScoreWinner,
                          ]}
                        >
                          {p.score}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal for Reset */}
      <Modal
        visible={confirmResetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmResetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>🗑</Text>
            <Text style={styles.modalTitle}>Reset Match Records?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to clear all saved match scores? This cannot be undone.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmResetVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleClearHistory}
              >
                <Text style={styles.confirmDeleteBtnText}>Yes, Clear All</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.paperBorder,
    backgroundColor: '#FAF7EE',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFE9DA',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#FAF7EE',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: THEME.paperBorder,
    padding: 14,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridTag: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent,
  },
  recordDate: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  winnerTextContainer: {
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  playersScoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.paperBorder,
    gap: 5,
  },
  chipColorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInitial: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  chipName: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
  },
  chipScore: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  chipScoreWinner: {
    color: '#E65100',
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
  modalIcon: {
    fontSize: 36,
    marginBottom: 8,
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
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
