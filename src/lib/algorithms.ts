import type { Position, Grid, AlgorithmResult } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

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

// ── Helper to get cost weight ──
function getWeight(grid: Grid, row: number, col: number): number {
  if (grid[row][col] === CellType.MUD) return 5;
  return 1;
}

// ── Helper to get valid neighbors (supports 8-way diagonal with corner-cutting prevention) ──
function getNeighbors(r: number, c: number, grid: Grid, diagonal: boolean): { row: number; col: number; cost: number }[] {
  const neighbors: { row: number; col: number; cost: number }[] = [];
  
  // Orthogonal directions
  const orthDirs = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1]   // right
  ];
  for (const [dr, dc] of orthDirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== CellType.WALL) {
      neighbors.push({ row: nr, col: nc, cost: 1 });
    }
  }

  // Diagonal directions
  if (diagonal) {
    const diagDirs = [
      [-1, -1], // up-left
      [-1, 1],  // up-right
      [1, -1],  // down-left
      [1, 1]    // down-right
    ];
    for (const [dr, dc] of diagDirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== CellType.WALL) {
        // Prevent corner cutting if both adjacent orthogonal cells are walls
        const corner1 = grid[r][nc] === CellType.WALL;
        const corner2 = grid[nr][c] === CellType.WALL;
        if (!(corner1 && corner2)) {
          neighbors.push({ row: nr, col: nc, cost: Math.SQRT2 });
        }
      }
    }
  }

  return neighbors;
}

// ── BFS ──
function bfs(grid: Grid, start: Position, end: Position, diagonal: boolean): Omit<AlgorithmResult, 'time'> {
  const queue: Position[] = [start];
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const parentMap = new Map<string, Position>();
  const visitOrder: Position[] = [];
  const dist: Record<string, number> = { [`${start.row},${start.col}`]: 0 };

  const heuristic = (r: number, c: number) => {
    const dr = Math.abs(r - end.row);
    const dc = Math.abs(c - end.col);
    if (diagonal) {
      return (dr + dc) + (Math.sqrt(2) - 2) * Math.min(dr, dc);
    } else {
      return dr + dc;
    }
  };

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitOrder.push(current);
    const currKey = `${current.row},${current.col}`;
    const currDist = dist[currKey];

    if (current.row === end.row && current.col === end.col) {
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (const node of visitOrder) {
        const k = `${node.row},${node.col}`;
        gScores[k] = +(dist[k] ?? 0).toFixed(1);
        hScores[k] = +heuristic(node.row, node.col).toFixed(1);
      }
      return { 
        visitOrder, 
        path: reconstructPath(parentMap, start, end),
        gScores,
        hScores
      };
    }

    const neighbors = getNeighbors(current.row, current.col, grid, diagonal);
    for (const neighbor of neighbors) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!visited.has(key)) {
        visited.add(key);
        parentMap.set(key, current);
        dist[key] = currDist + neighbor.cost; // BFS moves at standard speed, ignoring mud weight
        queue.push({ row: neighbor.row, col: neighbor.col });
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── Dijkstra ──
function dijkstra(grid: Grid, start: Position, end: Position, diagonal: boolean): Omit<AlgorithmResult, 'time'> {
  const dist: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(1e9));
  dist[start.row][start.col] = 0;

  const heap = new MinHeap();
  heap.push([0, start.row, start.col]);

  const parentMap = new Map<string, Position>();
  const closed = new Set<string>();
  const visitOrder: Position[] = [];

  const heuristic = (r: number, c: number) => {
    const dr = Math.abs(r - end.row);
    const dc = Math.abs(c - end.col);
    if (diagonal) {
      return (dr + dc) + (Math.sqrt(2) - 2) * Math.min(dr, dc);
    } else {
      return dr + dc;
    }
  };

  while (heap.length > 0) {
    const [d, r, c] = heap.pop()!;
    const key = `${r},${c}`;

    if (closed.has(key)) continue;
    closed.add(key);
    visitOrder.push({ row: r, col: c });

    if (r === end.row && c === end.col) {
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (dist[row][col] < 1e9) {
            const k = `${row},${col}`;
            gScores[k] = +dist[row][col].toFixed(1);
            hScores[k] = +heuristic(row, col).toFixed(1);
          }
        }
      }
      return { 
        visitOrder, 
        path: reconstructPath(parentMap, start, end),
        gScores,
        hScores
      };
    }

    const neighbors = getNeighbors(r, c, grid, diagonal);
    for (const neighbor of neighbors) {
      const nk = `${neighbor.row},${neighbor.col}`;
      if (closed.has(nk)) continue;

      const stepCost = neighbor.cost * getWeight(grid, neighbor.row, neighbor.col);
      const nextDist = d + stepCost;

      if (nextDist < dist[neighbor.row][neighbor.col]) {
        dist[neighbor.row][neighbor.col] = nextDist;
        parentMap.set(nk, { row: r, col: c });
        heap.push([nextDist, neighbor.row, neighbor.col]);
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── A* ──
function astar(grid: Grid, start: Position, end: Position, diagonal: boolean): Omit<AlgorithmResult, 'time'> {
  const heuristic = (r: number, c: number) => {
    const dr = Math.abs(r - end.row);
    const dc = Math.abs(c - end.col);
    if (diagonal) {
      return (dr + dc) + (Math.sqrt(2) - 2) * Math.min(dr, dc);
    } else {
      return dr + dc;
    }
  };

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
      const gScores: Record<string, number> = {};
      const hScores: Record<string, number> = {};
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (gScore[row][col] < 1e9) {
            const k = `${row},${col}`;
            gScores[k] = +gScore[row][col].toFixed(1);
            hScores[k] = +heuristic(row, col).toFixed(1);
          }
        }
      }
      return { 
        visitOrder, 
        path: reconstructPath(parentMap, start, end),
        gScores,
        hScores
      };
    }

    const neighbors = getNeighbors(r, c, grid, diagonal);
    for (const neighbor of neighbors) {
      const nk = `${neighbor.row},${neighbor.col}`;
      if (closed.has(nk)) continue;

      const stepCost = neighbor.cost * getWeight(grid, neighbor.row, neighbor.col);
      const ng = gv + stepCost;
      if (ng < gScore[neighbor.row][neighbor.col]) {
        gScore[neighbor.row][neighbor.col] = ng;
        parentMap.set(nk, { row: r, col: c });
        heap.push([ng + heuristic(neighbor.row, neighbor.col), ng, neighbor.row, neighbor.col]);
      }
    }
  }

  return { visitOrder, path: [] };
}

// ── Public API ──
type AlgorithmFn = (grid: Grid, start: Position, end: Position, diagonal: boolean) => Omit<AlgorithmResult, 'time'>;

const ALGORITHM_MAP: Record<string, AlgorithmFn> = {
  bfs,
  dijkstra,
  astar,
};

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
  return { ...result, time };
}

