import { useRef, useEffect, useCallback } from 'react';
import type { Grid, Position, SimulationState } from '@/types';
import { CellType } from '@/types';
import { ROWS, COLS, CELL, CANVAS_W, CANVAS_H, COLORS } from '@/lib/constants';

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
  onSetVstep: (fn: (v: number) => number) => void;
  onSetPstep: (fn: (v: number) => number) => void;
  onSetRobotT: (fn: (v: number) => number) => void;
  onSetState: (s: SimulationState) => void;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
}

export function SimulationCanvas({
  grid, startPos, endPos, visitOrder, path,
  vstep, pstep, robotT, simulationState, speed,
  onSetVstep, onSetPstep, onSetRobotT, onSetState,
  onMouseDown, onMouseMove, onMouseUp,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lidarAngle = useRef(0);
  const pulseT = useRef(0);
  const animRef = useRef<number>(0);

  // Refs for animation loop values
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

  const getRobotPos = useCallback(() => {
    const p = pathRef.current;
    const s = startRef.current;
    if (p.length === 0) return { x: s.col * CELL + CELL / 2, y: s.row * CELL + CELL / 2, a: 0 };
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
    const MAX = CELL * 10;
    for (let i = 0; i < 80; i++) {
      const a = lidarAngle.current + (i / 80) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      let x = rx, y = ry, d = 0;
      while (d < MAX) {
        x += dx * 2; y += dy * 2; d += 2;
        const gc = Math.floor(x / CELL), gr = Math.floor(y / CELL);
        if (gc < 0 || gc >= COLS || gr < 0 || gr >= ROWS || gridRef.current[gr]?.[gc] === CellType.WALL) break;
      }
      rays.push({ x, y, d });
    }
    return rays;
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

    // -- Background --
    ctx.fillStyle = COLORS.gridBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // -- Grid lines --
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(CANVAS_W, r * CELL); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CANVAS_H); ctx.stroke(); }

    // -- Walls --
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g[r][c] === CellType.WALL) {
          const x = c * CELL, y = r * CELL;
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          ctx.fillStyle = COLORS.wallPattern;
          ctx.fillRect(x + 3, y + 3, 2, 2);
          ctx.fillRect(x + CELL - 5, y + CELL - 5, 2, 2);
          ctx.fillRect(x + CELL - 5, y + 3, 2, 2);
          ctx.fillRect(x + 3, y + CELL - 5, 2, 2);
        }
      }
    }

    // -- Start marker --
    ctx.fillStyle = COLORS.startBg;
    ctx.fillRect(s.col * CELL + 0.5, s.row * CELL + 0.5, CELL - 1, CELL - 1);
    ctx.fillStyle = COLORS.startText;
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', s.col * CELL + CELL / 2, s.row * CELL + CELL / 2);

    // -- End marker --
    ctx.fillStyle = COLORS.endBg;
    ctx.fillRect(e.col * CELL + 0.5, e.row * CELL + 0.5, CELL - 1, CELL - 1);
    ctx.fillStyle = COLORS.endText;
    ctx.fillText('E', e.col * CELL + CELL / 2, e.row * CELL + CELL / 2);

    // -- Visited cells --
    const vc = Math.floor(vs);
    for (let i = 0; i < Math.min(vc, vord.length); i++) {
      const { row: r, col: c } = vord[i];
      if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
      const fresh = Math.max(0, 1 - (vc - i) / 50);
      ctx.fillStyle = COLORS.visited;
      ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      if (fresh > 0.6) {
        ctx.fillStyle = `rgba(88,166,255,${(fresh - 0.6) * 0.35})`;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // -- Frontier glow --
    for (let i = Math.max(0, vc - 15); i < Math.min(vc, vord.length); i++) {
      const { row: r, col: c } = vord[i];
      if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
      const age = vc - i;
      if (age < 12) {
        ctx.fillStyle = `rgba(200,140,20,${(12 - age) / 12 * 0.4})`;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // -- Path cells --
    const pc = Math.floor(ps);
    if (pc > 0 && p.length > 0) {
      for (let i = 0; i < Math.min(pc, p.length); i++) {
        const { row: r, col: c } = p[i];
        if ((r === s.row && c === s.col) || (r === e.row && c === e.col)) continue;
        ctx.fillStyle = COLORS.pathCell;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.strokeStyle = COLORS.pathLine; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < Math.min(pc, p.length); i++) {
        const { row: r, col: c } = p[i];
        i === 0 ? ctx.moveTo(c * CELL + CELL / 2, r * CELL + CELL / 2) : ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
      }
      ctx.stroke();
    }

    // -- Robot --
    const showRobot = st === 'moving' || st === 'done' || (st === 'pathing' && pc > 0) || st === 'idle';
    if (showRobot) {
      const { x: rx, y: ry, a: ra } = getRobotPos();
      const active = st !== 'idle';

      const rays = castLidar(rx, ry);
      for (const ray of rays) {
        const fade = ray.d / (CELL * 10);
        ctx.strokeStyle = `rgba(88,166,255,${(1 - fade) * 0.12 + 0.02})`;
        ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(ray.x, ray.y); ctx.stroke();
      }

      ctx.strokeStyle = `rgba(88,166,255,${active ? 0.22 : 0.08})`;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rx, ry, CELL * 6, lidarAngle.current, lidarAngle.current + 0.9); ctx.stroke();

      const pr = CELL * 0.8 + Math.sin(pulseT.current * 0.05) * CELL * 0.18;
      ctx.strokeStyle = `rgba(88,166,255,${active ? 0.15 : 0.06})`;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rx, ry, pr, 0, Math.PI * 2); ctx.stroke();

      if (st === 'done' && p.length > 0) {
        const flashA = (Math.sin(pulseT.current * 0.07) + 1) * 0.5 * 0.25;
        ctx.strokeStyle = `rgba(60,186,106,${flashA})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(rx, ry, CELL * 1.2, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = COLORS.robotBody;
      ctx.beginPath(); ctx.arc(rx, ry, CELL * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = active ? COLORS.robotActive : COLORS.robotInactive; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rx, ry, CELL * 0.55, 0, Math.PI * 2); ctx.stroke();

      const fx = rx + Math.cos(ra) * CELL * 0.38;
      const fy = ry + Math.sin(ra) * CELL * 0.38;
      ctx.fillStyle = active ? '#88c4ff' : '#2a5a78';
      ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = active ? COLORS.robotCenter : COLORS.robotCenterInactive;
      ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }, [getRobotPos, castLidar]);

  useEffect(() => {
    const animate = () => {
      lidarAngle.current += 0.013;
      pulseT.current++;

      const spd = speedRef.current;

      if (stateRef.current === 'exploring') {
        onSetVstep((prev) => {
          const next = Math.min(prev + spd * 0.55, visitOrderRef.current.length);
          if (next >= visitOrderRef.current.length) {
            onSetState(pathRef.current.length > 0 ? 'pathing' : 'done');
          }
          return next;
        });
      }
      if (stateRef.current === 'pathing') {
        onSetPstep((prev) => {
          const next = Math.min(prev + spd * 0.22, pathRef.current.length);
          if (next >= pathRef.current.length) {
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

      drawFrame();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawFrame, onSetVstep, onSetPstep, onSetRobotT, onSetState]);

  return (
    <div className="relative bg-[#04080f] rounded-lg overflow-hidden border border-white/5">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block w-full h-auto cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  );
}
