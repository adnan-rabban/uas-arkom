import type { Grid, CellValue, Position } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

export function createGrid(): Grid {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(CellType.EMPTY));
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

export function setCell(grid: Grid, row: number, col: number, value: CellValue): Grid {
  if (!inBounds(row, col)) return grid;
  const newRow = grid[row].slice();
  newRow[col] = value;
  const newGrid = grid.slice() as Grid;
  newGrid[row] = newRow;
  return newGrid;
}

export function applyWalls(grid: Grid, walls: Position[]): Grid {
  const newGrid = grid.map((r) => r.slice()) as Grid;
  for (const { row, col } of walls) {
    if (inBounds(row, col)) newGrid[row][col] = CellType.WALL;
  }
  return newGrid;
}