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

function checkerboardPillars() {
  const cells = [];
  const rows = [4, 8, 12, 16, 20];
  for (const r of rows) {
    const cols = r % 8 === 4 ? [4, 12, 20, 28, 36] : [8, 16, 24, 32];
    for (const c of cols) {
      // Add 2x2 wall pillar
      cells.push({ row: r, col: c });
      cells.push({ row: r + 1, col: c });
      cells.push({ row: r, col: c + 1 });
      cells.push({ row: r + 1, col: c + 1 });
    }
  }
  return cells;
}

export const MAP_PRESETS: Record<string, MapPreset> = {
  default: {
    id: 'default',
    start: { row: 2, col: 2 },
    end: { row: 21, col: 37 },
    walls: [
      // Symmetric Multi-Chamber Zig-Zag (100% solvable, highly winding)
      ...wallLine(range(0, 5), 10),
      ...wallLine(range(7, 24), 10), // gap at row 5, 6
      
      ...wallLine(range(0, 17), 20), // gap at row 17, 18
      ...wallLine(range(19, 24), 20),
      
      ...wallLine(range(0, 5), 30), // gap at row 5, 6
      ...wallLine(range(7, 24), 30),
      
      // Horizontal dividers to force winding
      ...wallRow(12, range(0, 8)),
      ...wallRow(11, range(12, 18)),
      ...wallRow(17, range(12, 18)),
      ...wallRow(7, range(22, 28)),
      ...wallRow(17, range(22, 28)),
      ...wallRow(12, range(32, 40)),
    ],
  },
  maze: {
    id: 'maze',
    start: { row: 1, col: 1 },
    end: { row: 11, col: 19 }, // Target is in the deep center of the concentric spiral
    walls: [
      // Outer Border
      ...wallRow(0, range(0, 40)),
      ...wallRow(23, range(0, 40)),
      ...wallLine(range(0, 24), 0),
      ...wallLine(range(0, 24), 39),

      // Ring 1 (Outer Inner Ring - gap at col 4 and col 35)
      ...wallRow(2, range(2, 38).filter(c => c !== 4)),
      ...wallRow(21, range(2, 38).filter(c => c !== 35)),
      ...wallLine(range(2, 22).filter(r => r !== 2 && r !== 21), 2),
      ...wallLine(range(2, 22).filter(r => r !== 2 && r !== 21), 37),

      // Ring 2 (gap at col 33 and col 6)
      ...wallRow(4, range(4, 36).filter(c => c !== 33)),
      ...wallRow(19, range(4, 36).filter(c => c !== 6)),
      ...wallLine(range(4, 20).filter(r => r !== 4 && r !== 19), 4),
      ...wallLine(range(4, 20).filter(r => r !== 4 && r !== 19), 35),

      // Ring 3 (gap at col 8 and col 31)
      ...wallRow(6, range(6, 34).filter(c => c !== 8)),
      ...wallRow(17, range(6, 34).filter(c => c !== 31)),
      ...wallLine(range(6, 18).filter(r => r !== 6 && r !== 17), 6),
      ...wallLine(range(6, 18).filter(r => r !== 6 && r !== 17), 33),

      // Ring 4 (gap at col 29 and col 10)
      ...wallRow(8, range(8, 32).filter(c => c !== 29)),
      ...wallRow(15, range(8, 32).filter(c => c !== 10)),
      ...wallLine(range(8, 16).filter(r => r !== 8 && r !== 15), 8),
      ...wallLine(range(8, 16).filter(r => r !== 8 && r !== 15), 31),

      // Ring 5 (gap at col 12 and col 27)
      ...wallRow(10, range(10, 30).filter(c => c !== 12)),
      ...wallRow(13, range(10, 30).filter(c => c !== 27)),
      ...wallLine(range(10, 14).filter(r => r !== 10 && r !== 13), 10),
      ...wallLine(range(10, 14).filter(r => r !== 10 && r !== 13), 29),
    ],
  },
  openField: {
    id: 'openField',
    start: { row: 21, col: 2 },
    end: { row: 2, col: 37 },
    walls: [
      // Checkerboard Pillar Field (Asteroid course) - 100% solvable
      ...checkerboardPillars(),
      
      // Diagonal corner blockages to challenge pathfinder corner-cutting
      { row: 1, col: 10 }, { row: 2, col: 11 }, { row: 3, col: 12 },
      { row: 22, col: 10 }, { row: 21, col: 11 }, { row: 20, col: 12 },
      { row: 1, col: 28 }, { row: 2, col: 27 }, { row: 3, col: 26 },
      { row: 22, col: 28 }, { row: 21, col: 27 }, { row: 20, col: 26 },
    ],
  },
  bottleneck: {
    id: 'bottleneck',
    start: { row: 12, col: 5 },
    end: { row: 12, col: 34 },
    walls: [
      // Wall 1 (col 10) - gaps only at top (row 3) and bottom (row 20)
      ...wallLine(range(0, 3), 10),
      ...wallLine(range(4, 20), 10),
      ...wallLine(range(21, 24), 10),

      // Center divider (row 8 and 15) forcing zig-zag detour
      ...wallRow(8, range(10, 21)),
      ...wallRow(15, range(10, 21)),

      // Wall 2 (col 20) - gap only at center (row 11, 12)
      ...wallLine(range(0, 11), 20),
      ...wallLine(range(13, 24), 20),

      // Center divider 2 (row 8 and 15) forcing zig-zag detour
      ...wallRow(8, range(20, 31)),
      ...wallRow(15, range(20, 31)),

      // Wall 3 (col 30) - gaps only at top (row 3) and bottom (row 20)
      ...wallLine(range(0, 3), 30),
      ...wallLine(range(4, 20), 30),
      ...wallLine(range(22, 24), 30),
    ],
  },
  empty: {
    id: 'empty',
    start: { row: 12, col: 2 },
    end: { row: 12, col: 37 },
    walls: [],
  },
};

