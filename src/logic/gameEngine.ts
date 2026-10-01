import {
  Box,
  EdgeOrientation,
  GameState,
  MoveRecord,
  Player,
} from '../types/game';

export function createInitialState(
  gridRows: number,
  gridCols: number,
  players: Omit<Player, 'score'>[],
  allowUndo: boolean = false
): GameState {
  const horizontalEdges: Record<string, string | null> = {};
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols - 1; c++) {
      horizontalEdges[`h_${r}_${c}`] = null;
    }
  }

  const verticalEdges: Record<string, string | null> = {};
  for (let r = 0; r < gridRows - 1; r++) {
    for (let c = 0; c < gridCols; c++) {
      verticalEdges[`v_${r}_${c}`] = null;
    }
  }

  const boxes: Record<string, Box> = {};
  for (let r = 0; r < gridRows - 1; r++) {
    for (let c = 0; c < gridCols - 1; c++) {
      const id = `b_${r}_${c}`;
      boxes[id] = { id, row: r, col: c };
    }
  }

  const totalEdgesCount =
    gridRows * (gridCols - 1) + (gridRows - 1) * gridCols;

  const initializedPlayers: Player[] = players.map((p) => ({
    ...p,
    score: 0,
  }));

  return {
    gridRows,
    gridCols,
    players: initializedPlayers,
    currentPlayerIndex: 0,
    horizontalEdges,
    verticalEdges,
    boxes,
    historyStack: [],
    allowUndo,
    isGameOver: false,
    winnerIds: [],
    totalEdgesCount,
    claimedEdgesCount: 0,
  };
}

export function isEdgeClaimed(
  state: GameState,
  orientation: EdgeOrientation,
  row: number,
  col: number
): boolean {
  const key = `${orientation === 'horizontal' ? 'h' : 'v'}_${row}_${col}`;
  const edges =
    orientation === 'horizontal' ? state.horizontalEdges : state.verticalEdges;
  return edges[key] !== null && edges[key] !== undefined;
}

export function isBoxComplete(
  boxRow: number,
  boxCol: number,
  horizontalEdges: Record<string, string | null>,
  verticalEdges: Record<string, string | null>
): boolean {
  const top = horizontalEdges[`h_${boxRow}_${boxCol}`];
  const bottom = horizontalEdges[`h_${boxRow + 1}_${boxCol}`];
  const left = verticalEdges[`v_${boxRow}_${boxCol}`];
  const right = verticalEdges[`v_${boxRow}_${boxCol + 1}`];

  return Boolean(top && bottom && left && right);
}

export function getAdjacentBoxCoordinates(
  orientation: EdgeOrientation,
  row: number,
  col: number,
  gridRows: number,
  gridCols: number
): { row: number; col: number }[] {
  const coords: { row: number; col: number }[] = [];

  if (orientation === 'horizontal') {
    // Edge (r, c) is on row r.
    // Box above is at (r - 1, c) if r > 0.
    if (row > 0) {
      coords.push({ row: row - 1, col });
    }
    // Box below is at (r, c) if r < gridRows - 1.
    if (row < gridRows - 1) {
      coords.push({ row, col });
    }
  } else {
    // Vertical edge (r, c) is on column c.
    // Box to left is at (r, c - 1) if c > 0.
    if (col > 0) {
      coords.push({ row, col: col - 1 });
    }
    // Box to right is at (r, c) if c < gridCols - 1.
    if (col < gridCols - 1) {
      coords.push({ row, col });
    }
  }

  return coords;
}

export function claimEdge(
  state: GameState,
  orientation: EdgeOrientation,
  row: number,
  col: number
): GameState {
  if (state.isGameOver) {
    return state;
  }

  const edgeKey = `${orientation === 'horizontal' ? 'h' : 'v'}_${row}_${col}`;
  const currentEdgeMap =
    orientation === 'horizontal' ? state.horizontalEdges : state.verticalEdges;

  if (currentEdgeMap[edgeKey] !== null && currentEdgeMap[edgeKey] !== undefined) {
    // Edge is already claimed
    return state;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const nextHorizontal = { ...state.horizontalEdges };
  const nextVertical = { ...state.verticalEdges };

  if (orientation === 'horizontal') {
    nextHorizontal[edgeKey] = currentPlayer.id;
  } else {
    nextVertical[edgeKey] = currentPlayer.id;
  }

  // Check adjacent boxes for completion
  const adjacentBoxes = getAdjacentBoxCoordinates(
    orientation,
    row,
    col,
    state.gridRows,
    state.gridCols
  );

  const nextBoxes = { ...state.boxes };
  const completedBoxIds: string[] = [];

  for (const { row: bRow, col: bCol } of adjacentBoxes) {
    const boxId = `b_${bRow}_${bCol}`;
    const existingBox = nextBoxes[boxId];

    if (!existingBox.completedByPlayerId) {
      if (isBoxComplete(bRow, bCol, nextHorizontal, nextVertical)) {
        completedBoxIds.push(boxId);
        nextBoxes[boxId] = {
          ...existingBox,
          completedByPlayerId: currentPlayer.id,
          playerInitial: currentPlayer.initial,
          color: currentPlayer.color,
        };
      }
    }
  }

  const nextClaimedEdgesCount = state.claimedEdgesCount + 1;
  const didCompleteBoxes = completedBoxIds.length > 0;

  // Update player score if boxes were completed
  const nextPlayers = state.players.map((p, idx) => {
    if (idx === state.currentPlayerIndex) {
      return {
        ...p,
        score: p.score + completedBoxIds.length,
      };
    }
    return p;
  });

  // Next player turn: If active player completed at least one box, they keep turn.
  // Otherwise, turn passes to next player.
  const nextPlayerIndex = didCompleteBoxes
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  // Check game over
  const totalBoxesCount = (state.gridRows - 1) * (state.gridCols - 1);
  const totalBoxesCompleted = Object.values(nextBoxes).filter(
    (b) => b.completedByPlayerId
  ).length;

  const isGameOver = totalBoxesCompleted === totalBoxesCount;
  let winnerIds: string[] = [];

  if (isGameOver) {
    let maxScore = -1;
    for (const p of nextPlayers) {
      if (p.score > maxScore) {
        maxScore = p.score;
      }
    }
    winnerIds = nextPlayers
      .filter((p) => p.score === maxScore)
      .map((p) => p.id);
  }

  const moveRecord: MoveRecord = {
    edgeId: edgeKey,
    orientation,
    row,
    col,
    playerId: currentPlayer.id,
    boxesCompleted: completedBoxIds,
    previousCurrentPlayerIndex: state.currentPlayerIndex,
  };

  const nextHistoryStack = state.allowUndo
    ? [...state.historyStack, moveRecord]
    : [];

  return {
    ...state,
    horizontalEdges: nextHorizontal,
    verticalEdges: nextVertical,
    boxes: nextBoxes,
    players: nextPlayers,
    currentPlayerIndex: nextPlayerIndex,
    claimedEdgesCount: nextClaimedEdgesCount,
    isGameOver,
    winnerIds,
    historyStack: nextHistoryStack,
  };
}

export function undoMove(state: GameState): GameState {
  if (!state.allowUndo || state.isGameOver || state.historyStack.length === 0) {
    return state;
  }

  const lastMove = state.historyStack[state.historyStack.length - 1];
  const nextHistory = state.historyStack.slice(0, -1);

  const nextHorizontal = { ...state.horizontalEdges };
  const nextVertical = { ...state.verticalEdges };

  if (lastMove.orientation === 'horizontal') {
    nextHorizontal[lastMove.edgeId] = null;
  } else {
    nextVertical[lastMove.edgeId] = null;
  }

  const nextBoxes = { ...state.boxes };
  for (const boxId of lastMove.boxesCompleted) {
    const existing = nextBoxes[boxId];
    if (existing) {
      nextBoxes[boxId] = {
        id: boxId,
        row: existing.row,
        col: existing.col,
        completedByPlayerId: undefined,
        playerInitial: undefined,
        color: undefined,
      };
    }
  }

  // Restore player's score
  const nextPlayers = state.players.map((p) => {
    if (p.id === lastMove.playerId) {
      return {
        ...p,
        score: Math.max(0, p.score - lastMove.boxesCompleted.length),
      };
    }
    return p;
  });

  return {
    ...state,
    horizontalEdges: nextHorizontal,
    verticalEdges: nextVertical,
    boxes: nextBoxes,
    players: nextPlayers,
    currentPlayerIndex: lastMove.previousCurrentPlayerIndex,
    claimedEdgesCount: Math.max(0, state.claimedEdgesCount - 1),
    historyStack: nextHistory,
    isGameOver: false,
    winnerIds: [],
  };
}
