import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types/game';

const PROFILE_STORAGE_KEY = '@boxes_device_profile_v1';
const GLOBAL_SYNC_ENDPOINT = 'https://api.boxesbenboxes.com/api/matches'; // Target global cloud API

export interface DeviceProfile {
  deviceId: string;
  handle: string; // e.g. "Ben & Dad", "PlacematPlayer-42"
  optOutGlobalSync: boolean;
}

export interface CompactMatchPayload {
  matchId: string;
  timestamp: string;
  deviceId: string;
  handle: string;
  gridRows: number;
  gridCols: number;
  totalBoxes: number;
  players: {
    name: string;
    initial: string;
    color: string;
    score: number;
    isComputer: boolean;
  }[];
  winnerNames: string[];
  isTie: boolean;
  boardBoxes: string; // Compact string of winner player indices, e.g. "010011010"
}

// Generate a random 8-character ID
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Default random handle generator
function generateDefaultHandle(): string {
  const adjectives = ['Swift', 'Clever', 'Sunny', 'Merry', 'Happy', 'Lucky', 'Crafty', 'Cosmic'];
  const nouns = ['Player', 'DotMaster', 'Boxer', 'Pencil', 'Crayon', 'Friend'];
  const num = Math.floor(100 + Math.random() * 900);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}-${num}`;
}

/**
 * Load or initialize the persistent device profile
 */
export async function loadDeviceProfile(): Promise<DeviceProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DeviceProfile;
    }
  } catch (e) {
    // Fall back to default
  }

  const initialProfile: DeviceProfile = {
    deviceId: `dev_${generateRandomId()}`,
    handle: generateDefaultHandle(),
    optOutGlobalSync: false,
  };

  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initialProfile));
  } catch (e) {
    // Ignore storage errors
  }

  return initialProfile;
}

/**
 * Update the player's community handle or opt-out preference
 */
export async function saveDeviceProfile(profile: Partial<DeviceProfile>): Promise<DeviceProfile> {
  const current = await loadDeviceProfile();
  const updated: DeviceProfile = { ...current, ...profile };
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage errors
  }
  return updated;
}

/**
 * Compress the final GameState into an ultra-compact payload (<500 bytes)
 */
export function serializeGameStateForWorld(
  state: GameState,
  profile: DeviceProfile
): CompactMatchPayload {
  const playerIndexMap = new Map<string, number>();
  state.players.forEach((p, idx) => playerIndexMap.set(p.id, idx));

  // Build compact string of box winners: row by row
  let boardBoxes = '';
  for (let r = 0; r < state.gridRows - 1; r++) {
    for (let c = 0; c < state.gridCols - 1; c++) {
      const box = state.boxes[`b_${r}_${c}`];
      if (box?.completedByPlayerId && playerIndexMap.has(box.completedByPlayerId)) {
        boardBoxes += playerIndexMap.get(box.completedByPlayerId);
      } else {
        boardBoxes += '.'; // Unclaimed (if aborted early)
      }
    }
  }

  const winners = state.players.filter((p) => state.winnerIds.includes(p.id));

  return {
    matchId: `m_${Date.now()}_${generateRandomId()}`,
    timestamp: new Date().toISOString(),
    deviceId: profile.deviceId,
    handle: profile.handle || 'Anonymous Player',
    gridRows: state.gridRows,
    gridCols: state.gridCols,
    totalBoxes: (state.gridRows - 1) * (state.gridCols - 1),
    players: state.players.map((p) => ({
      name: p.name,
      initial: p.initial,
      color: p.color,
      score: p.score,
      isComputer: Boolean(p.isComputer),
    })),
    winnerNames: winners.map((w) => w.name),
    isTie: winners.length > 1,
    boardBoxes,
  };
}

/**
 * Fire-and-forget submission to the global match feed.
 * 
 * Rules:
 * - Never blocks the UI or delays game celebration.
 * - Enforces a strict 2.5s abort timeout.
 * - If offline or request fails, the match is silently dropped.
 */
export async function submitGlobalMatchResult(state: GameState): Promise<void> {
  try {
    const profile = await loadDeviceProfile();
    if (profile.optOutGlobalSync) {
      return;
    }

    const payload = serializeGameStateForWorld(state, profile);

    // Timeout-protected fetch call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetch(GLOBAL_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[WorldSync] Game outcome synced or endpoint acknowledged:', res.status);
        }
      })
      .catch((_err) => {
        clearTimeout(timeoutId);
        // Silently drop if offline or unreachable
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[WorldSync] Offline or endpoint unreachable. Match record silently dropped.');
        }
      });
  } catch (e) {
    // Never allow world sync to crash gameplay
  }
}
