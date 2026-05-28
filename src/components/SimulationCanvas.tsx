import { useRef, useEffect, useCallback, useState } from 'react';
import type { Grid, Position, SimulationState, Language, ComparisonResult } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS, CELL, CANVAS_W, CANVAS_H, COLORS, translations } from '@/lib/constants';

const CELL_INV = 1 / CELL;
const LIDAR_RANGE = CELL * 4.2;

interface SimulationCanvasProps {
  grid: Grid;
  startPos: Position;
  endPos: Position;
  visitOrder: Position[];
  path: Position[];
  vstep: number;
  pstep: number;
  robotT: number;
  simulationState: SimulationState;
  speed: number;
  gScores?: Record<string, number>;
  hScores?: Record<string, number>;
  lang: Language;
  fogMode: boolean;
  fogRevealedCells: React.MutableRefObject<Set<number>>;
  onRevealCell: (row: number, col: number) => boolean;
  onWallDiscovered: () => void;
  onSetVstep: (fn: (v: number) => number) => void;
  onSetPstep: (fn: (v: number) => number) => void;
  onSetRobotT: (fn: (v: number) => number) => void;
  onSetState: (s: SimulationState) => void;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  comparison: ComparisonResult[] | null;
  simultaneous: boolean;
}

export function SimulationCanvas({
  grid, startPos, endPos, visitOrder, path,
  vstep, pstep, robotT, simulationState, speed,
  gScores, hScores, lang, fogMode,
  fogRevealedCells, onRevealCell, onWallDiscovered,
  onSetVstep, onSetPstep, onSetRobotT, onSetState,
  onMouseDown, onMouseMove, onMouseUp,
  comparison, simultaneous,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lidarAngle = useRef(0);
  const pulseT = useRef(0);
  const animRef = useRef<number>(0);
  const ripplesRef = useRef<{ row: number; col: number; age: number }[]>([]);
  const revealedOpacitiesRef = useRef<Map<number, number>>(new Map());
  const traversedHistoryRef = useRef<Position[]>([]);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  const staticLayerRef = useRef<OffscreenCanvas | null>(null);
  const staticLayerDirtyRef = useRef(true);
  const gridLinesPathRef = useRef<Path2D | null>(null);

  const stateRef = useRef(simulationState);
  const vstepRef = useRef(vstep);
  const pstepRef = useRef(pstep);
  const robotTRef = useRef(robotT);
  const speedRef = useRef(speed);
  const visitOrderRef = useRef(visitOrder);
  const pathRef = useRef(path);
  const gridRef = useRef(grid);
  const startRef = useRef(startPos);
  const endRef = useRef(endPos);
  const slamModeRef = useRef(fogMode);
  const onRevealCellRef = useRef(onRevealCell);
  const onWallDiscoveredRef = useRef(onWallDiscovered);
  const comparisonRef = useRef(comparison);
  const simultaneousRef = useRef(simultaneous);

  useEffect(() => {
    stateRef.current = simulationState;
    vstepRef.current = vstep;
    pstepRef.current = pstep;
    robotTRef.current = robotT;
    speedRef.current = speed;
    visitOrderRef.current = visitOrder;
    pathRef.current = path;
    gridRef.current = grid;
    startRef.current = startPos;
    endRef.current = endPos;
    slamModeRef.current = fogMode;
    onRevealCellRef.current = onRevealCell;
    onWallDiscoveredRef.current = onWallDiscovered;
    comparisonRef.current = comparison;
    simultaneousRef.current = simultaneous;
    staticLayerDirtyRef.current = true;
  }, [simulationState, vstep, pstep, robotT, speed, visitOrder, path, grid, startPos, endPos, fogMode, onRevealCell, onWallDiscovered, comparison, simultaneous]);

  useEffect(() => {
    if (simulationState === 'idle') {
      traversedHistoryRef.current = [];
      ripplesRef.current = [];
      revealedOpacitiesRef.current.clear();
    } else if (simulationState === 'exploring') {
      for (const key of fogRevealedCells.current) {
        if (!revealedOpacitiesRef.current.has(key)) {
          revealedOpacitiesRef.current.set(key, 1.0);
        }
      }
    }
  }, [simulationState, fogRevealedCells]);

  const getRobotPos = useCallback(() => {
    const p = pathRef.current;
    const s = startRef.current;
    if (p.length === 0) {
      const history = traversedHistoryRef.current;
      if (history.length > 0) {
        const last = history[history.length - 1];
        return { x: last.col * CELL + CELL / 2, y: last.row * CELL + CELL / 2, a: 0 };
      }
      return { x: s.col * CELL + CELL / 2, y: s.row * CELL + CELL / 2, a: 0 };
    }
    const t = Math.min(robotTRef.current, p.length - 1);
    const fi = Math.min(Math.floor(t), p.length - 1);
    const frac = t - fi;
    const from = p[fi];
    const to = p[Math.min(fi + 1, p.length - 1)];
    return {
      x: (from.col * (1 - frac) + to.col * frac) * CELL + CELL / 2,
      y: (from.row * (1 - frac) + to.row * frac) * CELL + CELL / 2,
      a: Math.atan2(to.row - from.row, to.col - from.col),
    };
  }, []);

  const castLidar = useCallback((rx: number, ry: number) => {
    const rays: { x: number; y: number; d: number }[] = [];
    const MAX = LIDAR_RANGE;
    const isSlam = slamModeRef.current;
    const grd = gridRef.current;

    const robotRow = (ry * CELL_INV) | 0;
    const robotCol = (rx * CELL_INV) | 0;
    if (robotRow >= 0 && robotRow < ROWS && robotCol >= 0 && robotCol < COLS && isSlam) {
      onRevealCellRef.current(robotRow, robotCol);
    }

    for (let i = 0; i < 80; i++) {
      const a = lidarAngle.current + (i / 80) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      let x = rx, y = ry, d = 0;
      while (d < MAX) {
        x += dx * 2; y += dy * 2; d += 2;
        const gc = (x * CELL_INV) | 0;
        const gr = (y * CELL_INV) | 0;
        if (gc >= 0 && gc < COLS && gr >= 0 && gr < ROWS) {
          if (isSlam) {
            const isNewWall = onRevealCellRef.current(gr, gc);
            if (isNewWall && stateRef.current === 'moving') {
              onWallDiscoveredRef.current();
            }
          }
          if (grd[gr]?.[gc] === CellType.WALL) break;
        } else {
          break;
        }
      }
      rays.push({ x, y, d });
    }
    return rays;
  }, []);

  const buildStaticLayer = useCallback(() => {
    const offscreen = new OffscreenCanvas(CANVAS_W, CANVAS_H);
    const sCtx = offscreen.getContext('2d')!;
    const g = gridRef.current;

    sCtx.fillStyle = COLORS.gridBg;
    sCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!gridLinesPathRef.current) {
      const lp = new Path2D();
      for (let r = 0; r <= ROWS; r++) { lp.moveTo(0, r * CELL); lp.lineTo(CANVAS_W, r * CELL); }
      for (let c = 0; c <= COLS; c++) { lp.moveTo(c * CELL, 0); lp.lineTo(c * CELL, CANVAS_H); }
      gridLinesPathRef.current = lp;
    }
    sCtx.strokeStyle = COLORS.gridLine;
    sCtx.lineWidth = 0.5;
    sCtx.stroke(gridLinesPathRef.current);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = g[r][c];
        if (cell === CellType.WALL) {
          const x = c * CELL, y = r * CELL;
          sCtx.fillStyle = COLORS.wall;
          sCtx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          sCtx.fillStyle = COLORS.wallPattern;
          sCtx.fillRect(x + 3, y + 3, 2, 2);
          sCtx.fillRect(x + CELL - 5, y + CELL - 5, 2, 2);
          sCtx.fillRect(x + CELL - 5, y + 3, 2, 2);
          sCtx.fillRect(x + 3, y + CELL - 5, 2, 2);
        } else if (cell === CellType.MUD) {
          const x = c * CELL, y = r * CELL;
          sCtx.fillStyle = COLORS.mudBg;
          sCtx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          sCtx.strokeStyle = COLORS.mudLine;
          sCtx.lineWidth = 0.8;
          sCtx.beginPath();
          sCtx.moveTo(x + 3, y + CELL - 3);
          sCtx.lineTo(x + CELL - 3, y + 3);
          sCtx.stroke();
        }
      }
    }
    return offscreen;
  }, []);

  const drawFrame = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const st = stateRef.current;
    const vs = vstepRef.current;
    const ps = pstepRef.current;
    const g = gridRef.current;
    const s = startRef.current;
    const e = endRef.current;
    const vord = visitOrderRef.current;
    const p = pathRef.current;
    const isSlam = slamModeRef.current;
    const rc = fogRevealedCells.current;

    if (st === 'moving' && p.length > 0) {
      const idx = Math.min(Math.floor(robotTRef.current), p.length - 1);
      const currentCell = p[idx];
      const history = traversedHistoryRef.current;
      if (
        history.length === 0 ||
        history[history.length - 1].row !== currentCell.row ||
        history[history.length - 1].col !== currentCell.col
      ) {
        history.push(currentCell);
      }
    } else if (st === 'done' && p.length > 0) {
      const lastCell = p[p.length - 1];
      const history = traversedHistoryRef.current;
      if (
        history.length > 0 &&
        (history[history.length - 1].row !== lastCell.row || history[history.length - 1].col !== lastCell.col)
      ) {
        history.push(lastCell);
      }
    }

    if (!isSlam) {
      if (staticLayerDirtyRef.current || !staticLayerRef.current) {
        staticLayerRef.current = buildStaticLayer();
        staticLayerDirtyRef.current = false;
      }
      ctx.drawImage(staticLayerRef.current, 0, 0);
    } else {
      ctx.fillStyle = COLORS.gridBg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (!gridLinesPathRef.current) {
        const lp = new Path2D();
        for (let r = 0; r <= ROWS; r++) { lp.moveTo(0, r * CELL); lp.lineTo(CANVAS_W, r * CELL); }
        for (let c = 0; c <= COLS; c++) { lp.moveTo(c * CELL, 0); lp.lineTo(c * CELL, CANVAS_H); }
        gridLinesPathRef.current = lp;
      }
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;
      ctx.stroke(gridLinesPathRef.current);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const intKey = r * COLS + c;
          const isRevealed = rc.has(intKey);
          const x = c * CELL, y = r * CELL;

          if (!isRevealed) {
            ctx.fillStyle = '#050505';
            ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
            continue;
          }

          const cell = g[r][c];
          if (cell === CellType.WALL) {
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
            ctx.fillStyle = COLORS.wallPattern;
            ctx.fillRect(x + 3, y + 3, 2, 2);
            ctx.fillRect(x + CELL - 5, y + CELL - 5, 2, 2);
            ctx.fillRect(x + CELL - 5, y + 3, 2, 2);
            ctx.fillRect(x + 3, y + CELL - 5, 2, 2);
          } else if (cell === CellType.MUD) {
            ctx.fillStyle = COLORS.mudBg;
            ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
            ctx.strokeStyle = COLORS.mudLine;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 3, y + CELL - 3);
            ctx.lineTo(x + CELL - 3, y + 3);
            ctx.stroke();
          }
        }
      }
    }

    ctx.fillStyle = COLORS.startBg;
    ctx.fillRect(s.col * CELL + 0.5, s.row * CELL + 0.5, CELL - 1, CELL - 1);
    ctx.fillStyle = COLORS.startText;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', s.col * CELL + CELL / 2, s.row * CELL + CELL / 2);

    ctx.fillStyle = COLORS.endBg;
    ctx.fillRect(e.col * CELL + 0.5, e.row * CELL + 0.5, CELL - 1, CELL - 1);
    ctx.fillStyle = COLORS.endText;
    ctx.fillText('E', e.col * CELL + CELL / 2, e.row * CELL + CELL / 2);

    const drawBrackets = (row: number, col: number, color: string) => {
      const x = col * CELL, y = row * CELL, len = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + len);
      ctx.moveTo(x + CELL - len, y); ctx.lineTo(x + CELL, y); ctx.lineTo(x + CELL, y + len);
      ctx.moveTo(x + len, y + CELL); ctx.lineTo(x, y + CELL); ctx.lineTo(x, y + CELL - len);
      ctx.moveTo(x + CELL - len, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.lineTo(x + CELL, y + CELL - len);
      ctx.stroke();
    };
    drawBrackets(s.row, s.col, COLORS.startText);
    drawBrackets(e.row, e.col, COLORS.endText);

    const vc = Math.floor(vs);
    const isSimul = simultaneousRef.current && comparisonRef.current && comparisonRef.current.length > 0;

    if (isSimul) {
      // 1. Draw BFS Explored (Red - Widest front)
      const bfsData = comparisonRef.current!.find(r => r.algorithm === 'bfs');
      if (bfsData) {
        const bfsV = bfsData.result.visitOrder;
        const limit = Math.min(vc, bfsV.length);
        for (let i = 0; i < limit; i++) {
          const { row: r, col: c } = bfsV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          ctx.fillStyle = 'rgba(226, 39, 24, 0.08)';
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
        for (let i = Math.max(0, limit - 15); i < limit; i++) {
          const { row: r, col: c } = bfsV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          const age = limit - i;
          if (age < 12) {
            ctx.fillStyle = `rgba(226, 39, 24, ${(12 - age) / 12 * 0.3})`;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // 2. Draw Dijkstra Explored (Indigo - Medium front)
      const dijkstraData = comparisonRef.current!.find(r => r.algorithm === 'dijkstra');
      if (dijkstraData) {
        const dijkstraV = dijkstraData.result.visitOrder;
        const limit = Math.min(vc, dijkstraV.length);
        for (let i = 0; i < limit; i++) {
          const { row: r, col: c } = dijkstraV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          ctx.fillStyle = 'rgba(6, 83, 182, 0.12)';
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
        for (let i = Math.max(0, limit - 15); i < limit; i++) {
          const { row: r, col: c } = dijkstraV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          const age = limit - i;
          if (age < 12) {
            ctx.fillStyle = `rgba(6, 83, 182, ${(12 - age) / 12 * 0.3})`;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // 3. Draw A* Explored (Cyan - Targeted front)
      const astarData = comparisonRef.current!.find(r => r.algorithm === 'astar');
      if (astarData) {
        const astarV = astarData.result.visitOrder;
        const limit = Math.min(vc, astarV.length);
        for (let i = 0; i < limit; i++) {
          const { row: r, col: c } = astarV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          const fresh = Math.max(0, 1 - (limit - i) / 50);
          ctx.fillStyle = 'rgba(28, 105, 212, 0.16)';
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          if (fresh > 0.6) {
            ctx.fillStyle = `rgba(56, 189, 248, ${(fresh - 0.6) * 0.3})`;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
        for (let i = Math.max(0, limit - 15); i < limit; i++) {
          const { row: r, col: c } = astarV[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          const age = limit - i;
          if (age < 12) {
            ctx.fillStyle = `rgba(56, 189, 248, ${(12 - age) / 12 * 0.35})`;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
    } else {
      // Single visualization mode (BFS / Dijkstra / A* as selected)
      for (let i = 0; i < Math.min(vc, vord.length); i++) {
        const { row: r, col: c } = vord[i];
        if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
        if (isSlam && !rc.has(r * COLS + c)) continue;
        const fresh = Math.max(0, 1 - (vc - i) / 50);
        ctx.fillStyle = COLORS.visited;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        if (fresh > 0.6) {
          ctx.fillStyle = `rgba(0,102,177,${(fresh - 0.6) * 0.35})`;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }

      for (let i = Math.max(0, vc - 15); i < Math.min(vc, vord.length); i++) {
        const { row: r, col: c } = vord[i];
        if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
        if (isSlam && !rc.has(r * COLS + c)) continue;
        const age = vc - i;
        if (age < 12) {
          ctx.fillStyle = `rgba(226,39,24,${(12 - age) / 12 * 0.4})`;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    ctx.lineWidth = 1;
    for (let ri = ripplesRef.current.length - 1; ri >= 0; ri--) {
      const ripple = ripplesRef.current[ri];
      if (isSlam && !rc.has(ripple.row * COLS + ripple.col)) continue;
      const rx2 = ripple.col * CELL + CELL / 2;
      const ry2 = ripple.row * CELL + CELL / 2;
      const radius = (ripple.age / 30) * CELL * 1.6;
      const alpha = 1 - ripple.age / 30;
      ctx.strokeStyle = `rgba(28,105,212,${alpha * 0.75})`;
      ctx.beginPath();
      ctx.arc(rx2, ry2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const history = traversedHistoryRef.current;
    if (history.length > 1) {
      ctx.strokeStyle = '#e0a800';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      let firstH = true;
      for (const pos of history) {
        if (isSlam && !rc.has(pos.row * COLS + pos.col)) continue;
        if (firstH) {
          ctx.moveTo(pos.col * CELL + CELL / 2, pos.row * CELL + CELL / 2);
          firstH = false;
        } else {
          ctx.lineTo(pos.col * CELL + CELL / 2, pos.row * CELL + CELL / 2);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const pc = Math.floor(ps);
    if (pc > 0) {
      if (isSimul) {
        // Draw BFS Path (Red dotted)
        const bfsData = comparisonRef.current!.find(r => r.algorithm === 'bfs');
        if (bfsData && bfsData.result.path.length > 0) {
          const bfsP = bfsData.result.path;
          const limitP = Math.min(pc, bfsP.length);
          ctx.strokeStyle = '#e22718';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < limitP; i++) {
            const { row: r, col: c } = bfsP[i];
            if (isSlam && !rc.has(r * COLS + c)) continue;
            if (first) {
              ctx.moveTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
              first = false;
            } else {
              ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Dijkstra Path (Indigo dashed)
        const dijkstraData = comparisonRef.current!.find(r => r.algorithm === 'dijkstra');
        if (dijkstraData && dijkstraData.result.path.length > 0) {
          const dijkstraP = dijkstraData.result.path;
          const limitP = Math.min(pc, dijkstraP.length);
          ctx.strokeStyle = '#0653b6';
          ctx.lineWidth = 2.0;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < limitP; i++) {
            const { row: r, col: c } = dijkstraP[i];
            if (isSlam && !rc.has(r * COLS + c)) continue;
            if (first) {
              ctx.moveTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
              first = false;
            } else {
              ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw A* Path (Solid Cyan with pulse)
        const astarData = comparisonRef.current!.find(r => r.algorithm === 'astar');
        if (astarData && astarData.result.path.length > 0) {
          const astarP = astarData.result.path;
          const limitP = Math.min(pc, astarP.length);
          for (let i = 0; i < limitP; i++) {
            const { row: r, col: c } = astarP[i];
            if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
            if (isSlam && !rc.has(r * COLS + c)) continue;
            ctx.fillStyle = 'rgba(28, 105, 212, 0.15)';
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }

          ctx.strokeStyle = '#1c69d4';
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < limitP; i++) {
            const { row: r, col: c } = astarP[i];
            if (isSlam && !rc.has(r * COLS + c)) continue;
            if (first) {
              ctx.moveTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
              first = false;
            } else {
              ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
          }
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 5]);
          ctx.lineDashOffset = -pulseT.current * 0.45;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (p.length > 0) {
        // Single algorithm path
        for (let i = 0; i < Math.min(pc, p.length); i++) {
          const { row: r, col: c } = p[i];
          if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
          if (isSlam && !rc.has(r * COLS + c)) continue;
          ctx.fillStyle = COLORS.pathCell;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }

        ctx.strokeStyle = COLORS.pathLine;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        let firstP = true;
        for (let i = 0; i < Math.min(pc, p.length); i++) {
          const { row: r, col: c } = p[i];
          if (isSlam && !rc.has(r * COLS + c)) continue;
          if (firstP) {
            ctx.moveTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
            firstP = false;
          } else {
            ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
          }
        }
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 5]);
        ctx.lineDashOffset = -pulseT.current * 0.45;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const showRobot = st === 'moving' || st === 'done' || (st === 'pathing' && pc > 0) || st === 'idle';
    if (showRobot) {
      const { x: rx, y: ry, a: ra } = getRobotPos();
      const active = st !== 'idle';
      const rays = castLidar(rx, ry);

      for (const ray of rays) {
        const fade = ray.d / LIDAR_RANGE;
        ctx.strokeStyle = `rgba(28,105,212,${(1 - fade) * 0.12 + 0.02})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(ray.x, ray.y);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(28,105,212,${active ? 0.12 : 0.04})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(rx, ry, CELL * 4.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(28,105,212,${active ? 0.2 : 0.05})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(rx - CELL * 4.7, ry); ctx.lineTo(rx + CELL * 4.7, ry);
      ctx.moveTo(rx, ry - CELL * 4.7); ctx.lineTo(rx, ry + CELL * 4.7);
      ctx.stroke();

      ctx.strokeStyle = `rgba(28,105,212,${active ? 0.18 : 0.05})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(rx, ry, CELL * 4.7, -lidarAngle.current * 0.8, -lidarAngle.current * 0.8 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = `rgba(28,105,212,${active ? 0.22 : 0.08})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, CELL * 6, lidarAngle.current, lidarAngle.current + 0.9);
      ctx.stroke();

      const pr = CELL * 0.8 + Math.sin(pulseT.current * 0.05) * CELL * 0.18;
      ctx.strokeStyle = `rgba(28,105,212,${active ? 0.15 : 0.06})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, pr, 0, Math.PI * 2);
      ctx.stroke();

      if (st === 'done' && p.length > 0) {
        const flashA = (Math.sin(pulseT.current * 0.07) + 1) * 0.5 * 0.25;
        ctx.strokeStyle = `rgba(15,163,54,${flashA})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rx, ry, CELL * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = COLORS.robotBody;
      ctx.beginPath();
      ctx.arc(rx, ry, CELL * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active ? COLORS.robotActive : COLORS.robotInactive;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rx, ry, CELL * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      const fx = rx + Math.cos(ra) * CELL * 0.38;
      const fy = ry + Math.sin(ra) * CELL * 0.38;
      ctx.fillStyle = active ? '#ffffff' : '#7e7e7e';
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = active ? COLORS.robotCenter : COLORS.robotCenterInactive;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isSlam) {
      for (const [key, opacity] of revealedOpacitiesRef.current) {
        if (opacity >= 1.0) continue;
        const r = (key / COLS) | 0;
        const c = key % COLS;
        const x = c * CELL, y = r * CELL;
        ctx.fillStyle = `rgba(5,5,5,${1.0 - opacity})`;
        ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        ctx.strokeStyle = `rgba(56,189,248,${(1.0 - opacity) * 0.7})`;
        ctx.lineWidth = 1.0;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      }
    }
  }, [getRobotPos, castLidar, buildStaticLayer, fogRevealedCells]);

  useEffect(() => {
    const animate = () => {
      lidarAngle.current += 0.013;
      pulseT.current++;

      const spd = speedRef.current;

      const isSimul = simultaneousRef.current && comparisonRef.current && comparisonRef.current.length > 0;

      if (stateRef.current === 'exploring') {
        onSetVstep((prev) => {
          const maxVisitOrderLen = isSimul
            ? Math.max(0, ...comparisonRef.current!.map(r => r.result.visitOrder.length))
            : visitOrderRef.current.length;

          const next = Math.min(prev + spd * 0.55, maxVisitOrderLen);
          const prevInt = Math.floor(prev);
          const nextInt = Math.floor(next);
          if (nextInt > prevInt) {
            // Ripples for currently active algorithm
            const activeVord = visitOrderRef.current;
            for (let i = prevInt; i < nextInt; i++) {
              if (activeVord[i]) {
                ripplesRef.current.push({
                  row: activeVord[i].row,
                  col: activeVord[i].col,
                  age: 0,
                });
              }
            }
          }
          if (next >= maxVisitOrderLen) {
            const hasAnyPath = isSimul
              ? comparisonRef.current!.some(r => r.result.path.length > 0)
              : pathRef.current.length > 0;
            onSetState(hasAnyPath ? 'pathing' : 'done');
          }
          return next;
        });
      }

      if (stateRef.current === 'pathing') {
        onSetPstep((prev) => {
          const maxPathLen = isSimul
            ? Math.max(0, ...comparisonRef.current!.map(r => r.result.path.length))
            : pathRef.current.length;

          const next = Math.min(prev + spd * 0.22, maxPathLen);
          if (next >= maxPathLen) {
            onSetState('moving');
            onSetRobotT(() => 0);
          }
          return next;
        });
      }

      if (stateRef.current === 'moving') {
        onSetRobotT((prev) => {
          const next = Math.min(prev + spd * 0.005, pathRef.current.length - 1);
          if (next >= pathRef.current.length - 1) {
            onSetState('done');
          }
          return next;
        });
      }

      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        ripplesRef.current[i].age++;
        if (ripplesRef.current[i].age >= 30) {
          ripplesRef.current.splice(i, 1);
        }
      }

      const opacities = revealedOpacitiesRef.current;
      for (const key of fogRevealedCells.current) {
        if (!opacities.has(key)) {
          opacities.set(key, 0.05);
        } else {
          const val = opacities.get(key)!;
          if (val < 1.0) opacities.set(key, Math.min(val + 0.07, 1.0));
        }
      }

      drawFrame();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawFrame, onSetVstep, onSetPstep, onSetRobotT, onSetState, fogRevealedCells]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onMouseMove(e);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !canvasRef.current) return;
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
      const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        setHoveredCell({ row, col });
      } else {
        setHoveredCell(null);
      }
    },
    [onMouseMove]
  );

  const handleMouseLeave = useCallback(() => {
    onMouseUp();
    setHoveredCell(null);
  }, [onMouseUp]);

  const t = translations[lang];

  return (
    <div className="relative bg-[#0d0d0d] rounded-none overflow-hidden flex-1 flex items-center justify-center min-h-0 h-full w-full crt-overlay p-2">
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/20 pointer-events-none" />
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="max-h-full max-w-full object-contain block cursor-crosshair bg-black border border-[#3c3c3c]"
        onMouseDown={onMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredCell && simulationState === 'done' && (() => {
        const key = `${hoveredCell.row},${hoveredCell.col}`;
        const cellValue = grid[hoveredCell.row]?.[hoveredCell.col];
        let cellTypeName = t.presetEmpty;
        if (cellValue === CellType.WALL) cellTypeName = t.wall;
        else if (cellValue === CellType.MUD) cellTypeName = t.mud.split(' ')[0];
        else if (hoveredCell.row === startPos.row && hoveredCell.col === startPos.col) cellTypeName = t.start;
        else if (hoveredCell.row === endPos.row && hoveredCell.col === endPos.col) cellTypeName = t.goal;
        const gVal = gScores?.[key];
        const hVal = hScores?.[key];
        const fVal = gVal !== undefined && hVal !== undefined ? +(gVal + hVal).toFixed(1) : undefined;
        return (
          <div className="absolute top-4 left-4 z-20 bg-black/85 border border-[#3c3c3c] p-3 text-[10px] font-mono text-white/80 select-none backdrop-blur-md pointer-events-none w-[180px] space-y-1.5 shadow-2xl">
            <div className="border-b border-[#3c3c3c] pb-1 font-bold text-white/50 flex justify-between">
              <span>{t.cellInfo}</span>
              <span className="text-[#1c69d4] font-bold">[{hoveredCell.row}, {hoveredCell.col}]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Type:</span>
              <span className="text-white/90 font-semibold">{cellTypeName}</span>
            </div>
            {gVal !== undefined && (
              <>
                <div className="flex justify-between">
                  <span className="text-white/40">g(n) (Cost):</span>
                  <span className="text-white/90 font-semibold">{gVal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">h(n) (Heur):</span>
                  <span className="text-white/90 font-semibold">{hVal}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-bold">
                  <span className="text-[#1c69d4]">f(n) (Total):</span>
                  <span className="text-[#1c69d4]">{fVal}</span>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}