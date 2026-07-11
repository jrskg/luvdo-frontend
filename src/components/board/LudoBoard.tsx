import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import {
  BOARD_GRID_COLS,
  BOARD_GRID_ROWS,
  PLAYER_COLOR_HEX,
  PLAYER_COLOR_LIGHT,
  POSITION_TO_GRID,
  SAFE_POSITIONS,
  STAR_POSITIONS,
} from '../../constants/board.constants';
import { BOARD_COLORS } from '../../constants/theme';
import { PlayerColor, Token } from '../../types/game.types';
import { BoardCell } from './BoardCell';
import { TokenAnimation } from '../animations/TokenAnimation';

interface Props {
  tokens: Token[];
  validMoveTokenIds: string[];
  onTokenPress: (tokenId: string) => void;
  cellSize: number;
  animationPaths?: Record<string, Array<{ x: number; y: number }>>;
  myColor?: PlayerColor;
  /** Temporarily hold captured tokens at their pre-capture pixel position. */
  overridePositions?: Record<string, { x: number; y: number; size: number }>;
}

// Main-ring path cells belonging to each player's L-shaped approach to home
const PATH_COLORS: Partial<Record<number, PlayerColor>> = {};
for (let p = 0; p <= 9; p++) PATH_COLORS[p] = 'red';
for (let p = 13; p <= 22; p++) PATH_COLORS[p] = 'green';
for (let p = 26; p <= 35; p++) PATH_COLORS[p] = 'yellow';
for (let p = 39; p <= 48; p++) PATH_COLORS[p] = 'blue';

const BOARD_ROTATION: Record<PlayerColor, string> = {
  red: '-90deg',
  green: '180deg',
  yellow: '90deg',
  blue: '0deg',
};

// Inverse of BOARD_ROTATION so icons stay upright regardless of board orientation
const ICON_COUNTER_ROTATION: Record<PlayerColor, string> = {
  red: '90deg',
  green: '180deg',
  yellow: '-90deg',
  blue: '0deg',
};

// Determine what to render for a given grid cell
function getCellType(
  row: number,
  col: number,
): { type: 'normal' | 'safe' | 'star' | 'home_column' | 'center' | 'base_area'; color?: PlayerColor } | null {
  // 3×3 center block (rows 6-8, cols 6-8) — rendered as SVG overlay, skip cells
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

  // Corner base areas — rendered as single views, not individual cells
  if (row <= 5 && col <= 5) return null;
  if (row <= 5 && col >= 9) return null;
  if (row >= 9 && col >= 9) return null;
  if (row >= 9 && col <= 5) return null;

  // Home columns (colored lanes leading to center)
  if (row === 7 && col >= 1 && col <= 5) return { type: 'home_column', color: 'red' };
  if (col === 7 && row >= 1 && row <= 5) return { type: 'home_column', color: 'green' };
  if (row === 7 && col >= 9 && col <= 13) return { type: 'home_column', color: 'yellow' };
  if (col === 7 && row >= 9 && row <= 13) return { type: 'home_column', color: 'blue' };

  // Main ring: look up position in POSITION_TO_GRID
  for (const [posStr, coord] of Object.entries(POSITION_TO_GRID)) {
    const pos = parseInt(posStr, 10);
    if (coord.row === row && coord.col === col) {
      const pathColor = PATH_COLORS[pos];
      if (STAR_POSITIONS.includes(pos)) return { type: 'star', color: pathColor };
      if (SAFE_POSITIONS.includes(pos)) return { type: 'safe', color: pathColor };
      return { type: 'normal', color: pathColor };
    }
  }

  return null;
}

function getTokenPos(
  token: Token,
  idx: number,
  total: number,
  CELL: number,
): { x: number; y: number; size: number } {
  const TOKEN_SIZE = CELL * 0.82;
  if (token.state === 'base') {
    const slotIdx = parseInt(token.tokenId.split('_')[1], 10) % 4;
    const corner = BASE_AREA_CORNERS[token.color];
    // Inner yard center: outer corner + 1-cell border + 2 cells (half of 4-cell yard)
    const yardCenterX = (corner.leftCol + 3) * CELL;
    const yardCenterY = (corner.topRow  + 3) * CELL;
    const delta = BASE_SLOT_DELTAS[slotIdx];
    const cx = yardCenterX + delta.dc * CELL;
    const cy = yardCenterY + delta.dr * CELL;
    return {
      x: cx - TOKEN_SIZE / 2,
      y: cy - TOKEN_SIZE / 2,
      size: TOKEN_SIZE,
    };
  }
  const coord = POSITION_TO_GRID[token.position];
  if (!coord) return { x: 0, y: 0, size: TOKEN_SIZE };
  const offset = total > 1 ? (idx % 2) * 3 - 1.5 : 0;
  return {
    x: coord.col * CELL + (CELL - TOKEN_SIZE) / 2 + offset,
    y: coord.row * CELL + (CELL - TOKEN_SIZE) / 2 + offset,
    size: TOKEN_SIZE,
  };
}

// Each corner: outer 6×6 block top-left position in the grid
const BASE_AREAS: Array<{ color: PlayerColor; topRow: number; leftCol: number }> = [
  { color: 'red',    topRow: 0, leftCol: 0 },
  { color: 'green',  topRow: 0, leftCol: 9 },
  { color: 'yellow', topRow: 9, leftCol: 9 },
  { color: 'blue',   topRow: 9, leftCol: 0 },
];

// Top-left corner of each 6×6 outer base area (in grid cells)
const BASE_AREA_CORNERS: Record<PlayerColor, { topRow: number; leftCol: number }> = {
  red:    { topRow: 0, leftCol: 0 },
  green:  { topRow: 0, leftCol: 9 },
  yellow: { topRow: 9, leftCol: 9 },
  blue:   { topRow: 9, leftCol: 0 },
};

// Per-slot displacement from the inner-yard center (in cells).
// Ordering matches token IDs 0–3: top-left, top-right, bottom-left, bottom-right.
const BASE_SLOT_DELTAS = [
  { dr: -1, dc: -1 },
  { dr: -1, dc:  1 },
  { dr:  1, dc: -1 },
  { dr:  1, dc:  1 },
];

export function LudoBoard({ tokens, validMoveTokenIds, onTokenPress, cellSize, animationPaths, myColor, overridePositions }: Props) {
  const CELL = cellSize;
  const BOARD_SIZE = CELL * 15;
  const CENTER_SIZE = CELL * 3;

  // Compute rotation before any useMemo that depends on iconRotation
  const rotation = myColor ? BOARD_ROTATION[myColor] : '0deg';
  const iconRotation = myColor ? ICON_COUNTER_ROTATION[myColor] : '0deg';

  const cells = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let row = 0; row < BOARD_GRID_ROWS; row++) {
      for (let col = 0; col < BOARD_GRID_COLS; col++) {
        const info = getCellType(row, col);
        if (!info) continue;
        result.push(
          <View
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              left: col * CELL,
              top: row * CELL,
              width: CELL,
              height: CELL,
            }}
          >
            <BoardCell type={info.type} color={info.color} size={CELL} iconRotation={iconRotation} />
          </View>,
        );
      }
    }
    return result;
  }, [CELL, iconRotation]);

  // Base area corners — each rendered as one solid outer block with a centered inner yard
  const baseAreas = useMemo(() => {
    const outerSize = CELL * 6;
    const innerSize = CELL * 4;
    // Inner yard inset = (6 - 4) / 2 = 1 cell on each side — must match getTokenPos yard center formula
    const innerInset = CELL;
    const circleR = CELL * 0.44;
    const circleD = circleR * 2;
    // Slot deltas matching BASE_SLOT_DELTAS: circle centers at yardCenter ± CELL within inner yard
    const CIRCLE_DELTAS = [
      { dr: -1, dc: -1 },
      { dr: -1, dc:  1 },
      { dr:  1, dc: -1 },
      { dr:  1, dc:  1 },
    ];

    return BASE_AREAS.map(({ color, topRow, leftCol }) => (
      <View
        key={color}
        style={{
          position: 'absolute',
          top: topRow * CELL,
          left: leftCol * CELL,
          width: outerSize,
          height: outerSize,
          backgroundColor: BOARD_COLORS[color],
        }}
      >
        {/* Inner yard: inset by exactly 1 cell on each side */}
        <View
          style={{
            position: 'absolute',
            top: innerInset,
            left: innerInset,
            width: innerSize,
            height: innerSize,
            backgroundColor: PLAYER_COLOR_LIGHT[color],
            borderRadius: CELL * 0.5,
            overflow: 'hidden',
          }}
        >
          {/* Circles: centers at yardCenter ± CELL = innerSize/2 ± CELL = 2*CELL ± CELL */}
          {CIRCLE_DELTAS.map(({ dr, dc }, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: innerSize / 2 + dc * CELL - circleR,
                top: innerSize / 2 + dr * CELL - circleR,
                width: circleD,
                height: circleD,
                borderRadius: circleR,
                backgroundColor: BOARD_COLORS[color],
              }}
            />
          ))}
        </View>
      </View>
    ));
  }, [CELL]);

  // Center 4-triangle SVG overlay
  const centerOverlay = useMemo(
    () => (
      <View
        style={{
          position: 'absolute',
          left: 6 * CELL,
          top: 6 * CELL,
          width: CENTER_SIZE,
          height: CENTER_SIZE,
        }}
      >
        <Svg width={CENTER_SIZE} height={CENTER_SIZE} viewBox="0 0 3 3">
          {/* Green — top */}
          <Polygon points="0,0 3,0 1.5,1.5" fill={PLAYER_COLOR_HEX.green} />
          {/* Yellow — right */}
          <Polygon points="3,0 3,3 1.5,1.5" fill={PLAYER_COLOR_HEX.yellow} />
          {/* Blue — bottom */}
          <Polygon points="3,3 0,3 1.5,1.5" fill={PLAYER_COLOR_HEX.blue} />
          {/* Red — left */}
          <Polygon points="0,3 0,0 1.5,1.5" fill={PLAYER_COLOR_HEX.red} />
          {/* Center heart circle */}
          <Circle cx="1.5" cy="1.5" r="0.45" fill="white" />
        </Svg>
      </View>
    ),
    [CELL, CENTER_SIZE],
  );

  const tokenElements = useMemo(
    () => {
      // Valid-move tokens must render LAST so they sit on top of any opponent
      // tokens at the same square and remain tappable (safe-square stacking case).
      const sorted = [...tokens].sort((a, b) => {
        const av = validMoveTokenIds.includes(a.tokenId) ? 1 : 0;
        const bv = validMoveTokenIds.includes(b.tokenId) ? 1 : 0;
        return av - bv;
      });
      return sorted.map((token) => {
        // If a capture just happened, hold this token at its pre-capture position
        // until the attacking token's animation finishes walking to it.
        const override = overridePositions?.[token.tokenId];
        let x: number, y: number, size: number;
        if (override) {
          ({ x, y, size } = override);
        } else {
          const atSamePos = tokens.filter(
            (t) => t.position === token.position && t.state === token.state,
          );
          const posIdx = atSamePos.findIndex((t) => t.tokenId === token.tokenId);
          ({ x, y, size } = getTokenPos(token, posIdx, atSamePos.length, CELL));
        }
        return (
          <TokenAnimation
            key={token.tokenId}
            token={token}
            x={x}
            y={y}
            size={size}
            isHighlighted={validMoveTokenIds.includes(token.tokenId)}
            positionSteps={animationPaths?.[token.tokenId]}
            onPress={() => onTokenPress(token.tokenId)}
          />
        );
      });
    },
    [tokens, validMoveTokenIds, onTokenPress, CELL, overridePositions],
  );

  return (
    <View style={[styles.board, { width: BOARD_SIZE + 8, height: BOARD_SIZE + 8, transform: [{ rotate: rotation }] }]}>
      {cells}
      {baseAreas}
      {centerOverlay}
      {tokenElements}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#e91e8c',
    elevation: 12,
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
});
