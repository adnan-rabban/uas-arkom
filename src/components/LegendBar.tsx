import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface LegendBarProps {
  lang: Language;
}

export function LegendBar({ lang }: LegendBarProps) {
  const t = translations[lang];

  const items = [
    { color: 'bg-[#0d2613] border border-[#2ccb5d] rounded-none', label: t.start },
    { color: 'bg-[#300d0d] border border-[#e22718] rounded-none', label: t.goal },
    { color: 'bg-[#1a1a1a] border border-[#3c3c3c] rounded-none', label: t.wall },
    { color: 'bg-[rgba(28,105,212,0.12)] border border-[rgba(28,105,212,0.3)] rounded-none', label: t.visited },
    { color: 'bg-[rgba(226,39,24,0.15)] rounded-none', label: t.frontier },
    { color: 'bg-[#1c69d4] rounded-none', label: t.optimalPath },
    { color: 'bg-[#0d0d0d] border border-[#e22718] rounded-full', label: t.robotLidar },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap px-5 py-2.5 border-t border-[#3c3c3c] bg-black">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 shrink-0 ${item.color}`} />
          <span className="text-[9px] tracking-wider text-white/40">{item.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[9px] text-white/20 tracking-wide">{t.drawHint}</span>
    </div>
  );
}
