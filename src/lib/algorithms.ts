import type { Position, Grid, AlgorithmResult } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

const SQRT2_MINUS_2 = Math.SQRT2 - 2;

// ── Flat MinHeap — Contiguous Memory Layout ──
// Uses parallel Float64Arrays instead of number[][] for cache-friendly access.
// Mirrors how hardware priority encoders process data in contiguous registers.
// Stride is 4 floats per entry: [priority, g-value, row, col].
class MinHeap {
  private d: Float64Array;
  private n = 0;

  constructor(capacity = 1024) {
    this.d = new Float64Array(capacity * 4);
  }

  push(pri: number, gv: number, r: number, c: number) {
    if (this.n * 4 >= this.d.length) {
      const next = new Float64Array(this.d.length * 2);
      next.set(this.d);
      this.d = next;
    }
    const i = this.n++;
    const o = i * 4;
    this.d[o] = pri; this.d[o + 1] = gv; this.d[o + 2] = r; this.d[o + 3] = c;
    this._up(i);
  }

  pop(): [number, number, number, number] | undefined {
    if (this.n === 0) return undefined;
    const d = this.d;
    const pri = d[0], gv = d[1], r = d[2], c = d[3];
    this.n--;
    if (this.n > 0) {
      const lo = this.n * 4;
      d[0] = d[lo]; d[1] = d[lo + 1]; d[2] = d[lo + 2]; d[3] = d[lo + 3];
      this._down(0);
    }
    return [pri, gv, r, c];
  }

  get length() { return this.n; }

  private _up(i: number) {
    const d = this.d;
    while (i > 0) {
      const p = (i - 1) >> 1;
      const po = p * 4, io = i * 4;
      if (d[po] > d[io]) {
        // Swap 4 floats
        let t = d[po]; d[po] = d[io]; d[io] = t;
        t = d[po + 1]; d[po + 1] = d[io + 1]; d[io + 1] = t;
        t = d[po + 2]; d[po + 2] = d[io + 2]; d[io + 2] = t;
        t = d[po + 3]; d[po + 3] = d[io + 3]; d[io + 3] = t;
        i = p;
      } else break;
    }
  }

  private _down(i: number) {
    const d = this.d, n = this.n;
    for (;;) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      const so = s * 4;
      if (l < n && d[l * 4] < d[so]) s = l;
      if (r < n && d[r * 4] < d[s * 4]) s = r;
      if (s !== i) {
        const io = i * 4, sO = s * 4;
        let t = d[io]; d[io] = d[sO]; d[sO] = t;
        t = d[io + 1]; d[io + 1] = d[sO + 1]; d[sO + 1] = t;
        t = d[io + 2]; d[io + 2] = d[sO + 2]; d[sO + 2] = t;
        t = d[io + 3]; d[io + 3] = d[sO + 3]; d[sO + 3] = t;
        i = s;
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

const INF = 1e9;

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

  // ── Numeric-keyed score maps (address-encoded keys) ──
  // Uses encodePos (row*COLS+col) as numeric key instead of string template.
  // Mirrors how memory addresses index data in flat address spaces.
  const gMap = new Map<number, number>();
  const hMap = new Map<number, number>();

  const endR = end.row, endC = end.col;
  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, endR, endC)
    : (r: number, c: number) => manhattanH(r, c, endR, endC);

  while (head < queue.length) {
    const curKey = queue[head++];
    const cr = (curKey / COLS) | 0;
    const cc = curKey % COLS;
    visitOrder.push({ row: cr, col: cc });
    const currDist = dist.get(curKey)!;
    gMap.set(curKey, currDist);
    hMap.set(curKey, hFn(cr, cc));

    if (cr === endR && cc === endC) {
      // Convert numeric-keyed maps to string-keyed Records for UI consumption
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (const node of visitOrder) {
        const nk = encodePos(node.row, node.col);
        const sk = `${node.row},${node.col}`;
        gScores[sk] = +(gMap.get(nk) ?? 0).toFixed(1);
        hScores[sk] = +(hMap.get(nk) ?? 0).toFixed(1);
      }
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    // ── Inlined neighbor expansion (zero-allocation hot path) ──
    // Eliminates getNeighbors() array/object allocation per cell visit.
    const g = grid;
    // Orthogonal neighbors
    if (cr > 0 && g[cr - 1][cc] !== CellType.WALL) {
      const nk = curKey - COLS;
      if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
    }
    if (cr < ROWS - 1 && g[cr + 1][cc] !== CellType.WALL) {
      const nk = curKey + COLS;
      if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
    }
    if (cc > 0 && g[cr][cc - 1] !== CellType.WALL) {
      const nk = curKey - 1;
      if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
    }
    if (cc < COLS - 1 && g[cr][cc + 1] !== CellType.WALL) {
      const nk = curKey + 1;
      if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
    }
    // Diagonal neighbors
    if (diagonal) {
      if (cr > 0 && cc > 0 && g[cr - 1][cc - 1] !== CellType.WALL && g[cr][cc - 1] !== CellType.WALL && g[cr - 1][cc] !== CellType.WALL) {
        const nk = curKey - COLS - 1;
        if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
      }
      if (cr > 0 && cc < COLS - 1 && g[cr - 1][cc + 1] !== CellType.WALL && g[cr][cc + 1] !== CellType.WALL && g[cr - 1][cc] !== CellType.WALL) {
        const nk = curKey - COLS + 1;
        if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
      }
      if (cr < ROWS - 1 && cc > 0 && g[cr + 1][cc - 1] !== CellType.WALL && g[cr][cc - 1] !== CellType.WALL && g[cr + 1][cc] !== CellType.WALL) {
        const nk = curKey + COLS - 1;
        if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
      }
      if (cr < ROWS - 1 && cc < COLS - 1 && g[cr + 1][cc + 1] !== CellType.WALL && g[cr][cc + 1] !== CellType.WALL && g[cr + 1][cc] !== CellType.WALL) {
        const nk = curKey + COLS + 1;
        if (!visited.has(nk)) { visited.add(nk); parentMap.set(nk, curKey); dist.set(nk, currDist + 1); queue.push(nk); }
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
  // ── Flat Float64Array distance storage (contiguous memory / cache locality) ──
  // Replaces 2D number[][] with a single typed array indexed by encodePos.
  // Mirrors how SRAM stores data in contiguous physical addresses.
  const N = ROWS * COLS;
  const dist = new Float64Array(N);
  dist.fill(INF);
  const startKey = encodePos(start.row, start.col);
  dist[startKey] = 0;

  const heap = new MinHeap();
  heap.push(0, 0, start.row, start.col);

  const parentMap = new Map<number, number>();
  const closed = new Set<number>();
  const visitOrder: Position[] = [];
  const gMap = new Map<number, number>();
  const hMap = new Map<number, number>();

  const endR = end.row, endC = end.col;
  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, endR, endC)
    : (r: number, c: number) => manhattanH(r, c, endR, endC);

  while (heap.length > 0) {
    const entry = heap.pop()!;
    const d = entry[1]; // g-value
    const r = entry[2] | 0;
    const c = entry[3] | 0;
    const key = r * COLS + c;

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });
    gMap.set(key, +d.toFixed(1));
    hMap.set(key, +hFn(r, c).toFixed(1));

    if (r === endR && c === endC) {
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (const [k, v] of gMap) { const p = decodePos(k); gScores[`${p.row},${p.col}`] = v; }
      for (const [k, v] of hMap) { const p = decodePos(k); hScores[`${p.row},${p.col}`] = v; }
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    // ── Inlined neighbor expansion (zero-allocation hot path) ──
    const g = grid;
    // Up
    if (r > 0) { const nr = r - 1, nk = key - COLS;
      if (!closed.has(nk) && g[nr][c] !== CellType.WALL) {
        const nd = d + getWeight(g, nr, c);
        if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, nr, c); }
      }
    }
    // Down
    if (r < ROWS - 1) { const nr = r + 1, nk = key + COLS;
      if (!closed.has(nk) && g[nr][c] !== CellType.WALL) {
        const nd = d + getWeight(g, nr, c);
        if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, nr, c); }
      }
    }
    // Left
    if (c > 0) { const nc = c - 1, nk = key - 1;
      if (!closed.has(nk) && g[r][nc] !== CellType.WALL) {
        const nd = d + getWeight(g, r, nc);
        if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r, nc); }
      }
    }
    // Right
    if (c < COLS - 1) { const nc = c + 1, nk = key + 1;
      if (!closed.has(nk) && g[r][nc] !== CellType.WALL) {
        const nd = d + getWeight(g, r, nc);
        if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r, nc); }
      }
    }
    if (diagonal) {
      // Up-Left
      if (r > 0 && c > 0 && g[r - 1][c - 1] !== CellType.WALL && g[r][c - 1] !== CellType.WALL && g[r - 1][c] !== CellType.WALL) {
        const nk = key - COLS - 1;
        if (!closed.has(nk)) { const nd = d + Math.SQRT2 * getWeight(g, r - 1, c - 1);
          if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r - 1, c - 1); } }
      }
      // Up-Right
      if (r > 0 && c < COLS - 1 && g[r - 1][c + 1] !== CellType.WALL && g[r][c + 1] !== CellType.WALL && g[r - 1][c] !== CellType.WALL) {
        const nk = key - COLS + 1;
        if (!closed.has(nk)) { const nd = d + Math.SQRT2 * getWeight(g, r - 1, c + 1);
          if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r - 1, c + 1); } }
      }
      // Down-Left
      if (r < ROWS - 1 && c > 0 && g[r + 1][c - 1] !== CellType.WALL && g[r][c - 1] !== CellType.WALL && g[r + 1][c] !== CellType.WALL) {
        const nk = key + COLS - 1;
        if (!closed.has(nk)) { const nd = d + Math.SQRT2 * getWeight(g, r + 1, c - 1);
          if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r + 1, c - 1); } }
      }
      // Down-Right
      if (r < ROWS - 1 && c < COLS - 1 && g[r + 1][c + 1] !== CellType.WALL && g[r][c + 1] !== CellType.WALL && g[r + 1][c] !== CellType.WALL) {
        const nk = key + COLS + 1;
        if (!closed.has(nk)) { const nd = d + Math.SQRT2 * getWeight(g, r + 1, c + 1);
          if (nd < dist[nk]) { dist[nk] = nd; parentMap.set(nk, key); heap.push(nd, nd, r + 1, c + 1); } }
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
  const endR = end.row, endC = end.col;
  const hFn = diagonal
    ? (r: number, c: number) => octileH(r, c, endR, endC)
    : (r: number, c: number) => manhattanH(r, c, endR, endC);

  // ── Flat Float64Array g-score storage (contiguous memory / cache locality) ──
  const N = ROWS * COLS;
  const gScore = new Float64Array(N);
  gScore.fill(INF);
  const startKey = encodePos(start.row, start.col);
  gScore[startKey] = 0;

  const heap = new MinHeap();
  heap.push(hFn(start.row, start.col), 0, start.row, start.col);

  const parentMap = new Map<number, number>();
  const closed = new Set<number>();
  const visitOrder: Position[] = [];
  const gMap = new Map<number, number>();
  const hMap = new Map<number, number>();

  while (heap.length > 0) {
    const entry = heap.pop()!;
    const gv = entry[1];
    const r = entry[2] | 0;
    const c = entry[3] | 0;
    const key = r * COLS + c;

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });
    gMap.set(key, +gv.toFixed(1));
    hMap.set(key, +hFn(r, c).toFixed(1));

    if (r === endR && c === endC) {
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (const [k, v] of gMap) { const p = decodePos(k); gScores[`${p.row},${p.col}`] = v; }
      for (const [k, v] of hMap) { const p = decodePos(k); hScores[`${p.row},${p.col}`] = v; }
      return { visitOrder, path: reconstructPath(parentMap, start, end), gScores, hScores };
    }

    // ── Inlined neighbor expansion (zero-allocation hot path) ──
    const g = grid;
    // Up
    if (r > 0) { const nr = r - 1, nk = key - COLS;
      if (!closed.has(nk) && g[nr][c] !== CellType.WALL) {
        const ng = gv + getWeight(g, nr, c);
        if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(nr, c), ng, nr, c); }
      }
    }
    // Down
    if (r < ROWS - 1) { const nr = r + 1, nk = key + COLS;
      if (!closed.has(nk) && g[nr][c] !== CellType.WALL) {
        const ng = gv + getWeight(g, nr, c);
        if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(nr, c), ng, nr, c); }
      }
    }
    // Left
    if (c > 0) { const nc = c - 1, nk = key - 1;
      if (!closed.has(nk) && g[r][nc] !== CellType.WALL) {
        const ng = gv + getWeight(g, r, nc);
        if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r, nc), ng, r, nc); }
      }
    }
    // Right
    if (c < COLS - 1) { const nc = c + 1, nk = key + 1;
      if (!closed.has(nk) && g[r][nc] !== CellType.WALL) {
        const ng = gv + getWeight(g, r, nc);
        if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r, nc), ng, r, nc); }
      }
    }
    if (diagonal) {
      // Up-Left
      if (r > 0 && c > 0 && g[r - 1][c - 1] !== CellType.WALL && g[r][c - 1] !== CellType.WALL && g[r - 1][c] !== CellType.WALL) {
        const nk = key - COLS - 1;
        if (!closed.has(nk)) { const ng = gv + Math.SQRT2 * getWeight(g, r - 1, c - 1);
          if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r - 1, c - 1), ng, r - 1, c - 1); } }
      }
      // Up-Right
      if (r > 0 && c < COLS - 1 && g[r - 1][c + 1] !== CellType.WALL && g[r][c + 1] !== CellType.WALL && g[r - 1][c] !== CellType.WALL) {
        const nk = key - COLS + 1;
        if (!closed.has(nk)) { const ng = gv + Math.SQRT2 * getWeight(g, r - 1, c + 1);
          if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r - 1, c + 1), ng, r - 1, c + 1); } }
      }
      // Down-Left
      if (r < ROWS - 1 && c > 0 && g[r + 1][c - 1] !== CellType.WALL && g[r][c - 1] !== CellType.WALL && g[r + 1][c] !== CellType.WALL) {
        const nk = key + COLS - 1;
        if (!closed.has(nk)) { const ng = gv + Math.SQRT2 * getWeight(g, r + 1, c - 1);
          if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r + 1, c - 1), ng, r + 1, c - 1); } }
      }
      // Down-Right
      if (r < ROWS - 1 && c < COLS - 1 && g[r + 1][c + 1] !== CellType.WALL && g[r][c + 1] !== CellType.WALL && g[r + 1][c] !== CellType.WALL) {
        const nk = key + COLS + 1;
        if (!closed.has(nk)) { const ng = gv + Math.SQRT2 * getWeight(g, r + 1, c + 1);
          if (ng < gScore[nk]) { gScore[nk] = ng; parentMap.set(nk, key); heap.push(ng + hFn(r + 1, c + 1), ng, r + 1, c + 1); } }
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

export function getPathCost(path: Position[], grid: Grid): number {
  if (path.length <= 1) return 0;
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const isDiagonal = from.row !== to.row && from.col !== to.col;
    const stepCost = isDiagonal ? Math.SQRT2 : 1.0;
    const weight = grid[to.row][to.col] === CellType.MUD ? 5 : 1;
    cost += stepCost * weight;
  }
  return +cost.toFixed(1);
}

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
  const time = +(performance.now() - t0).toFixed(2);
  const pathCost = getPathCost(result.path, grid);
  return { ...result, time, pathCost };
}