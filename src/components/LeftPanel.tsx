import { Separator } from '@/components/ui/separator';
import { AlgorithmSelector } from './AlgorithmSelector';
import { DrawingTools } from './DrawingTools';
import { MapPresets } from './MapPresets';
import type { AlgorithmKey, Tool, Language } from '@/types';

interface LeftPanelProps {
  lang: Language;
  algorithm: AlgorithmKey;
  tool: Tool;
  currentPreset: string;
  onSelectAlgorithm: (a: AlgorithmKey) => void;
  onSelectTool: (t: Tool) => void;
  onCompareAll: () => void;
  onSelectPreset: (id: string) => void;
}

export function LeftPanel(props: LeftPanelProps) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
