import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface LegendBarProps {
  lang: Language;
}

export function LegendBar({ lang }: LegendBarProps) {
  const t = translations[lang];

  const items = [
    { color: 'bg-[#0d2613] border border-[#32D74B]/40 rounded-md', label: t.start },
    { color: 'bg-[#300d0d] border border-[#FF453A]/40 rounded-md', label: t.goal },
    { color: 'bg-[#1a1a1a] border border-white/10 rounded-md', label: t.wall },
    { color: 'bg-[#2a1a10] border border-[#FF9F0A]/30 rounded-md', label: t.mud },
    { color: 'bg-[rgba(10,132,255,0.12)] border border-[rgba(10,132,255,0.3)] rounded-md', label: t.visited },
    { color: 'bg-[rgba(255,59,48,0.15)] rounded-md', label: t.frontier },
    { color: 'bg-[#0A84FF] rounded-md', label: t.optimalPath },
    { color: 'bg-[#0d0d0d] border border-[#FF453A]/40 rounded-full', label: t.robotLidar },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap px-5 py-2.5 border-t border-white/6 bg-white/2 shrink-0">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 shrink-0 ${item.color}`} />
          <span className="text-[10px] text-white/35 font-medium">{item.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[10px] text-white/20 font-medium">{t.drawHint}</span>
    </div>
  );
}
