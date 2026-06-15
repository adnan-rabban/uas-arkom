import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface LegendBarProps {
  lang: Language;
}

export function LegendBar({ lang }: LegendBarProps) {
  const t = translations[lang];

  return (
    <div className="flex items-center gap-3.5 flex-wrap px-6 py-3 border-t border-black/8 bg-black/1.5 shrink-0">
      {/* Start (Mulai) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[#FEF3C7] border border-[#D97706]/40 rounded-[3px] flex items-center justify-center text-[#D97706] font-mono font-bold text-[9px] select-none">
          S
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.start}</span>
      </div>

      {/* Goal (Tujuan) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[#DCFCE7] border border-[#15803D]/40 rounded-[3px] flex items-center justify-center text-[#15803D] font-mono font-bold text-[9px] select-none">
          E
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.goal}</span>
      </div>

      {/* Wall (Dinding) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[#1F2937] border border-black/10 rounded-[3px]" />
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.wall}</span>
      </div>

      {/* Mud (Lumpur) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[#F3F4F6] border border-[#9CA3AF]/30 rounded-[3px] relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full stroke-[#9CA3AF]" viewBox="0 0 16 16">
            <line x1="2" y1="14" x2="14" y2="2" strokeWidth="1.2" />
          </svg>
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.mud}</span>
      </div>

      {/* Visited (Dikunjungi) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[rgba(217,119,6,0.12)] border border-[rgba(217,119,6,0.3)] rounded-[3px]" />
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.visited}</span>
      </div>

      {/* Frontier (Perbatasan) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[rgba(107,114,128,0.18)] border border-transparent rounded-[3px]" />
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.frontier}</span>
      </div>

      {/* Optimal Path (Jalur Optimal) */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[#D97706] rounded-[3px] flex items-center justify-center relative overflow-hidden">
          <div className="w-full h-0.5 bg-[#F59E0B]" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.optimalPath}</span>
      </div>

      {/* Robot + LiDAR */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 shrink-0 bg-[rgba(31,41,55,0.72)] border border-[#D97706] rounded-full flex items-center justify-center relative">
          <div className="w-1 h-1 bg-[#FCFCFD] rounded-full" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-[-0.01em]">{t.robotLidar}</span>
      </div>

      <span className="ml-auto text-[10px] text-slate-400 font-medium tracking-[-0.01em]">{t.drawHint}</span>
    </div>
  );
}
