import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinishedGameRecord } from '../types/game';

const HISTORY_STORAGE_KEY = '@boxes_game_history_v1';
const SETTINGS_STORAGE_KEY = '@boxes_game_settings_v1';

export interface AppSettings {
  defaultPresetId: string;
  allowUndoDefault: boolean;
  soundEnabled: boolean;
  savedPlayers: {
    name: string;
    initial: string;
    color: string;
  }[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultPresetId: 'classic',
  allowUndoDefault: false,
  soundEnabled: true,
  savedPlayers: [
    { name: 'Player 1', initial: '1', color: '#E53935' },
    { name: 'Player 2', initial: '2', color: '#1E88E5' },
    { name: 'Player 3', initial: '3', color: '#43A047' },
  ],
};

export async function loadGameHistory(): Promise<FinishedGameRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FinishedGameRecord[];
  } catch (err) {
    console.error('Error loading game history:', err);
    return [];
  }
}

export async function saveFinishedGame(record: FinishedGameRecord): Promise<void> {
  try {
    const existing = await loadGameHistory();
    const updated = [record, ...existing].slice(0, 50); // Keep last 50 games
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving finished game:', err);
  }
}

export async function clearGameHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing game history:', err);
  }
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading app settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const existing = await loadAppSettings();
    const merged = { ...existing, ...settings };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error saving app settings:', err);
  }
}
