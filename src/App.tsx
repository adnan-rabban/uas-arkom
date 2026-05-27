import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useKeyboard } from '@/hooks/useKeyboard';
import type { Language, Grid, Position } from '@/types';
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
    serialConnected, slamMode,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setSlamMode, connectSerial, disconnectSerial,
    replan,
    reset, run, stepOnce, compareAll,
  } = useSimulation();

  const handleRun = useCallback(() => {
    reset();
    setTimeout(() => run(grid, startPos, endPos), 10);
  }, [reset, run, grid, startPos, endPos]);

  const handleStep = useCallback(() => {
    stepOnce(grid, startPos, endPos);
  }, [stepOnce, grid, startPos, endPos]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

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

  // Dynamic Obstacles Path Replanning (Re-routing on the fly)
  useEffect(() => {
    if (state !== 'moving' || path.length === 0) return;

    const currIndex = Math.min(Math.floor(robotT), path.length - 1);
    const remainingPath = path.slice(currIndex);

    // If any upcoming cell in the path was turned into a WALL
    const isBlocked = remainingPath.some((p) => grid[p.row]?.[p.col] === 1);

    if (isBlocked) {
      const robotPos = path[currIndex];
      replan(grid, robotPos, endPos);
    }
  }, [grid, state, path, robotT, endPos, replan]);

  const pathFound = path.length > 0;

  return (
    <TooltipProvider delay={300}>
      <div className="h-screen w-screen bg-black flex items-center justify-center p-2 lg:p-4 overflow-hidden">
        <div className="w-full max-w-[1200px] h-full max-h-[calc(100vh-2rem)] bg-[#0d0d0d] border border-[#3c3c3c] rounded-none overflow-hidden flex flex-col">
          {/* Header */}
          <TopBar
            lang={lang}
            onToggleLang={toggleLang}
            simulationState={state}
            pathFound={pathFound}
          />
          {/* M Tricolor Stripe Divider */}
          <div className="m-stripe h-1 w-full shrink-0" />

          {/* Main Content: Canvas + Left/Right Sidebars */}
          <div className="flex-1 min-h-0 flex gap-0 relative">
            {/* Left Panel */}
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

            {/* Left Panel Toggle Tab */}
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-[#0d0d0d] border border-[#3c3c3c] border-l-0 hover:bg-white hover:text-black text-white/50 w-5 h-16 flex items-center justify-center transition-all cursor-pointer rounded-none"
              style={{ left: leftOpen ? '259px' : '0px', transition: 'left 300ms ease-in-out' }}
              title={leftOpen ? "Hide Left Sidebar" : "Show Left Sidebar"}
            >
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Canvas Area */}
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
                onSetVstep={setVstep}
                onSetPstep={setPstep}
                onSetRobotT={setRobotT}
                onSetState={setState}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              />
            </div>

            {/* Right Panel Toggle Tab */}
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-[#0d0d0d] border border-[#3c3c3c] border-r-0 hover:bg-white hover:text-black text-white/50 w-5 h-16 flex items-center justify-center transition-all cursor-pointer rounded-none"
              style={{ right: rightOpen ? '259px' : '0px', transition: 'right 300ms ease-in-out' }}
              title={rightOpen ? "Hide Right Sidebar" : "Show Right Sidebar"}
            >
              {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Right Panel */}
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
                  pathFound={pathFound}
                  path={path}
                  robotT={robotT}
                  serialConnected={serialConnected}
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

          {/* Comparison Panel */}
          <ComparisonPanel results={comparison} lang={lang} />

          {/* Legend */}
          <LegendBar lang={lang} />
        </div>
      </div>
    </TooltipProvider>
  );
}
