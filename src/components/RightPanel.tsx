import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Play, SkipForward, RotateCcw, Trash2, Keyboard, Code } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useCallback } from 'react';
import { TelemetryPanel } from './TelemetryPanel';
import type { SimulationState, Language, Position } from '@/types';
import { translations } from '@/lib/constants';

interface RightPanelProps {
  lang: Language;
  speed: number;
  explored: number;
  pathLength: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  path: Position[];
  onSetSpeed: (s: number) => void;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
}

export function RightPanel(props: RightPanelProps) {
  const t = translations[props.lang];
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(true);
  const [copiedType, setCopiedType] = useState<'c' | 'asm' | null>(null);
  const isRunning = props.simulationState !== 'idle' && props.simulationState !== 'done';

  const getArduinoCode = useCallback(() => {
    if (props.path.length === 0) return '';
    const coords = props.path.map((p) => `{${p.row}, ${p.col}}`).join(', ');
    return `// Arduino Navigation Route\nconst int PATH_LEN = ${props.path.length};\nconst int path[${props.path.length}][2] = {\n  ${coords}\n};`;
  }, [props.path]);

  const getAssemblyCode = useCallback(() => {
    if (props.path.length === 0) return '';
    const bytes = props.path
      .map((p) => {
        const rStr = p.row.toString(16).toUpperCase().padStart(2, '0') + 'h';
        const cStr = p.col.toString(16).toUpperCase().padStart(2, '0') + 'h';
        return `${rStr}, ${cStr}`;
      })
      .join(', ');

    const lenStr = props.path.length.toString(16).toUpperCase().padStart(2, '0') + 'h';
    return `; Assembly ROM Navigation Route\nPATH_LEN  DB ${lenStr}\nPATH_DATA DB ${bytes}`;
  }, [props.path]);

  const handleCopy = useCallback((code: string, type: 'c' | 'asm') => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1500);
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
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
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
          {t.actions}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            onClick={props.onRun}
            disabled={isRunning}
            size="sm"
            className="bg-white text-black font-bold uppercase rounded-none border border-white hover:bg-transparent hover:text-white transition-all text-[9px] tracking-widest h-8 cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3 h-3 mr-1" />
            {t.run}
          </Button>

          <Button
            onClick={props.onStep}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
          >
            <SkipForward className="w-3 h-3 mr-1" />
            {t.step}
          </Button>

          <Button
            onClick={props.onReset}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {t.reset}
          </Button>

          <Button
            onClick={props.onClear}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
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

      {/* Route Code Exporter */}
      {props.pathFound && props.path && props.path.length > 0 && (
        <>
          <Separator className="bg-white/5" />
          <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-[#1c69d4] hover:text-[#1c69d4]/80 transition-colors cursor-pointer select-none">
              <Code className="w-3.5 h-3.5" />
              {t.exportPath}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <p className="text-[8px] text-white/30 font-light leading-normal">
                {t.exportPathDesc}
              </p>

              <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 rounded-none">
                <div className="flex justify-between items-center text-[8px] border-b border-white/5 pb-1 mb-1 font-mono text-white/40">
                  <span>arduino_route.c</span>
                  <button
                    onClick={() => handleCopy(getArduinoCode(), 'c')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedType === 'c' ? t.copied : t.copyCode}
                  </button>
                </div>
                <pre className="text-[7px] font-mono text-white/60 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[80px] scrollbar-thin">
                  {getArduinoCode()}
                </pre>
              </div>

              <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 rounded-none">
                <div className="flex justify-between items-center text-[8px] border-b border-white/5 pb-1 mb-1 font-mono text-white/40">
                  <span>route.asm</span>
                  <button
                    onClick={() => handleCopy(getAssemblyCode(), 'asm')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedType === 'asm' ? t.copied : t.copyCode}
                  </button>
                </div>
                <pre className="text-[7px] font-mono text-white/60 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[80px] scrollbar-thin">
                  {getAssemblyCode()}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

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
              ['5', t.mud.split(' ')[0]],
              ['4', t.erase],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <kbd className="text-[8px] font-mono bg-[#1a1a1a] border border-[#3c3c3c] rounded-none px-1.5 py-0.5 text-white/40">
                  {key}
                </kbd>
                <span className="text-[9px] text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
