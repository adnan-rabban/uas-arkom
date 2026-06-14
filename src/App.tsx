import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TopBar } from '@/components/TopBar';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { LegendBar } from '@/components/LegendBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGrid } from '@/hooks/useGrid';
import { useSimulation } from '@/hooks/useSimulation';
import { useFogOfWar } from '@/hooks/useSlam';
import { useKeyboard } from '@/hooks/useKeyboard';
import { CellType } from '@/types';
import type { Language, Grid, Position } from '@/types';
import { Toast } from '@/components/Toast';
import { CELL, COLS } from '@/lib/constants';
import './App.css';



function isPathBlockedOrWeighted(path: Position[], grid: Grid, diagonal: boolean): boolean {
  if (path.length > 0) {
    const firstCell = grid[path[0].row]?.[path[0].col];
    if (firstCell === CellType.WALL) return true;
  }
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (grid[to.row]?.[to.col] === CellType.WALL || grid[to.row]?.[to.col] === CellType.MUD) return true;
    if (diagonal && from.row !== to.row && from.col !== to.col) {
      if (
        grid[from.row]?.[to.col] === CellType.WALL ||
        grid[to.row]?.[from.col] === CellType.WALL
      ) {
        return true;
      }
    }
  }
  return false;
}

// ── Fog-aware path-blocked check ──
// In fog mode a path cell counts as blocked ONLY if it has been REVEALED and is
// a wall. Unrevealed cells (including the current frontier target) are "unknown",
// not blocked — the robot is allowed to head toward them to explore. This is what
// lets the robot bump into newly discovered walls and reroute instead of cheating.
function isFogPathBlocked(
  path: Position[],
  knownGrid: Grid,
  revealed: Set<number>,
  diagonal: boolean
): boolean {
  const isRevealedWall = (r: number, c: number) =>
    revealed.has(r * COLS + c) && knownGrid[r]?.[c] === CellType.WALL;
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    if (isRevealedWall(row, col)) return true;
    if (i > 0 && diagonal) {
      const from = path[i - 1];
      const to = path[i];
      if (from.row !== to.row && from.col !== to.col) {
        if (isRevealedWall(from.row, to.col) || isRevealedWall(to.row, from.col)) return true;
      }
    }
  }
  return false;
}

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const toggleLang = useCallback(() => setLang((l) => (l === 'id' ? 'en' : 'id')), []);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const {
    grid, startPos, endPos, tool, currentPreset, mazeType,
    setGrid, setStartPos, setEndPos, setCurrentPreset, setMazeType,
    setTool, clearGrid, loadPreset, generateMaze,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  } = useGrid();

  const {
    state, algorithm, visitOrder, path, pathCost,
    vstep, pstep, robotT, speed, computeTime,
    diagonal, gScores, hScores,
    serialConnected, isVirtualSerial, fogMode, toast, serialStats,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setFogMode, connectSerial, disconnectSerial,
    replan, setFogTerminal,
    reset, run, stepOnce, showToast, setToast,
  } = useSimulation();

  const {
    knownGridRef, revealedCellsRef, resetFog, revealCell, markCellDirty, syncDirtyCells,
    findNearestFrontier, buildPlanningGrid,
  } = useFogOfWar();

  const gridRef = useRef(grid);
  const stateRef = useRef(state);
  const robotTRef = useRef(robotT);
  const pathRef = useRef(path);
  const endPosRef = useRef(endPos);
  const replanRef = useRef(replan);
  const fogModeRef = useRef(fogMode);
  const diagonalRef = useRef(diagonal);
  const lastReplanTimeRef = useRef(0);
  const wallDiscoveredTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleWallDiscoveredRef = useRef<() => void>(() => {});
  // Fog frontier-exploration controller (kept in a ref to avoid stale closures
  // inside the animation-driven effects below).
  const fogStepRef = useRef<(from: Position) => void>(() => {});
  const fogSuccessShownRef = useRef(false);

  useEffect(() => {
    gridRef.current = grid;
    stateRef.current = state;
    robotTRef.current = robotT;
    pathRef.current = path;
    endPosRef.current = endPos;
    replanRef.current = replan;
    fogModeRef.current = fogMode;
    diagonalRef.current = diagonal;
  }, [grid, state, robotT, path, endPos, replan, fogMode, diagonal]);

  const handleRun = useCallback(() => {
    reset();
    if (fogMode) {
      fogSuccessShownRef.current = false;
      resetFog(grid, startPos);
      // Begin frontier-based exploration from the start. The goal coordinate is
      // NOT handed to the planner — the robot must discover it.
      fogStepRef.current(startPos);
    } else {
      run(grid, startPos, endPos);
    }
  }, [reset, run, grid, startPos, endPos, fogMode, resetFog]);

  const handleStep = useCallback(() => {
    if (fogMode) {
      // In fog mode a manual "step" simply (re)starts/continues autonomous
      // frontier exploration, since a blind robot cannot meaningfully single-step.
      if (stateRef.current === 'idle') {
        fogSuccessShownRef.current = false;
        resetFog(grid, startPos);
      }
      const from = stateRef.current === 'idle' || pathRef.current.length === 0
        ? startPos
        : pathRef.current[Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1)];
      fogStepRef.current(from);
      return;
    }
    stepOnce(grid, startPos, endPos);
  }, [stepOnce, grid, startPos, endPos, fogMode, resetFog]);

  const handleReset = useCallback(() => {
    if (wallDiscoveredTimeoutRef.current) {
      clearTimeout(wallDiscoveredTimeoutRef.current);
      wallDiscoveredTimeoutRef.current = null;
    }
    reset();
    if (fogMode) {
      resetFog(grid, startPos);
    }
  }, [reset, resetFog, grid, startPos, fogMode]);

  const handleClear = useCallback(() => {
    if (wallDiscoveredTimeoutRef.current) {
      clearTimeout(wallDiscoveredTimeoutRef.current);
      wallDiscoveredTimeoutRef.current = null;
    }
    reset();
    clearGrid();
  }, [reset, clearGrid]);

  const handleLoadPreset = useCallback(
    (id: string) => {
      if (wallDiscoveredTimeoutRef.current) {
        clearTimeout(wallDiscoveredTimeoutRef.current);
        wallDiscoveredTimeoutRef.current = null;
      }
      reset();
      loadPreset(id);
    },
    [reset, loadPreset]
  );

  const handleUploadPreset = useCallback(
    (newGrid: Grid, start: Position, end: Position) => {
      if (wallDiscoveredTimeoutRef.current) {
        clearTimeout(wallDiscoveredTimeoutRef.current);
        wallDiscoveredTimeoutRef.current = null;
      }
      reset();
      setGrid(newGrid);
      setStartPos(start);
      setEndPos(end);
      setCurrentPreset('custom_image');
    },
    [reset, setGrid, setStartPos, setEndPos, setCurrentPreset]
  );

  const handleToggleFogMode = useCallback(() => {
    if (stateRef.current !== 'idle' && stateRef.current !== 'done') return;
    setFogMode((prev) => !prev);
  }, [setFogMode]);

  const handleRevealCell = useCallback(
    (r: number, c: number): boolean => {
      return revealCell(r, c, gridRef.current);
    },
    [revealCell]
  );

  // ── Frontier-exploration controller ──
  // Decides the robot's next target each time it must (re)plan during fog mode:
  //   • If LiDAR has already revealed the goal cell → head straight for the goal.
  //   • Otherwise → head for the nearest frontier (boundary of the known map).
  // The real goal coordinate is only ever used AFTER it has been physically
  // revealed, so the robot genuinely searches instead of beelining to the target.
  useEffect(() => {
    fogStepRef.current = (from: Position) => {
      const rc = revealedCellsRef.current;
      const end = endPosRef.current;
      const goalRevealed = rc.has(end.row * COLS + end.col);

      if (goalRevealed) {
        // Goal is known: plan a real route to it through revealed-safe territory.
        setFogTerminal(true);
        const planGrid = buildPlanningGrid();
        replanRef.current(planGrid, from, end);
        return;
      }

      // Goal still hidden: pick the nearest unexplored frontier to drive toward.
      const frontier = findNearestFrontier(from);
      if (!frontier) {
        // No reachable frontier left and the goal was never found.
        setFogTerminal(false);
        if (!fogSuccessShownRef.current) {
          showToast('error', 'Area terjangkau telah dipetakan penuh — tujuan tidak ditemukan.');
          fogSuccessShownRef.current = true;
        }
        setState('done');
        return;
      }
      setFogTerminal(false);
      const planGrid = buildPlanningGrid(frontier);
      replanRef.current(planGrid, from, frontier);
    };
  });

  useEffect(() => {
    handleWallDiscoveredRef.current = () => {
      if (!fogModeRef.current || stateRef.current !== 'moving') return;
      const now = performance.now();
      const timeSinceLastReplan = now - lastReplanTimeRef.current;
      if (timeSinceLastReplan < 300) {
        if (wallDiscoveredTimeoutRef.current) return;
        const delay = 300 - timeSinceLastReplan;
        wallDiscoveredTimeoutRef.current = setTimeout(() => {
          wallDiscoveredTimeoutRef.current = null;
          handleWallDiscoveredRef.current();
        }, delay);
        return;
      }
      const currIdx = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
      const remaining = pathRef.current.slice(currIdx);
      const blocked = isFogPathBlocked(remaining, knownGridRef.current, revealedCellsRef.current, diagonalRef.current);
      const end = endPosRef.current;
      const goalRevealed = revealedCellsRef.current.has(end.row * COLS + end.col);
      const last = pathRef.current[pathRef.current.length - 1];
      const headingToGoal = !!last && last.row === end.row && last.col === end.col;
      // Replan if a newly revealed wall blocks us, or the goal just appeared.
      if (blocked || (goalRevealed && !headingToGoal)) {
        lastReplanTimeRef.current = now;
        fogStepRef.current(pathRef.current[currIdx]);
      }
    };
  });

  const handleWallDiscovered = useCallback(() => {
    handleWallDiscoveredRef.current();
  }, []);

  // Reset simulation when grid, start, or end position changes to keep route in sync
  useEffect(() => {
    if (stateRef.current !== 'moving') {
      reset();
    }
  }, [grid, startPos, endPos, reset]);

  useEffect(() => {
    if (stateRef.current === 'idle') {
      resetFog(gridRef.current, startPos);
    }
  }, [currentPreset, startPos, endPos, fogMode, resetFog]);

  // ── Fog: continue (or finish) exploration when a movement leg ends ──
  // Each frontier leg ends in a transient 'done' state. If the robot has reached
  // the actual goal we stop (success); otherwise we immediately plan the next
  // leg toward a fresh frontier, producing genuine wander/backtrack behaviour.
  useEffect(() => {
    if (!fogModeRef.current || state !== 'done') return;
    const end = endPosRef.current;
    const p = pathRef.current;
    const robotPos = p.length > 0 ? p[p.length - 1] : startPos;
    const atGoal = robotPos.row === end.row && robotPos.col === end.col;
    if (atGoal) {
      if (!fogSuccessShownRef.current) {
        showToast('success', 'Tujuan ditemukan! Robot berhasil menavigasi peta yang tertutup kabut.');
        fogSuccessShownRef.current = true;
      }
      return;
    }
    // Reached a frontier without finding the goal yet → keep exploring.
    fogStepRef.current(robotPos);
  }, [state, startPos, showToast]);

  useEffect(() => {
    return () => {
      if (wallDiscoveredTimeoutRef.current) {
        clearTimeout(wallDiscoveredTimeoutRef.current);
      }
    };
  }, []);

  const keyboardActions = useMemo(
    () => ({
      onRun: handleRun,
      onStep: handleStep,
      onReset: handleReset,
      onClear: handleClear,
      onToolWall: () => setTool('wall'),
      onToolStart: () => setTool('start'),
      onToolEnd: () => setTool('end'),
      onToolErase: () => setTool('erase'),
      onToolMud: () => setTool('mud'),
    }),
    [handleRun, handleStep, handleReset, handleClear, setTool]
  );

  useKeyboard(keyboardActions);

  // ── Fog-of-War: Grid change observer with dirty-cell writeback ──
  // Instead of scanning all ROWS×COLS cells on every grid mutation,
  // we intercept canvas draw events to mark individual cells as dirty,
  // then writeback only dirty+revealed cells — O(|dirty|) vs O(960).
  const getRobotPosition = useCallback((): Position | null => {
    if (pathRef.current.length === 0 || (stateRef.current !== 'moving' && stateRef.current !== 'done')) {
      return null;
    }
    const idx = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
    return pathRef.current[idx];
  }, []);

  // ── Fog-of-War: Grid change observer with dirty-cell writeback ──
  // Instead of scanning all ROWS×COLS cells on every grid mutation,
  // we intercept canvas draw events to mark individual cells as dirty,
  // then writeback only dirty+revealed cells — O(|dirty|) vs O(960).
  const fogCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const robotPos = getRobotPosition();
    if (fogModeRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = e.currentTarget.width / rect.width;
      const scaleY = e.currentTarget.height / rect.height;
      markCellDirty(
        Math.floor(((e.clientY - rect.top) * scaleY) / CELL),
        Math.floor(((e.clientX - rect.left) * scaleX) / CELL)
      );
    }
    handleCanvasMouseDown(e, robotPos);
  }, [handleCanvasMouseDown, markCellDirty, getRobotPosition]);

  const fogCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const robotPos = getRobotPosition();
    if (fogModeRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = e.currentTarget.width / rect.width;
      const scaleY = e.currentTarget.height / rect.height;
      markCellDirty(
        Math.floor(((e.clientY - rect.top) * scaleY) / CELL),
        Math.floor(((e.clientX - rect.left) * scaleX) / CELL)
      );
    }
    handleCanvasMouseMove(e, robotPos);
  }, [handleCanvasMouseMove, markCellDirty, getRobotPosition]);

  useEffect(() => {
    if (!fogModeRef.current) return;
    // Writeback: sync only dirty cells to knownGrid
    syncDirtyCells(gridRef.current);
  }, [grid, syncDirtyCells]);

  useEffect(() => {
    if (stateRef.current !== 'moving' || pathRef.current.length === 0) return;
    const currIndex = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
    if (fogModeRef.current) {
      fogStepRef.current(pathRef.current[currIndex]);
    } else {
      replanRef.current(gridRef.current, pathRef.current[currIndex], endPosRef.current);
    }
  }, [algorithm, diagonal]);

  // Periodic path monitoring during movement.
  useEffect(() => {
    if (state !== 'moving' || path.length === 0) return;
    const currIndex = Math.min(Math.floor(robotT), path.length - 1);

    // ── Fog mode: react to newly revealed walls AND goal discovery ──
    if (fogMode) {
      const rc = revealedCellsRef.current;
      const remaining = path.slice(currIndex);
      const blocked = isFogPathBlocked(remaining, knownGridRef.current, rc, diagonal);
      const goalRevealed = rc.has(endPos.row * COLS + endPos.col);
      const last = path[path.length - 1];
      const headingToGoal = !!last && last.row === endPos.row && last.col === endPos.col;
      if (blocked || (goalRevealed && !headingToGoal)) {
        const now = performance.now();
        if (now - lastReplanTimeRef.current >= 150) {
          lastReplanTimeRef.current = now;
          fogStepRef.current(path[currIndex]);
        }
      }
      return;
    }

    // ── Normal mode: existing wall/mud blocking check on the real grid ──
    const remainingPath = path.slice(currIndex);
    const isBlocked = isPathBlockedOrWeighted(remainingPath, grid, diagonal);
    if (isBlocked) {
      const now = performance.now();
      if (now - lastReplanTimeRef.current < 150) {
        const delay = 150 - (now - lastReplanTimeRef.current);
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          const latestPath = pathRef.current;
          const latestRobotT = robotTRef.current;
          if (latestState === 'moving' && latestPath.length > 0) {
            const cIdx = Math.min(Math.floor(latestRobotT), latestPath.length - 1);
            const rem = latestPath.slice(cIdx);
            if (isPathBlockedOrWeighted(rem, gridRef.current, diagonalRef.current)) {
              replan(gridRef.current, latestPath[cIdx], endPosRef.current);
            }
          }
        }, delay);
        return () => clearTimeout(timer);
      }
      lastReplanTimeRef.current = now;
      replan(grid, path[currIndex], endPos);
    }
  }, [robotT, state, path, fogMode, grid, diagonal, knownGridRef, revealedCellsRef, replan, endPos]);

  // Replan when Goal (endPos) changes dynamically during movement
  useEffect(() => {
    if (stateRef.current !== 'moving' || pathRef.current.length === 0) return;
    const currIndex = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
    if (fogModeRef.current) {
      // In fog the robot doesn't know the goal moved unless it's already revealed;
      // re-evaluate the current target (frontier or revealed goal).
      fogStepRef.current(pathRef.current[currIndex]);
    } else {
      replanRef.current(gridRef.current, pathRef.current[currIndex], endPos);
    }
  }, [endPos]);

  const getGlowClass = () => {
    const isRunning = state !== 'idle' && state !== 'done';
    if (algorithm === 'astar') return isRunning ? 'shadow-glow-astar shadow-glow-pulse-astar' : 'shadow-glow-astar';
    if (algorithm === 'bfs') return isRunning ? 'shadow-glow-bfs shadow-glow-pulse-bfs' : 'shadow-glow-bfs';
    return 'shadow-glow-dijkstra';
  };

  return (
    <TooltipProvider delay={300}>
      <div className="h-screen w-screen flex items-center justify-center p-2 lg:p-4 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 30%, #FCFCFD 0%, #F3F4F6 60%, #E5E7EB 100%)' }}>
        <div className={`w-full max-w-360 h-full max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col transition-all duration-500 rounded-2xl glass-panel ${getGlowClass()}`}>
          <TopBar
            lang={lang}
            onToggleLang={toggleLang}
            simulationState={state}
            pathFound={path.length > 0}
          />
          <div className="h-px w-full bg-black/8 shrink-0" />

          <div className="flex-1 min-h-0 flex gap-0 relative">
            <div
              className={`transition-all duration-300 ease-in-out border-r border-black/8 bg-transparent shrink-0 overflow-y-auto overflow-x-hidden scrollbar-none ${
                leftOpen ? 'w-65 p-4' : 'w-0 p-0 border-r-0'
              }`}
            >
              <div className="w-57 h-full flex flex-col justify-between">
                <LeftPanel
                  lang={lang}
                  algorithm={algorithm}
                  tool={tool}
                  currentPreset={currentPreset}
                  diagonal={diagonal}
                  fogMode={fogMode}
                  mazeType={mazeType}
                  onSelectMazeType={setMazeType}
                  onToggleDiagonal={() => setDiagonal((prev) => !prev)}
                  onToggleFogMode={handleToggleFogMode}
                  onGenerateMaze={generateMaze}
                  onSelectAlgorithm={setAlgorithm}
                  onSelectTool={setTool}
                  onSelectPreset={handleLoadPreset}
                  onUploadPreset={handleUploadPreset}
                />
              </div>
            </div>

            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-black/3 backdrop-blur-md border border-black/8 border-l-0 hover:bg-black/6 hover:text-black/75 text-black/35 w-4 h-14 flex items-center justify-center transition-all cursor-pointer rounded-r-lg"
              style={{ left: leftOpen ? '259px' : '0px', transition: 'left 300ms ease-in-out' }}
              title={leftOpen ? 'Hide Left Sidebar' : 'Show Left Sidebar'}
            >
              {leftOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            <div className="flex-1 p-4 flex flex-col justify-center min-h-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #FCFCFD 0%, #F3F4F6 100%)' }}>
              <SimulationCanvas
                grid={grid}
                startPos={startPos}
                endPos={endPos}
                visitOrder={visitOrder}
                path={path}
                vstep={vstep}
                pstep={pstep}
                robotT={robotT}
                simulationState={state}
                speed={speed}
                gScores={gScores}
                hScores={hScores}
                lang={lang}
                fogMode={fogMode}
                fogRevealedCells={revealedCellsRef}
                onRevealCell={handleRevealCell}
                onWallDiscovered={handleWallDiscovered}
                onSetVstep={setVstep}
                onSetPstep={setPstep}
                onSetRobotT={setRobotT}
                onSetState={setState}
                onMouseDown={fogCanvasMouseDown}
                onMouseMove={fogCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                algorithm={algorithm}
                diagonal={diagonal}
              />
            </div>

            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-black/3 backdrop-blur-md border border-black/8 border-r-0 hover:bg-black/6 hover:text-black/75 text-black/35 w-4 h-14 flex items-center justify-center transition-all cursor-pointer rounded-l-lg"
              style={{ right: rightOpen ? '259px' : '0px', transition: 'right 300ms ease-in-out' }}
              title={rightOpen ? 'Hide Right Sidebar' : 'Show Right Sidebar'}
            >
              {rightOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out border-l border-black/8 bg-transparent shrink-0 overflow-hidden ${
                rightOpen ? 'w-65 p-4' : 'w-0 p-0 border-l-0'
              }`}
            >
              <div className="w-57 h-full flex flex-col justify-between">
                <RightPanel
                  lang={lang}
                  speed={speed}
                  explored={vstep}
                  pathLength={path.length}
                  pathCost={pathCost}
                  computeTime={computeTime}
                  simulationState={state}
                  pathFound={path.length > 0}
                  path={path}
                  robotT={robotT}
                  serialConnected={serialConnected}
                  isVirtualSerial={isVirtualSerial}
                  serialStats={serialStats}
                  onConnectSerial={connectSerial}
                  onDisconnectSerial={disconnectSerial}
                  onSetSpeed={setSpeed}
                  onRun={handleRun}
                  onStep={handleStep}
                  onReset={handleReset}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>

          <LegendBar lang={lang} />
        </div>
      </div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </TooltipProvider>
  );
}