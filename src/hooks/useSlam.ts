import { useRef, useCallback } from 'react';
import type { Grid, Position } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';
import { createGrid } from '@/lib/grid';

export function useFogOfWar() {
  const knownGridRef = useRef<Grid>(createGrid());
  const revealedCellsRef = useRef<Set<number>>(new Set());

  // ── Dirty-cell tracker (Cache Invalidation Pattern) ──
  // Instead of scanning all 960 cells (O(ROWS×COLS)) on every grid change,
  // we track only cells modified by the user since the last sync.
  // This mirrors cache-line dirty-bit tracking in CPU cache hierarchies:
  // only "dirty" cache lines (modified cells) need writeback to knownGrid.
  const dirtyCellsRef = useRef<Set<number>>(new Set());

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
    dirtyCellsRef.current.clear(); // Flush dirty bits on reset
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

  // ── Mark a cell as dirty (modified by user, needs writeback) ──
  // Called by the grid-change observer when the user draws walls/mud/erase
  // during simulation. Only cells that are both dirty AND revealed will be
  // synced to knownGrid, analogous to writeback cache policy.
  const markCellDirty = useCallback((row: number, col: number) => {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      dirtyCellsRef.current.add(row * COLS + col);
    }
  }, []);

  // ── Sync dirty cells to knownGrid (Cache Writeback) ──
  // Processes only cells marked dirty since last sync, then flushes
  // the dirty set. O(|dirty_cells|) instead of O(ROWS × COLS).
  const syncDirtyCells = useCallback((realGrid: Grid) => {
    const dirty = dirtyCellsRef.current;
    if (dirty.size === 0) return;
    const revealed = revealedCellsRef.current;
    const kg = knownGridRef.current;
    for (const key of dirty) {
      if (revealed.has(key)) {
        const r = (key / COLS) | 0;
        const c = key % COLS;
        kg[r][c] = realGrid[r][c];
      }
    }
    dirty.clear();
  }, []);

  return {
    knownGridRef,
    revealedCellsRef,
    dirtyCellsRef,
    resetFog,
    revealCell,
    markCellDirty,
    syncDirtyCells,
  };
}