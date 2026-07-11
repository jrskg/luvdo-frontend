import {
  BASE_POSITION,
  BOARD_SIZE,
  CENTER_POSITION,
  HOME_COLUMN_SIZE,
  HOME_COLUMN_START,
  HOME_ENTRY_POSITION,
  POSITION_TO_GRID,
} from '../constants/board.constants';
import { PlayerColor } from '../types/game.types';

/**
 * Returns every intermediate position index a token passes through when moving
 * from `from` to `to`. Does NOT include `from` itself (start), but DOES include `to`.
 * Used to drive step-by-step animation.
 */
export function buildTokenPath(from: number, to: number, color: PlayerColor): number[] {
  if (from === BASE_POSITION) return [to];

  const homeEntry = HOME_ENTRY_POSITION[color];
  const homeColStart = HOME_COLUMN_START[color];
  const homeColEnd = homeColStart + HOME_COLUMN_SIZE - 1;

  const steps: number[] = [];

  // Already inside home column
  if (from >= homeColStart) {
    if (to === CENTER_POSITION) {
      for (let p = from + 1; p <= homeColEnd; p++) steps.push(p);
      steps.push(CENTER_POSITION);
    } else {
      for (let p = from + 1; p <= to; p++) steps.push(p);
    }
    return steps;
  }

  // On main ring — may enter home column
  const goingHome = to >= homeColStart || to === CENTER_POSITION;
  let pos = from;

  // If the token is already sitting ON the home-entry cell, skip the main-ring
  // loop entirely — the path goes straight into the home column. Without this
  // the loop would traverse almost the whole board before re-arriving at homeEntry.
  if (goingHome && from === homeEntry) {
    if (to === CENTER_POSITION) {
      for (let p = homeColStart; p <= homeColEnd; p++) steps.push(p);
      steps.push(CENTER_POSITION);
    } else {
      for (let p = homeColStart; p <= to; p++) steps.push(p);
    }
    return steps;
  }

  for (let i = 0; i < 56; i++) {
    pos = (pos + 1) % BOARD_SIZE;
    steps.push(pos);

    if (goingHome && pos === homeEntry) {
      // homeEntry is orthogonally adjacent to homeColStart, so we keep it in
      // the path and append the home-column positions directly after it.
      if (to === CENTER_POSITION) {
        for (let p = homeColStart; p <= homeColEnd; p++) steps.push(p);
        steps.push(CENTER_POSITION);
      } else {
        for (let p = homeColStart; p <= to; p++) steps.push(p);
      }
      break;
    }

    if (!goingHome && pos === to) break;
  }

  return steps;
}

/** Convert an array of position indices to pixel coords on the board. */
export function pathToPixels(
  positions: number[],
  CELL: number,
  TOKEN_SIZE: number,
): Array<{ x: number; y: number }> {
  return positions
    .map((pos) => {
      const coord = POSITION_TO_GRID[pos];
      if (!coord) return null;
      return {
        x: coord.col * CELL + (CELL - TOKEN_SIZE) / 2,
        y: coord.row * CELL + (CELL - TOKEN_SIZE) / 2,
      };
    })
    .filter(Boolean) as Array<{ x: number; y: number }>;
}
