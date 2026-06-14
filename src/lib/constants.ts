import type { Translations, Language } from '@/types';

// ── Grid Dimensions ──
export const COLS = 40;
export const ROWS = 24;
export const CELL = 22;
export const CANVAS_W = COLS * CELL;
export const CANVAS_H = ROWS * CELL;

// ── LiDAR sensor range (in grid cells) ──
// Shared between the canvas (visual reveal) and the fog hook (info-gain estimate).
// Kept deliberately short so the robot must genuinely explore rather than
// "see" most of the map from a distance.
export const LIDAR_CELL_RANGE = 2.8;

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

// ── Colors (4-Color Light Theme palette) ──
export const COLORS = {
  gridBg: '#FCFCFD',
  gridLine: '#E5E7EB',
  wall: '#1F2937',
  wallPattern: '#374151',
  fogBg: '#E2E8F0',
  fogBgRgb: '226, 232, 240',
  mudBg: '#F3F4F6',
  mudLine: '#9CA3AF',
  startBg: '#FEF3C7',
  startText: '#D97706',
  endBg: '#DCFCE7',
  endText: '#15803D',
  visited: 'rgba(217, 119, 6, 0.07)',
  visitedFresh: 'rgba(217, 119, 6, 0.18)',
  frontier: 'rgba(107, 114, 128, 0.12)',
  pathCell: 'rgba(217, 119, 6, 0.12)',
  pathLine: '#D97706',
  robotBody: 'rgba(31, 41, 55, 0.75)',
  robotActive: '#D97706',
  robotInactive: 'rgba(156, 163, 175, 0.45)',
  robotCenter: '#FCFCFD',
  robotCenterInactive: '#6B7280',
  lidarRay: 'rgba(217, 119, 6, {alpha})',
  lidarSweep: 'rgba(217, 119, 6, 0.06)',
  lidarSweepInactive: 'rgba(217, 119, 6, 0.01)',
  pulseActive: 'rgba(217, 119, 6, 0.06)',
  pulseInactive: 'rgba(217, 119, 6, 0.01)',
  doneGlow: 'rgba(217, 119, 6, {alpha})',
} as const;

export const ALGO_COLORS = {
  astar: {
    hex: '#D97706',
    border: 'border-[#D97706]/40',
    borderLight: 'border-[#D97706]/30',
    text: 'text-[#D97706]',
    visited: 'rgba(217, 119, 6, 0.07)',
    visitedFresh: 'rgba(217, 119, 6, 0.18)',
    path: '#D97706',
    pathCell: 'rgba(217, 119, 6, 0.12)',
    glowClass: 'shadow-glow-astar',
    glowPulseClass: 'shadow-glow-astar shadow-glow-pulse-astar',
  },
  dijkstra: {
    hex: '#6B7280',
    border: 'border-[#6B7280]/40',
    borderLight: 'border-[#6B7280]/30',
    text: 'text-[#6B7280]',
    visited: 'rgba(107, 114, 128, 0.08)',
    visitedFresh: 'rgba(107, 114, 128, 0.18)',
    path: '#6B7280',
    pathCell: 'rgba(107, 114, 128, 0.12)',
    glowClass: 'shadow-glow-dijkstra',
    glowPulseClass: 'shadow-glow-dijkstra',
  },
  bfs: {
    hex: '#BE123C',
    border: 'border-[#BE123C]/40',
    borderLight: 'border-[#BE123C]/30',
    text: 'text-[#BE123C]',
    visited: 'rgba(190, 18, 60, 0.07)',
    visitedFresh: 'rgba(190, 18, 60, 0.18)',
    path: '#BE123C',
    pathCell: 'rgba(190, 18, 60, 0.12)',
    glowClass: 'shadow-glow-bfs',
    glowPulseClass: 'shadow-glow-bfs shadow-glow-pulse-bfs',
  },
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
    pathCost: 'Total Bobot',
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
    fogModeTitle: 'Mode Fog of War (Peta Tersembunyi)',
    fogModeDesc: 'Robot menjelajahi grid dalam kabut perang. Peta hanya terungkap secara bertahap melalui jangkauan sensor LiDAR.',
    uploadImage: 'Unggah Peta Gambar',
    uploadImageDesc: 'Pilih berkas PNG/JPG untuk dijadikan labirin (Gelap = Dinding, Terang = Jalan).',
    memoryMapTitle: 'Peta Memori',
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
    pathCost: 'Total Cost',
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
    fogModeTitle: 'Fog of War Mode (Hidden Map)',
    fogModeDesc: 'Robot explores grid within sensor fog. Map reveals incrementally via LiDAR sensor range.',
    uploadImage: 'Upload Map Image',
    uploadImageDesc: 'Select PNG/JPG image to generate grid (Dark = Wall, Light = Empty).',
    memoryMapTitle: 'Memory Map',
    memoryMapDesc: 'Visualizes route coordinates allocation in SRAM/ROM address space.',
  },
};
