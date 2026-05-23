import type { Position } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

export function generateRecursiveDivisionMaze(start: Position, end: Position): Position[] {
  const walls: Position[] = [];

  const addWall = (row: number, col: number) => {
    // Avoid blocking start, end, or their immediate orthogonal neighbors
    const isStartOrNeighbor = Math.abs(row - start.row) + Math.abs(col - start.col) <= 1;
    const isEndOrNeighbor = Math.abs(row - end.row) + Math.abs(col - end.col) <= 1;
    if (isStartOrNeighbor || isEndOrNeighbor) return;
    
    // Add wall coordinate if it's within bounds
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      walls.push({ row, col });
    }
  };

  const divide = (
    rStart: number,
    rEnd: number,
    cStart: number,
    cEnd: number,
    orientation: 'horizontal' | 'vertical'
  ) => {
    if (rEnd - rStart < 2 || cEnd - cStart < 2) return;

    const horizontal = orientation === 'horizontal';

    // Decide where to draw the wall (must be on an even index for nice alignment)
    let wy = rStart;
    let wx = cStart;

    if (horizontal) {
      const possibleY = [];
      for (let y = rStart + 1; y < rEnd; y += 2) possibleY.push(y);
      if (possibleY.length === 0) return;
      wy = possibleY[Math.floor(Math.random() * possibleY.length)];
    } else {
      const possibleX = [];
      for (let x = cStart + 1; x < cEnd; x += 2) possibleX.push(x);
      if (possibleX.length === 0) return;
      wx = possibleX[Math.floor(Math.random() * possibleX.length)];
    }

    // Decide where to leave a gap (must be on an odd index)
    let gap: number;
    if (horizontal) {
      const possibleGaps = [];
      for (let x = cStart; x <= cEnd; x += 2) possibleGaps.push(x);
      // fallback if no even indices
      if (possibleGaps.length === 0) possibleGaps.push(cStart);
      gap = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
    } else {
      const possibleGaps = [];
      for (let y = rStart; y <= rEnd; y += 2) possibleGaps.push(y);
      if (possibleGaps.length === 0) possibleGaps.push(rStart);
      gap = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
    }

    if (horizontal) {
      for (let x = cStart; x <= cEnd; x++) {
        if (x !== gap) {
          addWall(wy, x);
        }
      }
    } else {
      for (let y = rStart; y <= rEnd; y++) {
        if (y !== gap) {
          addWall(y, wx);
        }
      }
    }

    // Recurse
    if (horizontal) {
      // Top subgrid
      divide(rStart, wy - 1, cStart, cEnd, getOrientation(rStart, wy - 1, cStart, cEnd));
      // Bottom subgrid
      divide(wy + 1, rEnd, cStart, cEnd, getOrientation(wy + 1, rEnd, cStart, cEnd));
    } else {
      // Left subgrid
      divide(rStart, rEnd, cStart, wx - 1, getOrientation(rStart, rEnd, cStart, wx - 1));
      // Right subgrid
      divide(rStart, rEnd, wx + 1, cEnd, getOrientation(rStart, rEnd, wx + 1, cEnd));
    }
  };

  const getOrientation = (rs: number, re: number, cs: number, ce: number): 'horizontal' | 'vertical' => {
    const w = ce - cs;
    const h = re - rs;
    if (w < h) return 'horizontal';
    if (h < w) return 'vertical';
    return Math.random() < 0.5 ? 'horizontal' : 'vertical';
  };

  // Start with division
  const initialOrientation = getOrientation(0, ROWS - 1, 0, COLS - 1);
  divide(0, ROWS - 1, 0, COLS - 1, initialOrientation);

  return walls;
}
