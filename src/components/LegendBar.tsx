import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface LegendBarProps {
  lang: Language;
}

export function LegendBar({ lang }: LegendBarProps) {
  const t = translations[lang];

  const items = [
    { color: 'bg-[#FEF3C7] border border-[#D97706]/40 rounded-md', label: t.start },
    { color: 'bg-[#DCFCE7] border border-[#15803D]/40 rounded-md', label: t.goal },
    { color: 'bg-[#1F2937] border border-black/10 rounded-md', label: t.wall },
    { color: 'bg-[#F3F4F6] border border-[#9CA3AF]/30 rounded-md', label: t.mud },
    { color: 'bg-[rgba(217,119,6,0.12)] border border-[rgba(217,119,6,0.3)] rounded-md', label: t.visited },
    { color: 'bg-[rgba(107,114,128,0.18)] rounded-md', label: t.frontier },
    { color: 'bg-[#D97706] rounded-md', label: t.optimalPath },
    { color: 'bg-[#DC2626] border border-[#1F2937] rounded-full', label: t.robotLidar },
  ];

  return (
    <div className="flex items-center gap-3.5 flex-wrap px-6 py-3 border-t border-black/8 bg-black/1.5 shrink-0">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 shrink-0 ${item.color}`} />
          <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{item.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[10px] text-slate-400 font-medium tracking-[-0.01em]">{t.drawHint}</span>
    </div>
  );
}
