export type EdgeOrientation = 'horizontal' | 'vertical';

export type ComputerDifficulty = 'random' | 'sees_boxes' | 'crafty' | 'minimizer';

export interface Player {
  id: string;
  name: string;
  initial: string;
  color: string;
  score: number;
  isComputer?: boolean;
  computerDifficulty?: ComputerDifficulty;
}

export interface Edge {
  id: string; // e.g., 'h_0_1' or 'v_1_0'
  orientation: EdgeOrientation;
  row: number;
  col: number;
  claimedByPlayerId?: string;
}

export interface Box {
  id: string; // e.g., 'b_0_0'
  row: number;
  col: number;
  completedByPlayerId?: string;
  playerInitial?: string;
  color?: string;
}

export interface MoveRecord {
  edgeId: string;
  orientation: EdgeOrientation;
  row: number;
  col: number;
  playerId: string;
  boxesCompleted: string[]; // box IDs completed by this move
  previousCurrentPlayerIndex: number;
}

export interface GameState {
  gridRows: number; // Number of dots vertically
  gridCols: number; // Number of dots horizontally
  players: Player[];
  currentPlayerIndex: number;
  horizontalEdges: Record<string, string | null>; // key -> playerId or null
  verticalEdges: Record<string, string | null>;   // key -> playerId or null
  boxes: Record<string, Box>;                     // key -> Box object
  historyStack: MoveRecord[];                     // Stack of moves for undo
  allowUndo: boolean;
  isGameOver: boolean;
  winnerIds: string[];
  totalEdgesCount: number;
  claimedEdgesCount: number;
}

export interface FinishedGameRecord {
  id: string;
  date: string; // ISO date string
  gridRows: number;
  gridCols: number;
  players: {
    id: string;
    name: string;
    initial: string;
    color: string;
    score: number;
    isComputer?: boolean;
  }[];
  winnerNames: string[];
  isTie: boolean;
}

export interface GamePreset {
  id: string;
  label: string;
  description: string;
  rows: number;
  cols: number;
}
