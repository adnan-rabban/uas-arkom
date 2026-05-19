import type { Position, Grid, AlgorithmResult } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS, DIRECTIONS } from '@/lib/constants';

// ── Min-Heap ──
class MinHeap {
  private data: number[][] = [];

  push(item: number[]) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }

  pop(): number[] | undefined {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length && last) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get length() {
    return this.data.length;
  }

  private _bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent][0] > this.data[i][0]) {
        [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
        i = parent;
      } else break;
    }
  }

  private _sinkDown(i: number) {
    const n = this.data.length;
    for (;;) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left][0] < this.data[smallest][0]) smallest = left;
      if (right < n && this.data[right][0] < this.data[smallest][0]) smallest = right;
      if (smallest !== i) {
        [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
        i = smallest;
      } else break;
    }
  }
}

// ── Reconstruct path from parent map ──
function reconstructPath(
  parentMap: Map<string, Position>,
  start: Position,
  end: Position
): Position[] {
  const path: Position[] = [];
  let current = end;
  while (current.row !== start.row || current.col !== start.col) {
    path.unshift(current);
    const key = `${current.row},${current.col}`;
    const parent = parentMap.get(key);
    if (!parent) return [];
    current = parent;
  }
  path.unshift(start);
  return path;
}

// ── BFS ──
function bfs(grid: Grid, start: Position, end: Position): Omit<AlgorithmResult, 'time'> {
  const queue: Position[] = [start];
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const parentMap = new Map<string, Position>();
  const visitOrder: Position[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitOrder.push(current);

    if (current.row === end.row && current.col === end.col) {
      return { visitOrder, path: reconstructPath(parentMap, start, end) };
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const key = `${nr},${nc}`;

      if (
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        grid[nr][nc] !== CellType.WALL &&
        !visited.has(key)
      ) {
        visited.add(key);
        parentMap.set(key, current);
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── Dijkstra ──
function dijkstra(grid: Grid, start: Position, end: Position): Omit<AlgorithmResult, 'time'> {
  const dist: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(1e9));
  dist[start.row][start.col] = 0;

  const heap = new MinHeap();
  heap.push([0, start.row, start.col]);

  const parentMap = new Map<string, Position>();
  const closed = new Set<string>();
  const visitOrder: Position[] = [];

  while (heap.length > 0) {
    const [d, r, c] = heap.pop()!;
    const key = `${r},${c}`;

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });

    if (r === end.row && c === end.col) {
      return { visitOrder, path: reconstructPath(parentMap, start, end) };
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = `${nr},${nc}`;

      if (
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        grid[nr][nc] !== CellType.WALL &&
        !closed.has(nk) &&
        d + 1 < dist[nr][nc]
      ) {
        dist[nr][nc] = d + 1;
        parentMap.set(nk, { row: r, col: c });
        heap.push([d + 1, nr, nc]);
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── A* ──
function astar(grid: Grid, start: Position, end: Position): Omit<AlgorithmResult, 'time'> {
  const heuristic = (r: number, c: number) =>
    Math.abs(r - end.row) + Math.abs(c - end.col);

  const gScore: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(1e9));
  gScore[start.row][start.col] = 0;

  const heap = new MinHeap();
  heap.push([heuristic(start.row, start.col), 0, start.row, start.col]);

  const parentMap = new Map<string, Position>();
  const closed = new Set<string>();
  const visitOrder: Position[] = [];

  while (heap.length > 0) {
    const [, gv, r, c] = heap.pop()!;
    const key = `${r},${c}`;

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });

    if (r === end.row && c === end.col) {
      return { visitOrder, path: reconstructPath(parentMap, start, end) };
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = `${nr},${nc}`;

      if (
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        grid[nr][nc] !== CellType.WALL &&
        !closed.has(nk)
      ) {
        const ng = gv + 1;
        if (ng < gScore[nr][nc]) {
          gScore[nr][nc] = ng;
          parentMap.set(nk, { row: r, col: c });
          heap.push([ng + heuristic(nr, nc), ng, nr, nc]);
        }
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── Public API ──
type AlgorithmFn = (grid: Grid, start: Position, end: Position) => Omit<AlgorithmResult, 'time'>;

const ALGORITHM_MAP: Record<string, AlgorithmFn> = {
  bfs,
  dijkstra,
  astar,
};

export function runAlgorithm(
  algorithmKey: string,
  grid: Grid,
  start: Position,
  end: Position
): AlgorithmResult {
  const fn = ALGORITHM_MAP[algorithmKey] || astar;
  const t0 = performance.now();
  const result = fn(grid, start, end);
  const time = +(performance.now() - t0).toFixed(2);
  return { ...result, time };
}
