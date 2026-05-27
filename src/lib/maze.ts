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
  // by removing 25% of internal walls randomly to create multiple alternative routes.
  const wallRemovalChance = 0.25;
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (isWall[r][c]) {
        // Skip start and end neighborhoods so we don't clear their setup
        const nearStart = Math.abs(r - start.row) + Math.abs(c - start.col) <= 2;
        const nearEnd = Math.abs(r - end.row) + Math.abs(c - end.col) <= 2;
        if (!nearStart && !nearEnd && Math.random() < wallRemovalChance) {
          isWall[r][c] = false;
        }
      }
    }
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

