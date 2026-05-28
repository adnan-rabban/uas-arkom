import { useRef, useCallback } from 'react';
import type { Grid, Position } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';
import { createGrid } from '@/lib/grid';

export function useFogOfWar() {
  const knownGridRef = useRef<Grid>(createGrid());
  const revealedCellsRef = useRef<Set<number>>(new Set());

  const resetFog = useCallback((realGrid: Grid, startPos: Position, endPos: Position) => {
    const kg = createGrid();
    const rc = new Set<number>();

    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = startPos.row + dr;
        const nc = startPos.col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const key = nr * COLS + nc;
          rc.add(key);
          kg[nr][nc] = realGrid[nr][nc];
        }
      }
    }

    const endKey = endPos.row * COLS + endPos.col;
    rc.add(endKey);
    kg[endPos.row][endPos.col] = realGrid[endPos.row][endPos.col];

    knownGridRef.current = kg;
    revealedCellsRef.current = rc;
  }, []);

  const revealCell = useCallback((row: number, col: number, realGrid: Grid): boolean => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    const key = row * COLS + col;
    if (revealedCellsRef.current.has(key)) return false;
    revealedCellsRef.current.add(key);
    const cellVal = realGrid[row][col];
    knownGridRef.current[row][col] = cellVal;
    return cellVal === CellType.WALL;
  }, []);

  return {
    knownGridRef,
    revealedCellsRef,
    resetFog,
    revealCell,
  };
}