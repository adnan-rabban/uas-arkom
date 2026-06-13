import { Separator } from '@/components/ui/separator';
import { AlgorithmSelector } from './AlgorithmSelector';
import { DrawingTools } from './DrawingTools';
import { MapPresets } from './MapPresets';
import { Compass, Sparkles, EyeOff, Upload } from 'lucide-react';
import type { AlgorithmKey, Tool, Language, Grid, Position } from '@/types';
import { translations } from '@/lib/constants';

interface LeftPanelProps {
  lang: Language;
  algorithm: AlgorithmKey;
  tool: Tool;
  currentPreset: string;
  diagonal: boolean;
  fogMode: boolean;
  onToggleDiagonal: () => void;
  onToggleFogMode: () => void;
  onGenerateMaze: () => void;
  onSelectAlgorithm: (a: AlgorithmKey) => void;
  onSelectTool: (t: Tool) => void;
  onCompareAll: () => void;
  onSelectPreset: (id: string) => void;
  onUploadPreset: (grid: Grid, start: Position, end: Position) => void;
}

export function LeftPanel(props: LeftPanelProps) {
  const t = translations[props.lang];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 40; // COLS
        canvas.height = 24; // ROWS
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 40, 24);
        const imgData = ctx.getImageData(0, 0, 40, 24);
        const data = imgData.data;

        const newGrid: Grid = Array.from({ length: 24 }, () => new Array(40).fill(0));
        let customStart: Position = { row: 12, col: 2 };
        let customEnd: Position = { row: 12, col: 37 };

        for (let r = 0; r < 24; r++) {
          for (let c = 0; c < 40; c++) {
            const idx = (r * 40 + c) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];
            const alpha = data[idx + 3];

            if (alpha < 50) {
              newGrid[r][c] = 0; // EMPTY
              continue;
            }

            // Green detection
            if (green > 140 && red < 100 && blue < 100) {
              newGrid[r][c] = 0;
              customStart = { row: r, col: c };
            }
            // Red detection
            else if (red > 140 && green < 100 && blue < 100) {
              newGrid[r][c] = 0;
              customEnd = { row: r, col: c };
            }
            // Brown detection
            else if (red > 80 && red < 180 && green > 40 && green < 120 && blue < 60) {
              newGrid[r][c] = 2; // MUD
            }
            // Dark vs Light threshold
            else {
              const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
              if (brightness < 128) {
                newGrid[r][c] = 1; // WALL
              } else {
                newGrid[r][c] = 0; // EMPTY
              }
            }
          }
        }

        // Force start and end node coordinates to be empty to prevent wall blockage
        newGrid[customStart.row][customStart.col] = 0;
        newGrid[customEnd.row][customEnd.col] = 0;

        props.onUploadPreset(newGrid, customStart, customEnd);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-medium tracking-wide border transition-all cursor-pointer ${
            props.diagonal
              ? 'ios-toggle-on'
              : 'ios-toggle-off'
          }`}
        >
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            {t.diagonal}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${props.diagonal ? 'bg-[#32D74B]' : 'bg-white/15'}`} />
            <span className="text-[10px] font-semibold">{props.diagonal ? 'ON' : 'OFF'}</span>
          </span>
        </button>

        {/* Fog of War Mode Switch */}
        <button
          onClick={props.onToggleFogMode}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-medium tracking-wide border transition-all cursor-pointer mt-2 ${
            props.fogMode
              ? 'ios-toggle-on'
              : 'ios-toggle-off'
          }`}
          title={t.fogModeDesc}
        >
          <span className="flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            {t.fogModeTitle.split('(')[0].trim()}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${props.fogMode ? 'bg-[#32D74B]' : 'bg-white/15'}`} />
            <span className="text-[10px] font-semibold">{props.fogMode ? 'ON' : 'OFF'}</span>
          </span>
        </button>
      </div>

      <Separator className="bg-white/6" />

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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-medium tracking-wide border border-white/8 bg-white/4 text-white/45 hover:border-white/15 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#FF3B30]" />
          {t.generateMaze}
        </button>

        {/* Upload Image Button */}
        <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-medium tracking-wide border border-white/8 bg-white/4 text-white/45 hover:border-white/15 hover:text-white hover:bg-white/8 transition-all cursor-pointer mt-1" title={t.uploadImageDesc}>
          <Upload className="w-4 h-4 text-[#0A84FF]" />
          {t.uploadImage}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      <Separator className="bg-white/6" />

      {/* Drawing Tools */}
      <DrawingTools
        tool={props.tool}
        onSelectTool={props.onSelectTool}
        lang={props.lang}
      />
    </div>
  );
}
