import {
  ComputerDifficulty,
  EdgeOrientation,
  GameState,
} from '../../types/game';
import { getAdjacentBoxCoordinates } from '../gameEngine';

export interface MoveCoordinate {
  orientation: EdgeOrientation;
  row: number;
  col: number;
}

/**
 * Returns all currently available (unclaimed) edges on the board.
 */
export function getAllLegalMoves(state: GameState): MoveCoordinate[] {
  const moves: MoveCoordinate[] = [];

  // Horizontal edges
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols - 1; c++) {
      if (!state.horizontalEdges[`h_${r}_${c}`]) {
        moves.push({ orientation: 'horizontal', row: r, col: c });
      }
    }
  }

  // Vertical edges
  for (let r = 0; r < state.gridRows - 1; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      if (!state.verticalEdges[`v_${r}_${c}`]) {
        moves.push({ orientation: 'vertical', row: r, col: c });
      }
    }
  }

  return moves;
}

/**
 * Calculates how many sides of a box are currently claimed (0 to 4),
 * and returns the remaining unclaimed edges if any.
 */
export function inspectBox(
  r: number,
  c: number,
  horizontalEdges: Record<string, string | null>,
  verticalEdges: Record<string, string | null>
): { degree: number; missingEdges: MoveCoordinate[] } {
  const sides: { coord: MoveCoordinate; isClaimed: boolean }[] = [
    {
      coord: { orientation: 'horizontal', row: r, col: c },
      isClaimed: Boolean(horizontalEdges[`h_${r}_${c}`]),
    },
    {
      coord: { orientation: 'horizontal', row: r + 1, col: c },
      isClaimed: Boolean(horizontalEdges[`h_${r + 1}_${c}`]),
    },
    {
      coord: { orientation: 'vertical', row: r, col: c },
      isClaimed: Boolean(verticalEdges[`v_${r}_${c}`]),
    },
    {
      coord: { orientation: 'vertical', row: r, col: c + 1 },
      isClaimed: Boolean(verticalEdges[`v_${r}_${c + 1}`]),
    },
  ];

  let degree = 0;
  const missingEdges: MoveCoordinate[] = [];

  for (const side of sides) {
    if (side.isClaimed) {
      degree++;
    } else {
      missingEdges.push(side.coord);
    }
  }

  return { degree, missingEdges };
}

/**
 * Finds all completable boxes (degree === 3) and returns their missing 4th edge.
 */
export function findBoxCompletingMoves(state: GameState): MoveCoordinate[] {
  const completingMoves: MoveCoordinate[] = [];
  const seenKeys = new Set<string>();

  for (let r = 0; r < state.gridRows - 1; r++) {
    for (let c = 0; c < state.gridCols - 1; c++) {
      const { degree, missingEdges } = inspectBox(
        r,
        c,
        state.horizontalEdges,
        state.verticalEdges
      );
      if (degree === 3 && missingEdges.length === 1) {
        const move = missingEdges[0];
        const key = `${move.orientation}_${move.row}_${move.col}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          completingMoves.push(move);
        }
      }
    }
  }

  return completingMoves;
}

/**
 * 1. "Random Dude": Selects any legal move purely at random.
 */
export function computeRandomMove(state: GameState): MoveCoordinate | null {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * legalMoves.length);
  return legalMoves[randomIndex];
}

/**
 * 2. "Sees Boxes Dude": Takes any available 3-sided box.
 * If none are completable, falls back to a random move.
 */
export function computeSeesBoxesMove(state: GameState): MoveCoordinate | null {
  const boxMoves = findBoxCompletingMoves(state);
  if (boxMoves.length > 0) {
    return boxMoves[0];
  }
  return computeRandomMove(state);
}

/**
 * Checks if a move is "safe" (i.e. does not increase any adjacent box's degree from 2 to 3,
 * which would give an opponent a free box on their next turn).
 */
export function isMoveSafe(state: GameState, move: MoveCoordinate): boolean {
  const adjacentBoxes = getAdjacentBoxCoordinates(
    move.orientation,
    move.row,
    move.col,
    state.gridRows,
    state.gridCols
  );

  for (const { row, col } of adjacentBoxes) {
    const { degree } = inspectBox(
      row,
      col,
      state.horizontalEdges,
      state.verticalEdges
    );
    // If adjacent box already has 2 edges, adding this 3rd edge creates an easy box for opponent!
    if (degree === 2) {
      return false;
    }
  }

  return true;
}

/**
 * 3. "Somewhat Crafty Dude":
 * - Priority 1: Take any available box.
 * - Priority 2: Filter for safe moves (moves that do not create 3-sided boxes).
 * - Priority 3: If only sacrifice moves exist, pick any move.
 */
export function computeCraftyMove(state: GameState): MoveCoordinate | null {
  // 1. Take any available box
  const boxMoves = findBoxCompletingMoves(state);
  if (boxMoves.length > 0) {
    return boxMoves[0];
  }

  // 2. Look for safe moves
  const legalMoves = getAllLegalMoves(state);
  const safeMoves = legalMoves.filter((m) => isMoveSafe(state, m));

  if (safeMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * safeMoves.length);
    return safeMoves[randomIndex];
  }

  // 3. Forced to give a box
  return computeRandomMove(state);
}

/**
 * Simulates the opponent's greedy chain reaction if a sacrifice move is made,
 * returning the total number of boxes the opponent would be able to capture.
 */
function simulateSacrificeCost(state: GameState, candidateMove: MoveCoordinate): number {
  const simulatedH = { ...state.horizontalEdges };
  const simulatedV = { ...state.verticalEdges };

  // Apply candidate move
  const key = `${candidateMove.orientation === 'horizontal' ? 'h' : 'v'}_${candidateMove.row}_${candidateMove.col}`;
  if (candidateMove.orientation === 'horizontal') {
    simulatedH[key] = 'temp_ai';
  } else {
    simulatedV[key] = 'temp_ai';
  }

  let capturedBoxes = 0;
  let foundNewBox = true;

  // Simulate opponent greedily capturing all degree-3 boxes in chain
  while (foundNewBox) {
    foundNewBox = false;
    for (let r = 0; r < state.gridRows - 1; r++) {
      for (let c = 0; c < state.gridCols - 1; c++) {
        const { degree, missingEdges } = inspectBox(r, c, simulatedH, simulatedV);
        if (degree === 3 && missingEdges.length === 1) {
          const nextEdge = missingEdges[0];
          const edgeKey = `${nextEdge.orientation === 'horizontal' ? 'h' : 'v'}_${nextEdge.row}_${nextEdge.col}`;
          if (nextEdge.orientation === 'horizontal') {
            simulatedH[edgeKey] = 'temp_opponent';
          } else {
            simulatedV[edgeKey] = 'temp_opponent';
          }
          capturedBoxes++;
          foundNewBox = true;
          break; // restart check with new edge placed
        }
      }
      if (foundNewBox) break;
    }
  }

  return capturedBoxes;
}

/**
 * 4. "Minimizer Dude":
 * - Priority 1: Take any available box.
 * - Priority 2: Make safe moves if available.
 * - Priority 3: When forced to sacrifice, evaluate all sacrifice candidates
 *   and pick the one that gives the opponent the FEWEST boxes!
 */
export function computeMinimizerMove(state: GameState): MoveCoordinate | null {
  // 1. Complete box if available
  const boxMoves = findBoxCompletingMoves(state);
  if (boxMoves.length > 0) {
    return boxMoves[0];
  }

  // 2. Safe moves
  const legalMoves = getAllLegalMoves(state);
  const safeMoves = legalMoves.filter((m) => isMoveSafe(state, m));
  if (safeMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * safeMoves.length);
    return safeMoves[randomIndex];
  }

  // 3. Minimize sacrifice cost
  let bestMove = legalMoves[0];
  let minCost = Infinity;

  for (const move of legalMoves) {
    const cost = simulateSacrificeCost(state, move);
    if (cost < minCost) {
      minCost = cost;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Master dispatcher for AI moves based on selected difficulty.
 */
export function computeAIMove(
  state: GameState,
  difficulty: ComputerDifficulty = 'random'
): MoveCoordinate | null {
  switch (difficulty) {
    case 'random':
      return computeRandomMove(state);
    case 'sees_boxes':
      return computeSeesBoxesMove(state);
    case 'crafty':
      return computeCraftyMove(state);
    case 'minimizer':
      return computeMinimizerMove(state);
    default:
      return computeRandomMove(state);
  }
}
