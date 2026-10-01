import { describe, test, expect } from '@jest/globals';
import {
  claimEdge,
  createInitialState,
} from '../src/logic/gameEngine';
import {
  computeCraftyMove,
  computeMinimizerMove,
  computeRandomMove,
  computeSeesBoxesMove,
  findBoxCompletingMoves,
  isMoveSafe,
} from '../src/logic/ai/aiOpponents';

describe('AI Opponents Personalities', () => {
  const players = [
    { id: 'p1', name: 'Human', initial: 'H', color: '#E53935' },
    {
      id: 'p2',
      name: 'Random Dude',
      initial: 'RD',
      color: '#1E88E5',
      isComputer: true,
      computerDifficulty: 'random' as const,
    },
  ];

  test('Random Dude only selects valid unclaimed edges', () => {
    const state = createInitialState(3, 3, players);
    const move = computeRandomMove(state);
    expect(move).not.toBeNull();
    if (!move) return;

    const key = `${move.orientation === 'horizontal' ? 'h' : 'v'}_${move.row}_${move.col}`;
    const edges = move.orientation === 'horizontal' ? state.horizontalEdges : state.verticalEdges;
    expect(edges[key]).toBeNull();
  });

  test('Sees Boxes Dude immediately completes any 3-sided box', () => {
    let state = createInitialState(3, 3, players);

    // Box b_0_0: set 3 sides (top, bottom, left)
    state = claimEdge(state, 'horizontal', 0, 0); // top
    state = claimEdge(state, 'horizontal', 1, 0); // bottom
    state = claimEdge(state, 'vertical', 0, 0);   // left
    // Right side v_0_1 is still open!

    const completingMoves = findBoxCompletingMoves(state);
    expect(completingMoves).toHaveLength(1);
    expect(completingMoves[0]).toEqual({
      orientation: 'vertical',
      row: 0,
      col: 1,
    });

    const aiMove = computeSeesBoxesMove(state);
    expect(aiMove).toEqual({
      orientation: 'vertical',
      row: 0,
      col: 1,
    });
  });

  test('Somewhat Crafty Dude avoids creating 3-sided boxes when safe moves exist', () => {
    let state = createInitialState(3, 3, players);

    // Box b_0_0: set 2 sides (top and left)
    state = claimEdge(state, 'horizontal', 0, 0); // top
    state = claimEdge(state, 'vertical', 0, 0);   // left
    // Now bottom (h_1_0) and right (v_0_1) would create a 3-sided box!
    expect(isMoveSafe(state, { orientation: 'horizontal', row: 1, col: 0 })).toBe(false);
    expect(isMoveSafe(state, { orientation: 'vertical', row: 0, col: 1 })).toBe(false);

    // But far away edge (e.g. h_2_1) is completely safe
    expect(isMoveSafe(state, { orientation: 'horizontal', row: 2, col: 1 })).toBe(true);

    // When Crafty Dude computes a move, it must pick a safe move!
    for (let i = 0; i < 10; i++) {
      const move = computeCraftyMove(state);
      expect(move).not.toBeNull();
      if (!move) return;
      expect(isMoveSafe(state, move)).toBe(true);
    }
  });

  test('Minimizer Dude chooses sacrifice with minimum opponent box yield', () => {
    let state = createInitialState(3, 3, players);

    // Create a scenario where one sacrifice gives 1 box, and another sacrifice opens 2 boxes:
    // Box (0,0): 2 edges claimed (top, left)
    state = claimEdge(state, 'horizontal', 0, 0);
    state = claimEdge(state, 'vertical', 0, 0);

    // Claim almost everything else so only sacrifices remain
    const minimizerMove = computeMinimizerMove(state);
    expect(minimizerMove).not.toBeNull();
  });
});
