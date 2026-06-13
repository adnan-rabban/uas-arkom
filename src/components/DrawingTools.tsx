import { Square, Play, Target, Eraser, Droplet } from 'lucide-react';
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
    { value: 'wall', label: t.wall, icon: <Square className="w-3.5 h-3.5" />, key: '1', activeClass: 'bg-[#1a1a1a] text-white border-white/30' },
    { value: 'start', label: t.start, icon: <Play className="w-3.5 h-3.5" />, key: '2', activeClass: 'bg-[#32D74B]/15 text-[#32D74B] border-[#32D74B]/30' },
    { value: 'end', label: t.goal, icon: <Target className="w-3.5 h-3.5" />, key: '3', activeClass: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30' },
    { value: 'mud', label: t.mud.split(' ')[0], icon: <Droplet className="w-3.5 h-3.5" />, key: '5', activeClass: 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30' },
    { value: 'erase', label: t.erase, icon: <Eraser className="w-3.5 h-3.5" />, key: '4', activeClass: 'bg-white/10 text-white border-white/25' },
  ];

  return (
    <div className="space-y-2.5">
      <span className="ios-label">
        {t.drawingTools}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelectTool(item.value)}
            title={`${item.label} (${item.key})`}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/35 border transition-all cursor-pointer ${
              tool === item.value
                ? item.activeClass
                : 'border-white/8 bg-white/4 hover:border-white/15 hover:text-white hover:bg-white/8'
            }`}
          >
            {item.icon}
            <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
