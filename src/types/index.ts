// ── Grid & Simulation Types ──

export const CellType = {
  EMPTY: 0,
  WALL: 1,
  MUD: 2,
} as const;

export type CellValue = (typeof CellType)[keyof typeof CellType];

export type Grid = CellValue[][];

export interface Position {
  row: number;
  col: number;
}

export type Tool = 'wall' | 'start' | 'end' | 'erase' | 'mud';

export type AlgorithmKey = 'astar' | 'dijkstra' | 'bfs';

export type SimulationState =
  | 'idle'
  | 'exploring'
  | 'pathing'
  | 'moving'
  | 'done';

export interface AlgorithmResult {
  visitOrder: Position[];
  path: Position[];
  time: number;
  gScores?: Record<string, number>;
  hScores?: Record<string, number>;
  pathCost?: number;
}

export interface ComparisonResult {
  algorithm: AlgorithmKey;
  label: string;
  result: AlgorithmResult;
}

export type Language = 'id' | 'en';

export interface Translations {
  // Top bar
  title: string;
  statusReady: string;
  statusRunning: string;
  statusFound: string;
  statusNoPath: string;

  // Control panel
  algorithm: string;
  drawingTools: string;
  wall: string;
  start: string;
  goal: string;
  erase: string;
  mud: string;
  speed: string;
  actions: string;
  run: string;
  step: string;
  reset: string;
  clear: string;
  diagonal: string;
  generateMaze: string;

  // Telemetry
  telemetry: string;
  explored: string;
  pathLength: string;
  pathCost: string;
  computeTime: string;
  status: string;

  // Algorithm info
  algorithmInfo: string;
  astarName: string;
  astarDesc: string;
  dijkstraName: string;
  dijkstraDesc: string;
  bfsName: string;
  bfsDesc: string;

  // Comparison
  comparison: string;
  comparisonSubtitle: string;
  nodesExplored: string;
  fewerNodes: string;
  bestLabel: string;

  // Legend
  legend: string;
  visited: string;
  frontier: string;
  optimalPath: string;
  robotLidar: string;
  drawHint: string;

  // Map presets
  mapPreset: string;
  presetDefault: string;
  presetMaze: string;
  presetOpenField: string;
  presetBottleneck: string;
  presetEmpty: string;

  // Keyboard shortcuts
  shortcuts: string;

  // Export path
  exportPathDesc: string;
  copyCode: string;
  copied: string;

  // Tooltips / Hover Debugger
  fValue: string;
  gValue: string;
  hValue: string;
  cellInfo: string;

  // New Translations for Innovations
  serialTitle: string;
  serialConnect: string;
  serialDisconnect: string;
  serialConnected: string;
  serialDisconnected: string;
  serialSelectPort: string;
  serialBaudRate: string;
  arduinoCodeTitle: string;
  arduinoCodeDesc: string;
  fogModeTitle: string;
  fogModeDesc: string;
  uploadImage: string;
  uploadImageDesc: string;
  memoryMapTitle: string;
  memoryMapDesc: string;
}

export interface MapPreset {
  id: string;
  walls: Position[];
  start: Position;
  end: Position;
}

