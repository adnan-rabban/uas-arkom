import { useRef, useCallback } from 'react';
import type { Grid, Position } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

export function useFogOfWar() {
  // ── Conservative World Model ──
  // Every cell starts as WALL ("unknown = impassable"). The robot may ONLY plan
  // through a cell once it has physically revealed it via LiDAR. This replaces
  // the previous "freespace assumption" (all-EMPTY) that let the planner shoot a
  // straight line to the goal through unexplored territory.
  const knownGridRef = useRef<Grid>(Array.from({ length: ROWS }, () => new Array(COLS).fill(CellType.WALL)));
  const revealedCellsRef = useRef<Set<number>>(new Set());

  // ── Dirty-cell tracker (Cache Invalidation Pattern) ──
  // Tracks only cells modified by the user since the last sync, mirroring
  // dirty-bit tracking in CPU cache hierarchies: only "dirty" cache lines
  // (modified cells) need writeback to knownGrid.
  const dirtyCellsRef = useRef<Set<number>>(new Set());

  const resetFog = useCallback((realGrid: Grid, startPos: Position) => {
    // Unknown territory = WALL (conservative). Revealed cells are overwritten
    // with their real values from the actual grid as the robot uncovers them.
    const kg: Grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(CellType.WALL));
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

    // NOTE: the goal cell is intentionally NOT pre-revealed and NOT forced EMPTY.
    // The robot has no idea where the goal is until LiDAR uncovers that cell.

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
    return cellVal === CellType.WALL || cellVal === CellType.MUD;
  }, []);

  // ── Mark a cell as dirty (modified by user, needs writeback) ──
  const markCellDirty = useCallback((row: number, col: number) => {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      dirtyCellsRef.current.add(row * COLS + col);
    }
  }, []);

  // ── Sync dirty cells to knownGrid (Cache Writeback) ──
  // Processes only cells marked dirty since last sync, then flushes the dirty
  // set. Only cells that are both dirty AND already revealed are written back —
  // the robot cannot "learn" a cell it edited but has never sensed.
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

  // ── Frontier detection (Yamauchi frontier-based exploration, 1997) ──
  // Breadth-first flood from the robot across REVEALED, traversable cells and
  // return the nearest unrevealed cell that borders known free space. That cell
  // is the next exploration target: moving toward it expands the map into the
  // unknown. Returns null when no reachable frontier remains (area fully mapped).
  const findNearestFrontier = useCallback((from: Position): Position | null => {
    const rc = revealedCellsRef.current;
    const kg = knownGridRef.current;
    const startKey = from.row * COLS + from.col;
    const queue: number[] = [startKey];
    let head = 0;
    const seen = new Set<number>([startKey]);
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (head < queue.length) {
      const key = queue[head++];
      const r = (key / COLS) | 0;
      const c = key % COLS;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const nk = nr * COLS + nc;
        if (seen.has(nk)) continue;
        if (!rc.has(nk)) {
          // Unrevealed neighbour of a revealed free cell → exploration frontier.
          return { row: nr, col: nc };
        }
        // Only flood through revealed, non-wall cells (known-safe territory).
        if (kg[nr][nc] !== CellType.WALL) {
          seen.add(nk);
          queue.push(nk);
        }
      }
    }
    return null;
  }, []);

  // ── Build a planning grid from the conservative known map ──
  // Clones knownGrid (unknown = WALL) and, if a frontier target is supplied,
  // forces just that single cell to EMPTY so the planner can route INTO an
  // as-yet-unrevealed frontier. Everything else still unknown stays a WALL.
  const buildPlanningGrid = useCallback((target?: Position): Grid => {
    const grid: Grid = knownGridRef.current.map((row) => row.slice());
    if (target) grid[target.row][target.col] = CellType.EMPTY;
    return grid;
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
    findNearestFrontier,
    buildPlanningGrid,
  };
}
