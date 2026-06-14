import { useRef, useCallback } from 'react';
import type { Grid, Position } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

export function useFogOfWar() {
  // ── Optimistic World Model (Freespace Assumption) ──
  // Dynamic Replanning in Partially Observable Environments (D*-Lite family).
  // The robot KNOWS the goal coordinate but NOT the obstacle layout. Every
  // unexplored cell is optimistically assumed to be EMPTY (traversable) —
  // "Optimism in the Face of Uncertainty". The planner therefore charges a
  // straight A* route toward the goal through the fog; whenever LiDAR reveals an
  // unexpected wall, that cell is written into knownGrid and the route is
  // recomputed to detour around it — still aiming at the same goal.
  const knownGridRef = useRef<Grid>(Array.from({ length: ROWS }, () => new Array(COLS).fill(CellType.EMPTY)));
  const revealedCellsRef = useRef<Set<number>>(new Set());

  // ── Dirty-cell tracker (Cache Invalidation Pattern) ──
  // Tracks only cells modified by the user since the last sync, mirroring
  // dirty-bit tracking in CPU cache hierarchies: only "dirty" cache lines
  // (modified cells) need writeback to knownGrid.
  const dirtyCellsRef = useRef<Set<number>>(new Set());

  const resetFog = useCallback((realGrid: Grid, startPos: Position) => {
    // Optimistic init: everything assumed EMPTY. Revealed cells are overwritten
    // with their real values as the robot's LiDAR uncovers them.
    const kg: Grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(CellType.EMPTY));
    const rc = new Set<number>();

    // Reveal the 5x5 area around the start position (initial sensor footprint).
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

    knownGridRef.current = kg;
    revealedCellsRef.current = rc;
    dirtyCellsRef.current.clear(); // Flush dirty bits on reset
  }, []);

  // Reveal a cell via LiDAR. Returns true if the cell turned out to be an
  // obstacle (WALL or MUD) that the optimistic map did not expect — the signal
  // used to trigger dynamic replanning.
  const revealCell = useCallback((row: number, col: number, realGrid: Grid): boolean => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    const key = row * COLS + col;
    if (revealedCellsRef.current.has(key)) return false;
    revealedCellsRef.current.add(key);
    const cellVal = realGrid[row][col];
    knownGridRef.current[row][col] = cellVal;
    return cellVal === CellType.WALL || cellVal === CellType.MUD;
  }, []);

  // ── Mark a cell as dirty (modified by user, needs writeback) ──
  const markCellDirty = useCallback((row: number, col: number) => {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      dirtyCellsRef.current.add(row * COLS + col);
    }
  }, []);

  // ── Sync dirty cells to knownGrid (Cache Writeback) ──
  // Only cells that are both dirty AND already revealed are written back — the
  // robot cannot "learn" a cell it edited but has never sensed.
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

  const isRevealed = useCallback((row: number, col: number) => {
    return revealedCellsRef.current.has(row * COLS + col);
  }, []);

  return {
    knownGridRef,
    revealedCellsRef,
    dirtyCellsRef,
    resetFog,
    revealCell,
    markCellDirty,
    syncDirtyCells,
    isRevealed,
  };
}
