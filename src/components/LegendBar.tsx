import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface LegendBarProps {
  lang: Language;
}

export function LegendBar({ lang }: LegendBarProps) {
  const t = translations[lang];

  const items = [
    { color: 'bg-emerald-800', label: t.start },
    { color: 'bg-red-900', label: t.goal },
    { color: 'bg-[#1c2238]', label: t.wall },
    { color: 'bg-[#0c2838]', label: t.visited },
    { color: 'bg-[#2a1e08]', label: t.frontier },
    { color: 'bg-[#0c2e60]', label: t.optimalPath },
    { color: 'bg-sky-500/30 rounded-full', label: t.robotLidar },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap px-5 py-2 border-t border-white/5 bg-[#04080f]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-sm shrink-0 ${item.color}`} />
          <span className="text-[9px] tracking-wider text-white/20">{item.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[9px] text-white/10 tracking-wide">{t.drawHint}</span>
    </div>
  );
}
