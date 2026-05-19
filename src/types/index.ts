// ── Grid & Simulation Types ──

export const CellType = {
  EMPTY: 0,
  WALL: 1,
} as const;

export type CellValue = (typeof CellType)[keyof typeof CellType];

export type Grid = CellValue[][];

export interface Position {
  row: number;
  col: number;
}

export type Tool = 'wall' | 'start' | 'end' | 'erase';

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
  speed: string;
  actions: string;
  run: string;
  step: string;
  reset: string;
  clear: string;

  // Telemetry
  telemetry: string;
  explored: string;
  pathLength: string;
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
}

export interface MapPreset {
  id: string;
  walls: Position[];
  start: Position;
  end: Position;
}
