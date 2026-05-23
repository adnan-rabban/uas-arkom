import { useState, useCallback, useMemo } from 'react';
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
import type { Language } from '@/types';
import './App.css';

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const toggleLang = useCallback(() => setLang((l) => (l === 'id' ? 'en' : 'id')), []);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const {
    grid, startPos, endPos, tool, currentPreset,
    setTool, clearGrid, loadPreset, generateMaze,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  } = useGrid();

  const {
    state, algorithm, visitOrder, path,
    vstep, pstep, robotT, speed, computeTime, comparison,
    diagonal, gScores, hScores,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
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
              className={`transition-all duration-300 ease-in-out border-r border-[#3c3c3c] bg-[#0d0d0d] shrink-0 overflow-y-auto overflow-x-hidden ${
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
                  onToggleDiagonal={() => setDiagonal((prev) => !prev)}
                  onGenerateMaze={generateMaze}
                  onSelectAlgorithm={setAlgorithm}
                  onSelectTool={setTool}
                  onCompareAll={handleCompareAll}
                  onSelectPreset={handleLoadPreset}
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
              className={`transition-all duration-300 ease-in-out border-l border-[#3c3c3c] bg-[#0d0d0d] shrink-0 overflow-y-auto overflow-x-hidden ${
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
