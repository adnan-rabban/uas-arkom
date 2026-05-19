import type { MapPreset } from '@/types';

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start);
}

function wallLine(rows: number[], col: number) {
  return rows.map((r) => ({ row: r, col }));
}

function wallRow(row: number, cols: number[]) {
  return cols.map((c) => ({ row, col: c }));
}

export const MAP_PRESETS: Record<string, MapPreset> = {
  default: {
    id: 'default',
    start: { row: 12, col: 2 },
    end: { row: 12, col: 37 },
    walls: [
      ...wallLine(range(0, 9), 9),
      ...wallLine(range(15, 24), 9),
      ...wallLine(range(0, 7), 18),
      ...wallLine(range(14, 24), 18),
      ...wallLine(range(2, 11), 27),
      ...wallLine(range(17, 24), 27),
      ...wallLine(range(0, 8), 35),
      ...wallLine(range(16, 24), 35),
      ...wallRow(4, range(10, 17)),
      ...wallRow(20, range(10, 17)),
      ...wallRow(8, range(19, 26)),
      ...wallRow(17, range(19, 26)),
      ...wallRow(5, range(28, 34)),
      ...wallRow(19, range(28, 34)),
      { row: 10, col: 13 }, { row: 11, col: 13 }, { row: 12, col: 13 },
      { row: 10, col: 14 }, { row: 12, col: 14 },
      { row: 9, col: 22 }, { row: 10, col: 22 }, { row: 11, col: 22 },
      { row: 12, col: 22 }, { row: 13, col: 22 },
      { row: 6, col: 31 }, { row: 7, col: 31 }, { row: 8, col: 31 },
      { row: 16, col: 31 }, { row: 17, col: 31 }, { row: 18, col: 31 },
    ],
  },
  maze: {
    id: 'maze',
    start: { row: 1, col: 1 },
    end: { row: 22, col: 38 },
    walls: [
      ...wallRow(0, range(0, 40)),
      ...wallRow(23, range(0, 40)),
      ...wallLine(range(0, 24), 0),
      ...wallLine(range(0, 24), 39),
      ...wallLine(range(0, 18), 4),
      ...wallLine(range(6, 24), 8),
      ...wallLine(range(0, 18), 12),
      ...wallLine(range(6, 24), 16),
      ...wallLine(range(0, 18), 20),
      ...wallLine(range(6, 24), 24),
      ...wallLine(range(0, 18), 28),
      ...wallLine(range(6, 24), 32),
      ...wallLine(range(0, 18), 36),
    ],
  },
  openField: {
    id: 'openField',
    start: { row: 12, col: 2 },
    end: { row: 12, col: 37 },
    walls: [
      { row: 5, col: 10 }, { row: 6, col: 10 }, { row: 7, col: 10 },
      { row: 5, col: 11 }, { row: 7, col: 11 },
      { row: 10, col: 20 }, { row: 11, col: 20 }, { row: 12, col: 20 },
      { row: 13, col: 20 }, { row: 14, col: 20 },
      { row: 10, col: 21 }, { row: 14, col: 21 },
      { row: 3, col: 30 }, { row: 4, col: 30 }, { row: 5, col: 30 },
      { row: 15, col: 30 }, { row: 16, col: 30 }, { row: 17, col: 30 },
      { row: 18, col: 15 }, { row: 19, col: 15 }, { row: 20, col: 15 },
      { row: 18, col: 16 }, { row: 20, col: 16 },
      { row: 8, col: 35 }, { row: 9, col: 35 }, { row: 10, col: 35 },
    ],
  },
  bottleneck: {
    id: 'bottleneck',
    start: { row: 12, col: 2 },
    end: { row: 12, col: 37 },
    walls: [
      ...wallLine(range(0, 11), 13),
      ...wallLine(range(13, 24), 13),
      ...wallLine(range(0, 11), 26),
      ...wallLine(range(13, 24), 26),
      ...wallRow(5, range(6, 13)),
      ...wallRow(18, range(6, 13)),
      ...wallRow(5, range(27, 34)),
      ...wallRow(18, range(27, 34)),
    ],
  },
  empty: {
    id: 'empty',
    start: { row: 12, col: 2 },
    end: { row: 12, col: 37 },
    walls: [],
  },
};
