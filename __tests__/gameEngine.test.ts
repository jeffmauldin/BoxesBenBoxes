import { describe, test, expect } from '@jest/globals';
import {
  claimEdge,
  createInitialState,
  undoMove,
} from '../src/logic/gameEngine';

describe('Dots and Boxes Game Engine', () => {
  const players = [
    { id: 'p1', name: 'Alice', initial: 'A', color: '#E53935' },
    { id: 'p2', name: 'Bob', initial: 'B', color: '#1E88E5' },
  ];

  test('initializes 3x3 dot grid (2x2 boxes = 4 boxes) properly', () => {
    const state = createInitialState(3, 3, players);
    expect(state.gridRows).toBe(3);
    expect(state.gridCols).toBe(3);
    expect(state.players[0].score).toBe(0);
    expect(state.players[1].score).toBe(0);
    expect(state.currentPlayerIndex).toBe(0);
    // Horizontal edges: 3 * (3 - 1) = 6
    expect(Object.keys(state.horizontalEdges)).toHaveLength(6);
    // Vertical edges: (3 - 1) * 3 = 6
    expect(Object.keys(state.verticalEdges)).toHaveLength(6);
    // Total edges: 12
    expect(state.totalEdgesCount).toBe(12);
    // Total boxes: 2 * 2 = 4
    expect(Object.keys(state.boxes)).toHaveLength(4);
    expect(state.isGameOver).toBe(false);
  });

  test('normal moves advance turn between players without completing box', () => {
    let state = createInitialState(3, 3, players);
    expect(state.currentPlayerIndex).toBe(0); // Alice

    // Alice claims h_0_0
    state = claimEdge(state, 'horizontal', 0, 0);
    expect(state.horizontalEdges['h_0_0']).toBe('p1');
    expect(state.currentPlayerIndex).toBe(1); // Turn passes to Bob

    // Bob claims v_0_0
    state = claimEdge(state, 'vertical', 0, 0);
    expect(state.verticalEdges['v_0_0']).toBe('p2');
    expect(state.currentPlayerIndex).toBe(0); // Passes back to Alice
  });

  test('completing a box gives point and bonus turn', () => {
    let state = createInitialState(3, 3, players);

    // Box b_0_0 needs: h_0_0 (top), h_1_0 (bottom), v_0_0 (left), v_0_1 (right)
    state = claimEdge(state, 'horizontal', 0, 0); // Alice (p1)
    state = claimEdge(state, 'horizontal', 1, 0); // Bob (p2)
    state = claimEdge(state, 'vertical', 0, 0);   // Alice (p1)

    expect(state.currentPlayerIndex).toBe(1); // Bob's turn
    expect(state.players[1].score).toBe(0);

    // Bob completes the box by drawing v_0_1 (right side of box b_0_0)
    state = claimEdge(state, 'vertical', 0, 1);

    expect(state.boxes['b_0_0'].completedByPlayerId).toBe('p2');
    expect(state.boxes['b_0_0'].playerInitial).toBe('B');
    expect(state.players[1].score).toBe(1);

    // Bob must go again! (Bonus turn)
    expect(state.currentPlayerIndex).toBe(1);
  });

  test('completing 2 boxes with a single edge awards 2 points and bonus turn', () => {
    let state = createInitialState(3, 3, players);

    // We prepare box (0,0) and box (0,1) such that the shared edge is v_0_1
    // Box (0,0): h_0_0, h_1_0, v_0_0, v_0_1
    // Box (0,1): h_0_1, h_1_1, v_0_1, v_0_2
    state = claimEdge(state, 'horizontal', 0, 0); // p1
    state = claimEdge(state, 'horizontal', 1, 0); // p2
    state = claimEdge(state, 'vertical', 0, 0);   // p1
    state = claimEdge(state, 'horizontal', 0, 1); // p2
    state = claimEdge(state, 'horizontal', 1, 1); // p1
    state = claimEdge(state, 'vertical', 0, 2);   // p2

    // Now v_0_1 will close BOTH box (0,0) and box (0,1)!
    // Current player is p1 (Alice)
    expect(state.currentPlayerIndex).toBe(0);
    const p1ScoreBefore = state.players[0].score;

    state = claimEdge(state, 'vertical', 0, 1);

    expect(state.boxes['b_0_0'].completedByPlayerId).toBe('p1');
    expect(state.boxes['b_0_1'].completedByPlayerId).toBe('p1');
    expect(state.players[0].score).toBe(p1ScoreBefore + 2);
    // p1 gets another turn
    expect(state.currentPlayerIndex).toBe(0);
  });

  test('3 players rotation works correctly', () => {
    const threePlayers = [
      { id: 'p1', name: 'Alice', initial: 'A', color: '#E53935' },
      { id: 'p2', name: 'Bob', initial: 'B', color: '#1E88E5' },
      { id: 'p3', name: 'Charlie', initial: 'C', color: '#43A047' },
    ];
    let state = createInitialState(3, 3, threePlayers);
    expect(state.currentPlayerIndex).toBe(0); // Alice

    state = claimEdge(state, 'horizontal', 0, 0);
    expect(state.currentPlayerIndex).toBe(1); // Bob

    state = claimEdge(state, 'horizontal', 0, 1);
    expect(state.currentPlayerIndex).toBe(2); // Charlie

    state = claimEdge(state, 'horizontal', 1, 0);
    expect(state.currentPlayerIndex).toBe(0); // Alice
  });

  test('undo mechanism restores edge, box, score, and previous player turn', () => {
    let state = createInitialState(3, 3, players, true); // allowUndo = true

    // Alice claims h_0_0
    state = claimEdge(state, 'horizontal', 0, 0);
    expect(state.horizontalEdges['h_0_0']).toBe('p1');
    expect(state.currentPlayerIndex).toBe(1);

    // Undo Alice's move
    state = undoMove(state);
    expect(state.horizontalEdges['h_0_0']).toBeNull();
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.claimedEdgesCount).toBe(0);

    // Test undo on box completion
    state = claimEdge(state, 'horizontal', 0, 0); // p1
    state = claimEdge(state, 'horizontal', 1, 0); // p2
    state = claimEdge(state, 'vertical', 0, 0);   // p1
    // Bob completes box
    state = claimEdge(state, 'vertical', 0, 1);
    expect(state.players[1].score).toBe(1);
    expect(state.boxes['b_0_0'].completedByPlayerId).toBe('p2');

    // Bob undos the completion move
    state = undoMove(state);
    expect(state.players[1].score).toBe(0);
    expect(state.boxes['b_0_0'].completedByPlayerId).toBeUndefined();
    expect(state.verticalEdges['v_0_1']).toBeNull();
    expect(state.currentPlayerIndex).toBe(1); // Restored to Bob's turn
  });

  test('undo is disallowed when allowUndo is false or game is over', () => {
    let state = createInitialState(3, 3, players, false); // allowUndo = false
    state = claimEdge(state, 'horizontal', 0, 0);
    const beforeUndo = state;
    state = undoMove(state);
    expect(state).toEqual(beforeUndo);
  });
});
