import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import type { Language, SimulationState } from '@/types';
import { translations } from '@/lib/constants';

interface TopBarProps {
  lang: Language;
  onToggleLang: () => void;
  simulationState: SimulationState;
  pathFound: boolean;
}

export const TopBar = memo(function TopBar({ lang, onToggleLang, simulationState, pathFound }: TopBarProps) {
  const t = translations[lang];
  const [ticks, setTicks] = useState(104820);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicks((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const getStatusConfig = () => {
    switch (simulationState) {
      case 'exploring':
      case 'pathing':
      case 'moving':
        return { label: t.statusRunning, variant: 'default' as const, className: 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/25 rounded-full animate-pulse' };
      case 'done':
        return pathFound
          ? { label: t.statusFound, variant: 'default' as const, className: 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/25 rounded-full' }
          : { label: t.statusNoPath, variant: 'destructive' as const, className: 'bg-[#BE123C]/15 text-[#BE123C] border-[#BE123C]/25 rounded-full' };
      default:
        return { label: t.statusReady, variant: 'secondary' as const, className: 'bg-black/[0.04] text-slate-500 border-black/[0.08] rounded-full' };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-transparent shrink-0 select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-slate-800">
          {t.title}
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-400">
        <span>BAUD_RATE: 9600 BPS</span>
        <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
        <span>SYS_CYCLE: {ticks.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className={`text-[10px] tracking-[0.04em] font-semibold rounded-full px-3.5 py-0.5 ${status.className}`}>
          {status.label}
        </Badge>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.03em] text-slate-500 hover:text-slate-800 border border-black/8 hover:border-black/15 bg-black/2 hover:bg-black/4 transition-all cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          {lang.toUpperCase()}
        </button>
      </div>
    </div>
  );
});

