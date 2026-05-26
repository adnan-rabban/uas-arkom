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
  slamMode: boolean;
  onToggleDiagonal: () => void;
  onToggleSlamMode: () => void;
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

        {/* SLAM Mode Switch */}
        <button
          onClick={props.onToggleSlamMode}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-none text-[9px] font-mono tracking-widest uppercase border transition-all cursor-pointer mt-1.5 ${
            props.slamMode
              ? 'bg-[#1c69d4]/10 text-[#1c69d4] border-[#1c69d4]'
              : 'border-[#3c3c3c] bg-transparent text-white/40 hover:border-white hover:text-white'
          }`}
          title={t.slamModeDesc}
        >
          <span className="flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" />
            {t.slamModeTitle.split(' ')[0] + ' ' + (t.slamModeTitle.split(' ')[1] || 'SLAM')}
          </span>
          <span className="text-[8px] font-bold">{props.slamMode ? 'ON' : 'OFF'}</span>
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

        {/* Upload Image Button */}
        <label className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-none text-[9px] tracking-widest font-bold uppercase border border-[#3c3c3c] bg-transparent text-white/40 hover:border-white hover:text-white transition-all cursor-pointer mt-1" title={t.uploadImageDesc}>
          <Upload className="w-3.5 h-3.5 text-[#1c69d4]" />
          {t.uploadImage}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
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
