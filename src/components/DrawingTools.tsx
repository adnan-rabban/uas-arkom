import { Square, Play, Target, Eraser } from 'lucide-react';
import type { Tool, Language } from '@/types';
import { translations } from '@/lib/constants';

interface DrawingToolsProps {
  tool: Tool;
  onSelectTool: (tool: Tool) => void;
  lang: Language;
}

export function DrawingTools({ tool, onSelectTool, lang }: DrawingToolsProps) {
  const t = translations[lang];

  const tools: { value: Tool; label: string; icon: React.ReactNode; key: string; activeClass: string }[] = [
    { value: 'wall', label: t.wall, icon: <Square className="w-3.5 h-3.5" />, key: '1', activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    { value: 'start', label: t.start, icon: <Play className="w-3.5 h-3.5" />, key: '2', activeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    { value: 'end', label: t.goal, icon: <Target className="w-3.5 h-3.5" />, key: '3', activeClass: 'bg-red-500/15 text-red-300 border-red-500/30' },
    { value: 'erase', label: t.erase, icon: <Eraser className="w-3.5 h-3.5" />, key: '4', activeClass: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30' },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
        {t.drawingTools}
      </span>
      <div className="grid grid-cols-4 gap-1">
        {tools.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelectTool(item.value)}
            title={`${item.label} (${item.key})`}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-md text-white/25 border transition-all cursor-pointer ${
              tool === item.value
                ? item.activeClass
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
            }`}
          >
            {item.icon}
            <span className="text-[8px] tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
