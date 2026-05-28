import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TopBar } from '@/components/TopBar';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { LegendBar } from '@/components/LegendBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGrid } from '@/hooks/useGrid';
import { useSimulation } from '@/hooks/useSimulation';
import { useSlam } from '@/hooks/useSlam';
import { useKeyboard } from '@/hooks/useKeyboard';
import { CellType } from '@/types';
import type { Language, Grid, Position } from '@/types';
import { Toast } from '@/components/Toast';
import './App.css';

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const toggleLang = useCallback(() => setLang((l) => (l === 'id' ? 'en' : 'id')), []);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const {
    grid, startPos, endPos, tool, currentPreset,
    setGrid, setStartPos, setEndPos, setCurrentPreset,
    setTool, clearGrid, loadPreset, generateMaze,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  } = useGrid();

  const {
    state, algorithm, visitOrder, path,
    vstep, pstep, robotT, speed, computeTime, comparison,
    diagonal, gScores, hScores,
    serialConnected, isVirtualSerial, slamMode, toast,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setSlamMode, connectSerial, disconnectSerial,
    replan,
    reset, run, stepOnce, compareAll, setToast,
  } = useSimulation();

  const { knownGridRef, revealedCellsRef, resetSlam, revealCell } = useSlam();

  const gridRef = useRef(grid);
  const stateRef = useRef(state);
  const robotTRef = useRef(robotT);
  const pathRef = useRef(path);
  const endPosRef = useRef(endPos);
  const replanRef = useRef(replan);
  const slamModeRef = useRef(slamMode);

  useEffect(() => {
    gridRef.current = grid;
    stateRef.current = state;
    robotTRef.current = robotT;
    pathRef.current = path;
    endPosRef.current = endPos;
    replanRef.current = replan;
    slamModeRef.current = slamMode;
  }, [grid, state, robotT, path, endPos, replan, slamMode]);

  const handleRun = useCallback(() => {
    reset();
    if (slamMode) {
      resetSlam(grid, startPos, endPos);
      setTimeout(() => run(knownGridRef.current, startPos, endPos), 10);
    } else {
      setTimeout(() => run(grid, startPos, endPos), 10);
    }
  }, [reset, run, grid, startPos, endPos, slamMode, resetSlam, knownGridRef]);

  const handleStep = useCallback(() => {
    if (state === 'idle' && slamMode) {
      resetSlam(grid, startPos, endPos);
    }
    const effectiveGrid = slamMode ? knownGridRef.current : grid;
    stepOnce(effectiveGrid, startPos, endPos);
  }, [state, stepOnce, grid, startPos, endPos, slamMode, resetSlam, knownGridRef]);

  const handleReset = useCallback(() => reset(), [reset]);

  const handleClear = useCallback(() => {
    reset();
    clearGrid();
  }, [reset, clearGrid]);

  const handleCompareAll = useCallback(() => {
    reset();
    setTimeout(() => compareAll(grid, startPos, endPos), 10);
  }, [reset, compareAll, grid, startPos, endPos]);

  const handleLoadPreset = useCallback(
    (id: string) => {
      reset();
      loadPreset(id);
    },
    [reset, loadPreset]
  );

  const handleUploadPreset = useCallback(
    (newGrid: Grid, start: Position, end: Position) => {
      reset();
      setGrid(newGrid);
      setStartPos(start);
      setEndPos(end);
      setCurrentPreset('custom_image');
    },
    [reset, setGrid, setStartPos, setEndPos, setCurrentPreset]
  );

  const handleRevealCell = useCallback(
    (r: number, c: number): boolean => {
      return revealCell(r, c, gridRef.current);
    },
    [revealCell]
  );

  const handleWallDiscovered = useCallback(() => {
    if (!slamModeRef.current || stateRef.current !== 'moving') return;
    const currIdx = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
    const remaining = pathRef.current.slice(currIdx);
    const blocked = remaining.some((pos) => knownGridRef.current[pos.row]?.[pos.col] === CellType.WALL);
    if (blocked) {
      replanRef.current(knownGridRef.current, pathRef.current[currIdx], endPosRef.current);
    }
  }, [knownGridRef]);

  // Reset SLAM when state is 'idle' or when grid, startPos, endPos changes
  useEffect(() => {
    if (state === 'idle') {
      resetSlam(grid, startPos, endPos);
    }
  }, [state, grid, startPos, endPos, resetSlam]);

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

  useEffect(() => {
    if (slamModeRef.current) {
      const numRows = grid.length;
      const numCols = grid[0]?.length || 0;
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const key = r * numCols + c;
          if (revealedCellsRef.current.has(key)) {
            knownGridRef.current[r][c] = grid[r][c];
          }
        }
      }
    }

    if (stateRef.current !== 'moving' || pathRef.current.length === 0) return;
    const currIndex = Math.min(Math.floor(robotTRef.current), pathRef.current.length - 1);
    const remainingPath = pathRef.current.slice(currIndex);
    const effectiveGrid = slamModeRef.current ? knownGridRef.current : gridRef.current;
    const isBlocked = remainingPath.some((pos) => effectiveGrid[pos.row]?.[pos.col] === CellType.WALL);
    if (isBlocked) {
      replanRef.current(effectiveGrid, pathRef.current[currIndex], endPosRef.current);
    }
  }, [grid, knownGridRef, revealedCellsRef]);

  const getGlowClass = () => {
    const isRunning = state !== 'idle' && state !== 'done';
    if (algorithm === 'astar') return isRunning ? 'shadow-glow-astar shadow-glow-pulse-astar' : 'shadow-glow-astar';
    if (algorithm === 'bfs') return isRunning ? 'shadow-glow-bfs shadow-glow-pulse-bfs' : 'shadow-glow-bfs';
    return 'shadow-glow-dijkstra';
  };

  return (
    <TooltipProvider delay={300}>
      <div className="h-screen w-screen bg-black flex items-center justify-center p-2 lg:p-4 overflow-hidden">
        <div className={`w-full max-w-[1440px] h-full max-h-[calc(100vh-2rem)] bg-[#0d0d0d] border border-[#3c3c3c] rounded-none overflow-hidden flex flex-col transition-all duration-500 ${getGlowClass()}`}>
          <TopBar
            lang={lang}
            onToggleLang={toggleLang}
            simulationState={state}
            pathFound={path.length > 0}
          />
          <div className="m-stripe h-1 w-full shrink-0" />

          <div className="flex-1 min-h-0 flex gap-0 relative">
            <div
              className={`transition-all duration-300 ease-in-out border-r border-[#3c3c3c] bg-[#0d0d0d] shrink-0 overflow-y-auto overflow-x-hidden scrollbar-none ${
                leftOpen ? 'w-[260px] p-4' : 'w-0 p-0 border-r-0'
              }`}
            >
              <div className="w-[228px] h-full flex flex-col justify-between">
                <LeftPanel
                  lang={lang}
                  algorithm={algorithm}
                  tool={tool}
                  currentPreset={currentPreset}
                  diagonal={diagonal}
                  slamMode={slamMode}
                  onToggleDiagonal={() => setDiagonal((prev) => !prev)}
                  onToggleSlamMode={() => setSlamMode((prev) => !prev)}
                  onGenerateMaze={generateMaze}
                  onSelectAlgorithm={setAlgorithm}
                  onSelectTool={setTool}
                  onCompareAll={handleCompareAll}
                  onSelectPreset={handleLoadPreset}
                  onUploadPreset={handleUploadPreset}
                />
              </div>
            </div>

            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-[#0d0d0d] border border-[#3c3c3c] border-l-0 hover:bg-white hover:text-black text-white/50 w-5 h-16 flex items-center justify-center transition-all cursor-pointer rounded-none"
              style={{ left: leftOpen ? '259px' : '0px', transition: 'left 300ms ease-in-out' }}
              title={leftOpen ? 'Hide Left Sidebar' : 'Show Left Sidebar'}
            >
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className="flex-1 p-4 flex flex-col justify-center min-h-0 overflow-hidden bg-[#0d0d0d]">
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
                slamMode={slamMode}
                slamRevealedCells={revealedCellsRef}
                onRevealCell={handleRevealCell}
                onWallDiscovered={handleWallDiscovered}
                onSetVstep={setVstep}
                onSetPstep={setPstep}
                onSetRobotT={setRobotT}
                onSetState={setState}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              />
            </div>

            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-[#0d0d0d] border border-[#3c3c3c] border-r-0 hover:bg-white hover:text-black text-white/50 w-5 h-16 flex items-center justify-center transition-all cursor-pointer rounded-none"
              style={{ right: rightOpen ? '259px' : '0px', transition: 'right 300ms ease-in-out' }}
              title={rightOpen ? 'Hide Right Sidebar' : 'Show Right Sidebar'}
            >
              {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out border-l border-[#3c3c3c] bg-[#0d0d0d] shrink-0 overflow-hidden ${
                rightOpen ? 'w-[260px] p-4' : 'w-0 p-0 border-l-0'
              }`}
            >
              <div className="w-[228px] h-full flex flex-col justify-between">
                <RightPanel
                  lang={lang}
                  speed={speed}
                  explored={vstep}
                  pathLength={path.length}
                  computeTime={computeTime}
                  simulationState={state}
                  pathFound={path.length > 0}
                  path={path}
                  robotT={robotT}
                  serialConnected={serialConnected}
                  isVirtualSerial={isVirtualSerial}
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

          <ComparisonPanel results={comparison} lang={lang} />
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