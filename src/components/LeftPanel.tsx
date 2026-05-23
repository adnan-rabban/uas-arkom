import { Separator } from '@/components/ui/separator';
import { AlgorithmSelector } from './AlgorithmSelector';
import { DrawingTools } from './DrawingTools';
import { MapPresets } from './MapPresets';
import { Compass, Sparkles } from 'lucide-react';
import type { AlgorithmKey, Tool, Language } from '@/types';
import { translations } from '@/lib/constants';

interface LeftPanelProps {
  lang: Language;
  algorithm: AlgorithmKey;
  tool: Tool;
  currentPreset: string;
  diagonal: boolean;
  onToggleDiagonal: () => void;
  onGenerateMaze: () => void;
  onSelectAlgorithm: (a: AlgorithmKey) => void;
  onSelectTool: (t: Tool) => void;
  onCompareAll: () => void;
  onSelectPreset: (id: string) => void;
}

export function LeftPanel(props: LeftPanelProps) {
  const t = translations[props.lang];
  return (
    <div className="space-y-4">
      {/* Algorithm Selection */}
      <div className="space-y-2">
        <AlgorithmSelector
          algorithm={props.algorithm}
          onSelect={props.onSelectAlgorithm}
          onCompareAll={props.onCompareAll}
          lang={props.lang}
        />
        
        {/* Diagonal Switch */}
        <button
          onClick={props.onToggleDiagonal}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-none text-[9px] font-mono tracking-widest uppercase border transition-all cursor-pointer ${
            props.diagonal
              ? 'bg-[#1c69d4]/10 text-[#1c69d4] border-[#1c69d4]'
              : 'border-[#3c3c3c] bg-transparent text-white/40 hover:border-white hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            {t.diagonal}
          </span>
          <span className="text-[8px] font-bold">{props.diagonal ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <Separator className="bg-white/5" />

      {/* Map Presets */}
      <div className="space-y-2">
        <MapPresets
          currentPreset={props.currentPreset}
          onSelectPreset={props.onSelectPreset}
          lang={props.lang}
        />
        
        {/* Generate Maze Button */}
        <button
          onClick={props.onGenerateMaze}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-none text-[9px] tracking-widest font-bold uppercase border border-[#3c3c3c] bg-transparent text-white/40 hover:border-white hover:text-white transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e22718]" />
          {t.generateMaze}
        </button>
      </div>

      <Separator className="bg-white/5" />

      {/* Drawing Tools */}
      <DrawingTools
        tool={props.tool}
        onSelectTool={props.onSelectTool}
        lang={props.lang}
      />
    </div>
  );
}
