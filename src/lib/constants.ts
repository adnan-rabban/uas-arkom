import type { Translations, Language } from '@/types';

// ── Grid Dimensions ──
export const COLS = 40;
export const ROWS = 24;
export const CELL = 18;
export const CANVAS_W = COLS * CELL;
export const CANVAS_H = ROWS * CELL;

// ── Direction vectors (4-directional movement) ──
export const DIRECTIONS: [number, number][] = [
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

// ── Default positions ──
export const DEFAULT_START = { row: 12, col: 2 };
export const DEFAULT_END = { row: 12, col: 37 };

// ── Colors ──
export const COLORS = {
  gridBg: '#04080f',
  gridLine: '#0a1020',
  wall: '#181e30',
  wallPattern: '#1e2440',
  startBg: '#0a1c10',
  startText: '#3cba6a',
  endBg: '#1c0a0a',
  endText: '#e05555',
  visited: 'rgba(12,45,75,0.55)',
  visitedFresh: 'rgba(88,166,255,0.35)',
  frontier: 'rgba(200,140,20,0.4)',
  pathCell: 'rgba(18,72,155,0.9)',
  pathLine: 'rgba(70,150,255,0.75)',
  robotBody: 'rgba(6,14,36,0.94)',
  robotActive: '#58a6ff',
  robotInactive: '#264a68',
  robotCenter: '#c8e8ff',
  robotCenterInactive: '#1e4a68',
  lidarRay: 'rgba(88,166,255,{alpha})',
  lidarSweep: 'rgba(88,166,255,0.22)',
  lidarSweepInactive: 'rgba(88,166,255,0.08)',
  pulseActive: 'rgba(88,166,255,0.15)',
  pulseInactive: 'rgba(88,166,255,0.06)',
  doneGlow: 'rgba(60,186,106,{alpha})',
} as const;

// ── Translations ──
export const translations: Record<Language, Translations> = {
  id: {
    title: 'Sistem Navigasi Robot Mini',
    statusReady: 'SIAP',
    statusRunning: 'BERJALAN',
    statusFound: 'JALUR DITEMUKAN',
    statusNoPath: 'TIDAK ADA JALUR',

    algorithm: 'Algoritma',
    drawingTools: 'Alat Gambar',
    wall: 'Dinding',
    start: 'Mulai',
    goal: 'Tujuan',
    erase: 'Hapus',
    speed: 'Kecepatan',
    actions: 'Aksi',
    run: 'Jalankan',
    step: 'Langkah',
    reset: 'Atur Ulang',
    clear: 'Bersihkan',

    telemetry: 'Telemetri',
    explored: 'Dijelajahi',
    pathLength: 'Panjang Jalur',
    computeTime: 'Waktu Komputasi',
    status: 'Status',

    algorithmInfo: 'Info Algoritma',
    astarName: 'A* (A-Star)',
    astarDesc:
      'Menggunakan heuristik jarak Manhattan untuk memandu pencarian langsung menuju tujuan. Menjamin jalur terpendek dengan eksplorasi minimal — paling efisien untuk grid navigasi.',
    dijkstraName: 'Dijkstra',
    dijkstraDesc:
      'Menjelajahi semua arah secara merata berdasarkan jarak terpendek dari titik awal. Menjamin jalur terpendek tetapi lebih banyak mengeksplorasi node dibanding A*.',
    bfsName: 'BFS (Breadth-First Search)',
    bfsDesc:
      'Menjelajahi seluruh tetangga pada kedalaman saat ini sebelum bergerak lebih dalam. Menjamin jalur terpendek pada graf tanpa bobot, tetapi mengeksplorasi paling banyak node.',

    comparison: 'Perbandingan Algoritma',
    comparisonSubtitle: 'Peta yang Sama',
    nodesExplored: 'Node Dijelajahi',
    fewerNodes: 'lebih sedikit node',
    bestLabel: 'Terbaik',

    legend: 'Legenda',
    visited: 'Dikunjungi',
    frontier: 'Perbatasan',
    optimalPath: 'Jalur Optimal',
    robotLidar: 'Robot + LiDAR',
    drawHint: 'Klik & seret untuk menggambar dinding — Seret Start/Goal untuk memindahkan',

    mapPreset: 'Preset Peta',
    presetDefault: 'Standar',
    presetMaze: 'Labirin',
    presetOpenField: 'Lapangan Terbuka',
    presetBottleneck: 'Bottleneck',
    presetEmpty: 'Kosong',

    shortcuts: 'Pintasan Keyboard',
  },
  en: {
    title: 'Mini Robot Navigation System',
    statusReady: 'READY',
    statusRunning: 'RUNNING',
    statusFound: 'PATH FOUND',
    statusNoPath: 'NO PATH',

    algorithm: 'Algorithm',
    drawingTools: 'Drawing Tools',
    wall: 'Wall',
    start: 'Start',
    goal: 'Goal',
    erase: 'Erase',
    speed: 'Speed',
    actions: 'Actions',
    run: 'Run',
    step: 'Step',
    reset: 'Reset',
    clear: 'Clear',

    telemetry: 'Telemetry',
    explored: 'Explored',
    pathLength: 'Path Length',
    computeTime: 'Compute Time',
    status: 'Status',

    algorithmInfo: 'Algorithm Info',
    astarName: 'A* (A-Star)',
    astarDesc:
      'Uses Manhattan distance heuristic to guide search directly toward the goal. Guarantees shortest path with minimal exploration — most efficient for grid navigation.',
    dijkstraName: 'Dijkstra',
    dijkstraDesc:
      'Explores all directions equally based on shortest distance from start. Guarantees shortest path but explores more nodes than A*.',
    bfsName: 'BFS (Breadth-First Search)',
    bfsDesc:
      'Explores all neighbors at current depth before moving deeper. Guarantees shortest path on unweighted graphs, but explores the most nodes.',

    comparison: 'Algorithm Comparison',
    comparisonSubtitle: 'Identical Map',
    nodesExplored: 'Nodes Explored',
    fewerNodes: 'fewer nodes',
    bestLabel: 'Best',

    legend: 'Legend',
    visited: 'Visited',
    frontier: 'Frontier',
    optimalPath: 'Optimal Path',
    robotLidar: 'Robot + LiDAR',
    drawHint: 'Click & drag to draw walls — Drag Start/Goal to reposition',

    mapPreset: 'Map Preset',
    presetDefault: 'Default',
    presetMaze: 'Maze',
    presetOpenField: 'Open Field',
    presetBottleneck: 'Bottleneck',
    presetEmpty: 'Empty',

    shortcuts: 'Keyboard Shortcuts',
  },
};
