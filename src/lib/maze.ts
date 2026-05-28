import type { Position } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

export function generateDFSMaze(start: Position, end: Position): Position[] {
  const walls: Position[] = [];
  
  // Start with a grid where all cells are walls
  const isWall = Array.from({ length: ROWS }, () => new Array(COLS).fill(true));
  
  // Track visited cells in our passage grid
  // We only carve cells at even row and col indices to maintain walls in between
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const stack: Position[] = [];

  // Find a suitable even-indexed start coordinate close to the start node
  const startRow = Math.floor(start.row / 2) * 2;
  const startCol = Math.floor(start.col / 2) * 2;

  visited[startRow][startCol] = true;
  isWall[startRow][startCol] = false;
  stack.push({ row: startRow, col: startCol });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Position[] = [];

    // Neighbors are 2 steps away
    const dirs = [
      { dr: -2, dc: 0 },
      { dr: 2, dc: 0 },
      { dr: 0, dc: -2 },
      { dr: 0, dc: 2 }
    ];

    for (const { dr, dc } of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        neighbors.push({ row: nr, col: nc });
      }
    }

    if (neighbors.length > 0) {
      // Choose a random unvisited neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Carve the cell between current and next
      const wallRow = current.row + (next.row - current.row) / 2;
      const wallCol = current.col + (next.col - current.col) / 2;
      
      visited[next.row][next.col] = true;
      isWall[next.row][next.col] = false;
      isWall[wallRow][wallCol] = false;
      
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Ensure start, end, and their immediate orthogonal neighbors are cleared
  const startNeighbors = [
    start,
    { row: start.row - 1, col: start.col },
    { row: start.row + 1, col: start.col },
    { row: start.row, col: start.col - 1 },
    { row: start.row, col: start.col + 1 }
  ];

  const endNeighbors = [
    end,
    { row: end.row - 1, col: end.col },
    { row: end.row + 1, col: end.col },
    { row: end.row, col: end.col - 1 },
    { row: end.row, col: end.col + 1 }
  ];

  for (const pos of [...startNeighbors, ...endNeighbors]) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      isWall[pos.row][pos.col] = false;
    }
  }

  // Convert the perfect maze into a Braid Maze (similar to city streets)
  // by connecting dead ends to adjacent corridors. This creates multiple
  // alternative routes and eliminates floating 1x1 wall noise.
  const deadEnds: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isWall[r][c]) {
        let openCount = 0;
        const dirs = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc]) {
            openCount++;
          }
        }
        if (openCount === 1) {
          deadEnds.push({ row: r, col: c });
        }
      }
    }
  }

  // Shuffle dead ends to randomize connection order
  deadEnds.sort(() => Math.random() - 0.5);

  for (const pos of deadEnds) {
    let openCount = 0;
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];
    for (const [dr, dc] of dirs) {
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc]) {
        openCount++;
      }
    }
    if (openCount > 1) continue; // Already connected by previous step

    const candidates: { wr: number; wc: number }[] = [];
    const stepDirs = [
      { dr: -2, dc: 0, wr: -1, wc: 0 },
      { dr: 2, dc: 0, wr: 1, wc: 0 },
      { dr: 0, dc: -2, wr: 0, wc: -1 },
      { dr: 0, dc: 2, wr: 0, wc: 1 }
    ];

    for (const { dr, dc, wr, wc } of stepDirs) {
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      const wallR = pos.row + wr;
      const wallC = pos.col + wc;
      
      if (
        nr >= 0 && nr < ROWS && 
        nc >= 0 && nc < COLS && 
        !isWall[nr][nc] && 
        isWall[wallR][wallC]
      ) {
        candidates.push({ wr: wallR, wc: wallC });
      }
    }

    if (candidates.length > 0) {
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      isWall[choice.wr][choice.wc] = false;
    }
  }

  // Mirror row 22 to row 23, and col 38 to col 39 to prevent static solid walls on bottom/right
  for (let c = 0; c < COLS; c++) {
    isWall[ROWS - 1][c] = isWall[ROWS - 2][c];
  }
  for (let r = 0; r < ROWS; r++) {
    isWall[r][COLS - 1] = isWall[r][COLS - 2];
  }

  // Convert isWall grid back to a list of wall Positions
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isWall[r][c]) {
        walls.push({ row: r, col: c });
      }
    }
  }

  return walls;
}

