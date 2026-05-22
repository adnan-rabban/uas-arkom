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
    { value: 'wall', label: t.wall, icon: <Square className="w-3.5 h-3.5" />, key: '1', activeClass: 'bg-[#1a1a1a] text-white border-white' },
    { value: 'start', label: t.start, icon: <Play className="w-3.5 h-3.5" />, key: '2', activeClass: 'bg-[#0d2613] text-[#2ccb5d] border-[#2ccb5d]' },
    { value: 'end', label: t.goal, icon: <Target className="w-3.5 h-3.5" />, key: '3', activeClass: 'bg-[#300d0d] text-[#e22718] border-[#e22718]' },
    { value: 'erase', label: t.erase, icon: <Eraser className="w-3.5 h-3.5" />, key: '4', activeClass: 'bg-white/10 text-white border-white' },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
        {t.drawingTools}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {tools.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelectTool(item.value)}
            title={`${item.label} (${item.key})`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-none text-white/30 border transition-all cursor-pointer ${
              tool === item.value
                ? item.activeClass
                : 'border-[#3c3c3c] bg-transparent hover:border-white hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[9px] tracking-widest font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
