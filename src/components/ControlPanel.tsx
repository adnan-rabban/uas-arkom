import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Play, SkipForward, RotateCcw, Trash2, Keyboard } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { AlgorithmSelector } from './AlgorithmSelector';
import { DrawingTools } from './DrawingTools';
import { TelemetryPanel } from './TelemetryPanel';
import { MapPresets } from './MapPresets';
import type { AlgorithmKey, Tool, SimulationState, Language } from '@/types';
import { translations } from '@/lib/constants';

interface ControlPanelProps {
  lang: Language;
  algorithm: AlgorithmKey;
  tool: Tool;
  speed: number;
  explored: number;
  pathLength: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  currentPreset: string;
  onSelectAlgorithm: (a: AlgorithmKey) => void;
  onSelectTool: (t: Tool) => void;
  onSetSpeed: (s: number) => void;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onCompareAll: () => void;
  onSelectPreset: (id: string) => void;
}

export function ControlPanel(props: ControlPanelProps) {
  const t = translations[props.lang];
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isRunning = props.simulationState !== 'idle' && props.simulationState !== 'done';

  return (
    <div className="w-72 flex-shrink-0 bg-[#080e1c]/60 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {/* Algorithm Selection */}
        <AlgorithmSelector
          algorithm={props.algorithm}
          onSelect={props.onSelectAlgorithm}
          onCompareAll={props.onCompareAll}
          lang={props.lang}
        />

        <Separator className="bg-white/5" />

        {/* Map Presets */}
        <MapPresets
          currentPreset={props.currentPreset}
          onSelectPreset={props.onSelectPreset}
          lang={props.lang}
        />

        <Separator className="bg-white/5" />

        {/* Drawing Tools */}
        <DrawingTools
          tool={props.tool}
          onSelectTool={props.onSelectTool}
          lang={props.lang}
        />

        <Separator className="bg-white/5" />

        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
              {t.speed}
            </span>
            <span className="text-[10px] font-mono text-white/25">{props.speed}x</span>
          </div>
          <Slider
            value={[props.speed]}
            onValueChange={(val) => {
              const v = Array.isArray(val) ? val[0] : val;
              props.onSetSpeed(v as number);
            }}
            min={1}
            max={20}
            step={1}
            className="py-1"
          />
        </div>

        <Separator className="bg-white/5" />

        {/* Action Buttons */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
            {t.actions}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              onClick={props.onRun}
              disabled={isRunning}
              size="sm"
              className="bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 text-[10px] tracking-wider font-mono h-8 cursor-pointer"
            >
              <Play className="w-3 h-3 mr-1" />
              {t.run}
            </Button>

            <Button
              onClick={props.onStep}
              size="sm"
              variant="ghost"
              className="text-white/30 border border-white/5 hover:bg-white/[0.04] text-[10px] tracking-wider font-mono h-8 cursor-pointer"
            >
              <SkipForward className="w-3 h-3 mr-1" />
              {t.step}
            </Button>

            <Button
              onClick={props.onReset}
              size="sm"
              variant="ghost"
              className="text-white/30 border border-white/5 hover:bg-white/[0.04] text-[10px] tracking-wider font-mono h-8 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t.reset}
            </Button>

            <Button
              onClick={props.onClear}
              size="sm"
              variant="ghost"
              className="text-white/30 border border-white/5 hover:bg-white/[0.04] text-[10px] tracking-wider font-mono h-8 cursor-pointer"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t.clear}
            </Button>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Telemetry */}
        <TelemetryPanel
          explored={props.explored}
          pathLength={props.pathLength}
          computeTime={props.computeTime}
          simulationState={props.simulationState}
          pathFound={props.pathFound}
          lang={props.lang}
        />

        <Separator className="bg-white/5" />

        {/* Keyboard Shortcuts */}
        <Collapsible open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-white/15 hover:text-white/30 transition-colors cursor-pointer">
            <Keyboard className="w-3 h-3" />
            {t.shortcuts}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1">
              {[
                ['Space', t.run],
                ['S', t.step],
                ['R', t.reset],
                ['C', t.clear],
                ['1', t.wall],
                ['2', t.start],
                ['3', t.goal],
                ['4', t.erase],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="text-[9px] font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/30">
                    {key}
                  </kbd>
                  <span className="text-[9px] text-white/20">{label}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
