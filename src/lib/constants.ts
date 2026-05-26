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
  gridBg: '#000000',
  gridLine: '#161616',
  wall: '#1a1a1a',
  wallPattern: '#262626',
  mudBg: '#2a1a10',
  mudLine: '#664028',
  startBg: '#0d2613',
  startText: '#2ccb5d',
  endBg: '#300d0d',
  endText: '#e22718',
  visited: 'rgba(28, 105, 212, 0.12)',
  visitedFresh: 'rgba(28, 105, 212, 0.3)',
  frontier: 'rgba(226, 39, 24, 0.15)',
  pathCell: 'rgba(6, 83, 182, 0.25)',
  pathLine: '#1c69d4',
  robotBody: '#0d0d0d',
  robotActive: '#e22718',
  robotInactive: '#3c3c3c',
  robotCenter: '#ffffff',
  robotCenterInactive: '#7e7e7e',
  lidarRay: 'rgba(28,105,212,{alpha})',
  lidarSweep: 'rgba(28,105,212,0.12)',
  lidarSweepInactive: 'rgba(28,105,212,0.04)',
  pulseActive: 'rgba(226,39,24,0.1)',
  pulseInactive: 'rgba(226,39,24,0.03)',
  doneGlow: 'rgba(44,203,93,{alpha})',
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
    mud: 'Lumpur (Bobot: 5)',
    speed: 'Kecepatan',
    actions: 'Aksi',
    run: 'Jalankan',
    step: 'Langkah',
    reset: 'Atur Ulang',
    clear: 'Bersihkan',
    diagonal: 'Gerakan Diagonal',
    generateMaze: 'Bangun Labirin',

    telemetry: 'Telemetri',
    explored: 'Dijelajahi',
    pathLength: 'Panjang Jalur',
    computeTime: 'Waktu Komputasi',
    status: 'Status',

    algorithmInfo: 'Info Algoritma',
    astarName: 'A* (A-Star)',
    astarDesc:
      'Menggunakan heuristik jarak Manhattan/Octile untuk memandu pencarian langsung menuju tujuan. Menjamin jalur terpendek dengan eksplorasi minimal — paling efisien untuk grid navigasi.',
    dijkstraName: 'Dijkstra',
    dijkstraDesc:
      'Menjelajahi semua arah secara merata berdasarkan jarak terpendek dari titik awal. Menjamin jalur terpendek tetapi lebih banyak mengeksplorasi node dibanding A*.',
    bfsName: 'BFS (Breadth-First Search)',
    bfsDesc:
      'Menjelajahi seluruh tetangga pada kedalaman saat ini sebelum bergerak lebih dalam. Menjamin jalur terpendek pada graf tanpa bobot, tetapi mengeksplorasi paling banyak node dan mengabaikan bobot jalan.',

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
    drawHint: 'Klik & seret untuk menggambar — Seret Start/Goal untuk memindahkan',

    mapPreset: 'Preset Peta',
    presetDefault: 'Standar',
    presetMaze: 'Labirin',
    presetOpenField: 'Lapangan Terbuka',
    presetBottleneck: 'Bottleneck',
    presetEmpty: 'Kosong',

    shortcuts: 'Pintasan Keyboard',

    exportPath: 'Ekspor Kode Rute',
    exportPathDesc: 'Salin kode koordinat jalur untuk mikrokontroler Arduino atau data ROM Assembly.',
    copyCode: 'Salin Kode',
    copied: 'Disalin!',

    fValue: 'Skor F (Total)',
    gValue: 'Skor G (Jarak Awal)',
    hValue: 'Skor H (Heuristik)',
    cellInfo: 'Info Koordinat Sel',
    serialTitle: 'Koneksi Serial (Arduino)',
    serialConnect: 'Hubungkan Serial',
    serialDisconnect: 'Putuskan Serial',
    serialConnected: 'Terhubung ke Arduino',
    serialDisconnected: 'Terputus',
    serialSelectPort: 'Pilih Port COM',
    serialBaudRate: 'Baud Rate',
    arduinoCodeTitle: 'Kode Penerima Arduino (.ino)',
    arduinoCodeDesc: 'Unggah kode ini ke Arduino Anda untuk menerima perintah navigasi secara real-time.',
    slamModeTitle: 'Mode Sensor SLAM (Fog of War)',
    slamModeDesc: 'Robot menjelajahi labirin dalam kabut sensor. Peta hanya terungkap melalui LiDAR.',
    uploadImage: 'Unggah Peta Gambar',
    uploadImageDesc: 'Pilih berkas PNG/JPG untuk dijadikan labirin (Gelap = Dinding, Terang = Jalan).',
    memoryMapTitle: 'Peta Memori / Hex Dump',
    memoryMapDesc: 'Visualisasi penempatan koordinat rute pada SRAM/ROM Arduino.',
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
    mud: 'Mud (Weight: 5)',
    speed: 'Speed',
    actions: 'Actions',
    run: 'Run',
    step: 'Step',
    reset: 'Reset',
    clear: 'Clear',
    diagonal: 'Diagonal Move',
    generateMaze: 'Generate Maze',

    telemetry: 'Telemetry',
    explored: 'Explored',
    pathLength: 'Path Length',
    computeTime: 'Compute Time',
    status: 'Status',

    algorithmInfo: 'Algorithm Info',
    astarName: 'A* (A-Star)',
    astarDesc:
      'Uses Manhattan/Octile distance heuristic to guide search directly toward the goal. Guarantees shortest path with minimal exploration — most efficient for grid navigation.',
    dijkstraName: 'Dijkstra',
    dijkstraDesc:
      'Explores all directions equally based on shortest distance from start. Guarantees shortest path but explores more nodes than A*.',
    bfsName: 'BFS (Breadth-First Search)',
    bfsDesc:
      'Explores all neighbors at current depth before moving deeper. Guarantees shortest path on unweighted graphs, but explores the most nodes and ignores terrain cost.',

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
    drawHint: 'Click & drag to draw — Drag Start/Goal to reposition',

    mapPreset: 'Map Preset',
    presetDefault: 'Default',
    presetMaze: 'Maze',
    presetOpenField: 'Open Field',
    presetBottleneck: 'Bottleneck',
    presetEmpty: 'Empty',

    shortcuts: 'Keyboard Shortcuts',

    exportPath: 'Export Route Code',
    exportPathDesc: 'Copy path coordinates for Arduino microcontrollers or Assembly ROM data.',
    copyCode: 'Copy Code',
    copied: 'Copied!',

    fValue: 'F Score (Total)',
    gValue: 'G Score (Cost)',
    hValue: 'H Score (Heuristic)',
    cellInfo: 'Cell Coordinates Info',
    serialTitle: 'Serial Connection (Arduino)',
    serialConnect: 'Connect Serial',
    serialDisconnect: 'Disconnect Serial',
    serialConnected: 'Connected to Arduino',
    serialDisconnected: 'Disconnected',
    serialSelectPort: 'Select COM Port',
    serialBaudRate: 'Baud Rate',
    arduinoCodeTitle: 'Arduino Receiver Code (.ino)',
    arduinoCodeDesc: 'Upload this sketch to your Arduino to process real-time navigation characters.',
    slamModeTitle: 'SLAM Sensor Mode (Fog of War)',
    slamModeDesc: 'Robot explores grid within sensor fog. Map reveals dynamically via LiDAR.',
    uploadImage: 'Upload Map Image',
    uploadImageDesc: 'Select PNG/JPG image to generate grid (Dark = Wall, Light = Empty).',
    memoryMapTitle: 'Memory Map / Hex Dump',
    memoryMapDesc: 'Visualizes route coordinates allocation in SRAM/ROM address space.',
  },
};
