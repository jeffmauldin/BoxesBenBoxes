import {
  serializeGameStateForWorld,
  loadDeviceProfile,
  saveDeviceProfile,
  submitGlobalMatchResult,
} from '../src/logic/worldSync';
import { createInitialState, claimEdge } from '../src/logic/gameEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('worldSync - Global Match Serialization & Profile Management', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('loadDeviceProfile initializes a unique deviceId and handle', async () => {
    const profile = await loadDeviceProfile();
    expect(profile.deviceId).toMatch(/^dev_/);
    expect(profile.handle).toBeTruthy();
    expect(profile.optOutGlobalSync).toBe(false);
  });

  test('saveDeviceProfile updates the player handle', async () => {
    await saveDeviceProfile({ handle: 'Ben & Dad' });
    const profile = await loadDeviceProfile();
    expect(profile.handle).toBe('Ben & Dad');
  });

  test('serializeGameStateForWorld produces ultra-compact payload with box string', () => {
    const players = [
      { id: 'p1', name: 'Ben', initial: 'B', color: '#1E88E5', isComputer: false },
      { id: 'p2', name: 'Dad', initial: 'D', color: '#E53935', isComputer: false },
    ];
    let state = createInitialState(3, 3, players, false); // 3x3 dots = 4 boxes
    // Complete first box (0,0) with 4 edges
    state = claimEdge(state, 'horizontal', 0, 0);
    state = claimEdge(state, 'vertical', 0, 0);
    state = claimEdge(state, 'vertical', 0, 1);
    state = claimEdge(state, 'horizontal', 1, 0); // completes b_0_0

    const profile = { deviceId: 'dev_123', handle: 'Ben & Dad', optOutGlobalSync: false };
    const payload = serializeGameStateForWorld(state, profile);

    expect(payload.deviceId).toBe('dev_123');
    expect(payload.handle).toBe('Ben & Dad');
    expect(payload.gridRows).toBe(3);
    expect(payload.gridCols).toBe(3);
    expect(payload.totalBoxes).toBe(4);
    expect(payload.boardBoxes.length).toBe(4);
    // Player 1 completed the box on the 4th move
    expect(payload.boardBoxes[0]).toBe('1');
    expect(payload.boardBoxes.slice(1)).toBe('...');
    // Ensure size is tiny
    const serialized = JSON.stringify(payload);
    expect(serialized.length).toBeLessThan(500);
  });

  test('submitGlobalMatchResult drops silently if offline / network error without crashing', async () => {
    const players = [
      { id: 'p1', name: 'Ben', initial: 'B', color: '#1E88E5', isComputer: false },
      { id: 'p2', name: 'Dad', initial: 'D', color: '#E53935', isComputer: false },
    ];
    const state = createInitialState(3, 3, players, false);

    // Mock global fetch failure (network offline)
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    // Must resolve cleanly without throwing
    await expect(submitGlobalMatchResult(state)).resolves.not.toThrow();
  });
});
