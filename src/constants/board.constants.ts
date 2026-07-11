import { PlayerColor } from '../types/game.types';

export const BOARD_SIZE = 52;
export const HOME_COLUMN_SIZE = 5;
export const CENTER_POSITION = 72;
export const BASE_POSITION = -1;

export const PLAYER_START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const HOME_COLUMN_START: Record<PlayerColor, number> = {
  red: 52,
  green: 57,
  yellow: 62,
  blue: 67,
};

// Each value is the cell directly adjacent (orthogonally) to that color's
// homeColStart, so the visual transition is a clean single-direction step.
export const HOME_ENTRY_POSITION: Record<PlayerColor, number> = {
  red: 50,    // row 7 col 0 → homeColStart row 7 col 1 (step right)
  green: 11,  // row 0 col 7 → homeColStart row 1 col 7 (step down)
  yellow: 24, // row 7 col 14 → homeColStart row 7 col 13 (step left)
  blue: 37,   // row 14 col 7 → homeColStart row 13 col 7 (step up)
};

export const SAFE_POSITIONS: ReadonlyArray<number> = [0, 8, 13, 21, 26, 34, 39, 47];
export const STAR_POSITIONS: ReadonlyArray<number> = [8, 21, 34, 47];

export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// Hex color values for each player color (vivid Ludo King style)
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#e53935',
  green:  '#43a047',
  yellow: '#fdd835',
  blue:   '#1e88e5',
};

export const PLAYER_COLOR_LIGHT: Record<PlayerColor, string> = {
  red:    '#ffcdd2',
  green:  '#c8e6c9',
  yellow: '#fff9c4',
  blue:   '#bbdefb',
};

// ─── 15x15 Board Grid Mapping ──────────────────────────────────────────────────
// Maps position index (0–72) to {row, col} on the 15x15 visual grid.
// Layout follows standard Ludo board: 15x15 grid with 3-wide lanes.
// Row/Col are 0-indexed from top-left.

export interface GridCoord {
  row: number;
  col: number;
}

// Main ring positions 0–51 (clockwise starting Red at top-left lane)
// Standard Ludo board:
//   Top-right home: rows 0-5, cols 9-14
//   Left lane going down: col 6, rows 6-14
//   Bottom lane going right: row 8, cols 0-6
//   Right lane going up: col 8, rows 0-8
//   Top lane going right: row 6, cols 0-6
//   (center row/col = 7)

const MAIN_RING: GridCoord[] = [
  // Red start (position 0) going right along top
  { row: 6, col: 1 }, // 0 - Red start / safe
  { row: 6, col: 2 }, // 1
  { row: 6, col: 3 }, // 2
  { row: 6, col: 4 }, // 3
  { row: 6, col: 5 }, // 4
  { row: 5, col: 6 }, // 5
  { row: 4, col: 6 }, // 6
  { row: 3, col: 6 }, // 7
  { row: 2, col: 6 }, // 8 - Star
  { row: 1, col: 6 }, // 9
  { row: 0, col: 6 }, // 10
  { row: 0, col: 7 }, // 11
  { row: 0, col: 8 }, // 12
  { row: 1, col: 8 }, // 13 - Green start / safe
  { row: 2, col: 8 }, // 14
  { row: 3, col: 8 }, // 15
  { row: 4, col: 8 }, // 16
  { row: 5, col: 8 }, // 17
  { row: 6, col: 9 }, // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21 - Star
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25
  { row: 8, col: 13 }, // 26 - Yellow start / safe
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 }, // 30
  { row: 9, col: 8 }, // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34 - Star
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38
  { row: 13, col: 6 }, // 39 - Blue start / safe
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 }, // 43
  { row: 8, col: 5 }, // 44
  { row: 8, col: 4 }, // 45
  { row: 8, col: 3 }, // 46
  { row: 8, col: 2 }, // 47 - Star
  { row: 8, col: 1 }, // 48
  { row: 8, col: 0 }, // 49
  { row: 7, col: 0 }, // 50
  { row: 6, col: 0 }, // 51
];

// Home columns: 5 tiles per player leading toward center
const RED_HOME_COLUMN: GridCoord[] = [
  { row: 7, col: 1 }, // 52
  { row: 7, col: 2 }, // 53
  { row: 7, col: 3 }, // 54
  { row: 7, col: 4 }, // 55
  { row: 7, col: 5 }, // 56
];

const GREEN_HOME_COLUMN: GridCoord[] = [
  { row: 1, col: 7 }, // 57
  { row: 2, col: 7 }, // 58
  { row: 3, col: 7 }, // 59
  { row: 4, col: 7 }, // 60
  { row: 5, col: 7 }, // 61
];

const YELLOW_HOME_COLUMN: GridCoord[] = [
  { row: 7, col: 13 }, // 62
  { row: 7, col: 12 }, // 63
  { row: 7, col: 11 }, // 64
  { row: 7, col: 10 }, // 65
  { row: 7, col: 9 }, // 66
];

const BLUE_HOME_COLUMN: GridCoord[] = [
  { row: 13, col: 7 }, // 67
  { row: 12, col: 7 }, // 68
  { row: 11, col: 7 }, // 69
  { row: 10, col: 7 }, // 70
  { row: 9, col: 7 }, // 71
];

// Build the full position-to-grid map
export function buildPositionToGrid(): Record<number, GridCoord> {
  const map: Record<number, GridCoord> = {};

  MAIN_RING.forEach((coord, idx) => {
    map[idx] = coord;
  });

  const homeCols = [
    ...RED_HOME_COLUMN,
    ...GREEN_HOME_COLUMN,
    ...YELLOW_HOME_COLUMN,
    ...BLUE_HOME_COLUMN,
  ];
  homeCols.forEach((coord, idx) => {
    map[52 + idx] = coord;
  });

  // Center
  map[72] = { row: 7, col: 7 };

  return map;
}

export const POSITION_TO_GRID: Record<number, GridCoord> = buildPositionToGrid();

// Base positions for each player (4 slots in the colored home area)
export const BASE_SLOTS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
  ],
  green: [
    { row: 1, col: 10 },
    { row: 1, col: 12 },
    { row: 3, col: 10 },
    { row: 3, col: 12 },
  ],
  yellow: [
    { row: 10, col: 10 },
    { row: 10, col: 12 },
    { row: 12, col: 10 },
    { row: 12, col: 12 },
  ],
  blue: [
    { row: 10, col: 1 },
    { row: 10, col: 3 },
    { row: 12, col: 1 },
    { row: 12, col: 3 },
  ],
};

export const DEFAULT_CELL_SIZE = 24; // fallback; actual computed in component from screen width
export const BOARD_GRID_COLS = 15;
export const BOARD_GRID_ROWS = 15;
