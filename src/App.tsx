import { useState, useCallback, useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TopBar } from '@/components/TopBar';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { LegendBar } from '@/components/LegendBar';
import { useGrid } from '@/hooks/useGrid';
import { useSimulation } from '@/hooks/useSimulation';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { Language } from '@/types';
import './App.css';

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const toggleLang = useCallback(() => setLang((l) => (l === 'id' ? 'en' : 'id')), []);

  const {
    grid, startPos, endPos, tool, currentPreset,
    setTool, clearGrid, loadPreset,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  } = useGrid();

  const {
    state, algorithm, visitOrder, path,
    vstep, pstep, robotT, speed, computeTime, comparison,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState,
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
    }),
    [handleRun, handleStep, handleReset, handleClear, setTool]
  );

  useKeyboard(keyboardActions);

  const pathFound = path.length > 0;

  return (
    <TooltipProvider delay={300}>
      <div className="min-h-screen bg-[#04080f] flex items-center justify-center p-4">
        <div className="w-full max-w-[1200px] bg-[#060b16] border border-white/[0.04] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Header */}
          <TopBar
            lang={lang}
            onToggleLang={toggleLang}
            simulationState={state}
            pathFound={pathFound}
          />

          {/* Main Content: Canvas + Control Panel */}
          <div className="flex gap-0">
            {/* Canvas Area */}
            <div className="flex-1 p-4">
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
                onSetVstep={setVstep}
                onSetPstep={setPstep}
                onSetRobotT={setRobotT}
                onSetState={setState}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              />
            </div>

            {/* Control Panel */}
            <ControlPanel
              lang={lang}
              algorithm={algorithm}
              tool={tool}
              speed={speed}
              explored={vstep}
              pathLength={path.length}
              computeTime={computeTime}
              simulationState={state}
              pathFound={pathFound}
              currentPreset={currentPreset}
              onSelectAlgorithm={setAlgorithm}
              onSelectTool={setTool}
              onSetSpeed={setSpeed}
              onRun={handleRun}
              onStep={handleStep}
              onReset={handleReset}
              onClear={handleClear}
              onCompareAll={handleCompareAll}
              onSelectPreset={handleLoadPreset}
            />
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
