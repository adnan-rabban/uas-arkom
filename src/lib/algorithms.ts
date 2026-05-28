import type { Position, Grid, AlgorithmResult } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

const SQRT2_MINUS_2 = Math.SQRT2 - 2;

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

function encodePos(row: number, col: number): number {
  return row * COLS + col;
}

function decodePos(key: number): Position {
  return { row: (key / COLS) | 0, col: key % COLS };
}

function reconstructPath(
  parentMap: Map<number, number>,
  start: Position,
  end: Position
): Position[] {
  const path: Position[] = [];
  let cur = encodePos(end.row, end.col);
  const startKey = encodePos(start.row, start.col);
  while (cur !== startKey) {
    path.push(decodePos(cur));
    const parent = parentMap.get(cur);
    if (parent === undefined) return [];
    cur = parent;
  }
  path.push({ row: start.row, col: start.col });
  path.reverse();
  return path;
}

function getWeight(grid: Grid, row: number, col: number): number {
  return grid[row][col] === CellType.MUD ? 5 : 1;
}

const ORTH_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function getNeighbors(
  r: number,
  c: number,
  grid: Grid,
  diagonal: boolean
): { row: number; col: number; cost: number }[] {
  const neighbors: { row: number; col: number; cost: number }[] = [];
  for (const [dr, dc] of ORTH_DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== CellType.WALL) {
      neighbors.push({ row: nr, col: nc, cost: 1 });
    }
  }
  if (diagonal) {
    for (const [dr, dc] of DIAG_DIRS) {
      const nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
        grid[nr][nc] !== CellType.WALL &&
        !(grid[r][nc] === CellType.WALL && grid[nr][c] === CellType.WALL)
      ) {
        neighbors.push({ row: nr, col: nc, cost: Math.SQRT2 });
      }
    }
  }
  return neighbors;
}

function octileH(r: number, c: number, er: number, ec: number): number {
  const dr = Math.abs(r - er), dc = Math.abs(c - ec);
  return (dr + dc) + SQRT2_MINUS_2 * Math.min(dr, dc);
}

function manhattanH(r: number, c: number, er: number, ec: number): number {
  return Math.abs(r - er) + Math.abs(c - ec);
}

function bfs(
  grid: Grid,
  start: Position,
  end: Position,
  diagonal: boolean
): Omit<AlgorithmResult, 'time'> {
  const startKey = encodePos(start.row, start.col);
  const queue: number[] = [startKey];
  let head = 0;
  const visited = new Set<number>([startKey]);
  const parentMap = new Map<number, number>();
  const dist = new Map<number, number>([[startKey, 0]]);
  const visitOrder: Position[] = [];

  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, end.row, end.col)
    : (r: number, c: number) => manhattanH(r, c, end.row, end.col);

  while (head < queue.length) {
    const curKey = queue[head++];
    const cur = decodePos(curKey);
    visitOrder.push(cur);
    const currDist = dist.get(curKey)!;

    if (cur.row === end.row && cur.col === end.col) {
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (const node of visitOrder) {
        const sk = `${node.row},${node.col}`;
        const nk = encodePos(node.row, node.col);
        gScores[sk] = +(dist.get(nk) ?? 0).toFixed(1);
        hScores[sk] = +hFn(node.row, node.col).toFixed(1);
      }
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    for (const nb of getNeighbors(cur.row, cur.col, grid, diagonal)) {
      const nk = encodePos(nb.row, nb.col);
      if (!visited.has(nk)) {
        visited.add(nk);
        parentMap.set(nk, curKey);
        dist.set(nk, currDist + 1);
        queue.push(nk);
      }
    }
  }
  return { visitOrder, path: [] };
}

function dijkstra(
  grid: Grid,
  start: Position,
  end: Position,
  diagonal: boolean
): Omit<AlgorithmResult, 'time'> {
  const dist: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(1e9));
  dist[start.row][start.col] = 0;

  const heap = new MinHeap();
  heap.push([0, start.row, start.col]);

  const parentMap = new Map<number, number>();
  const closed = new Set<number>();
  const visitOrder: Position[] = [];
  const gScores: Record<string, number> = {};
  const hScores: Record<string, number> = {};

  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, end.row, end.col)
    : (r: number, c: number) => manhattanH(r, c, end.row, end.col);

  while (heap.length > 0) {
    const [d, r, c] = heap.pop()!;
    const key = encodePos(r, c);

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });
    gScores[`${r},${c}`] = +d.toFixed(1);
    hScores[`${r},${c}`] = +hFn(r, c).toFixed(1);

    if (r === end.row && c === end.col) {
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    for (const nb of getNeighbors(r, c, grid, diagonal)) {
      const nk = encodePos(nb.row, nb.col);
      if (closed.has(nk)) continue;
      const nextDist = d + nb.cost * getWeight(grid, nb.row, nb.col);
      if (nextDist < dist[nb.row][nb.col]) {
        dist[nb.row][nb.col] = nextDist;
        parentMap.set(nk, key);
        heap.push([nextDist, nb.row, nb.col]);
      }
    }
  }
  return { visitOrder, path: [] };
}

function astar(
  grid: Grid,
  start: Position,
  end: Position,
  diagonal: boolean
): Omit<AlgorithmResult, 'time'> {
  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, end.row, end.col)
    : (r: number, c: number) => manhattanH(r, c, end.row, end.col);

  const gScore: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(1e9));
  gScore[start.row][start.col] = 0;

  const heap = new MinHeap();
  heap.push([hFn(start.row, start.col), 0, start.row, start.col]);

  const parentMap = new Map<number, number>();
  const closed = new Set<number>();
  const visitOrder: Position[] = [];
  const gScores: Record<string, number> = {};
  const hScores: Record<string, number> = {};

  while (heap.length > 0) {
    const [, gv, r, c] = heap.pop()!;
    const key = encodePos(r, c);

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });
    gScores[`${r},${c}`] = +gv.toFixed(1);
    hScores[`${r},${c}`] = +hFn(r, c).toFixed(1);

    if (r === end.row && c === end.col) {
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    for (const nb of getNeighbors(r, c, grid, diagonal)) {
      const nk = encodePos(nb.row, nb.col);
      if (closed.has(nk)) continue;
      const ng = gv + nb.cost * getWeight(grid, nb.row, nb.col);
      if (ng < gScore[nb.row][nb.col]) {
        gScore[nb.row][nb.col] = ng;
        parentMap.set(nk, key);
        heap.push([ng + hFn(nb.row, nb.col), ng, nb.row, nb.col]);
      }
    }
  }
  return { visitOrder, path: [] };
}

type AlgorithmFn = (
  grid: Grid,
  start: Position,
  end: Position,
  diagonal: boolean
) => Omit<AlgorithmResult, 'time'>;

const ALGORITHM_MAP: Record<string, AlgorithmFn> = { bfs, dijkstra, astar };

export function runAlgorithm(
  algorithmKey: string,
  grid: Grid,
  start: Position,
  end: Position,
  diagonal: boolean = false
): AlgorithmResult {
  const fn = ALGORITHM_MAP[algorithmKey] || astar;
  const t0 = performance.now();
  const result = fn(grid, start, end, diagonal);
  return { ...result, time: +(performance.now() - t0).toFixed(2) };
}