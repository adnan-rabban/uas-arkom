import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Language, SimulationState } from '@/types';
import { translations } from '@/lib/constants';

interface TopBarProps {
  lang: Language;
  onToggleLang: () => void;
  simulationState: SimulationState;
  pathFound: boolean;
}

export function TopBar({ lang, onToggleLang, simulationState, pathFound }: TopBarProps) {
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
        return { label: t.statusRunning, variant: 'default' as const, className: 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/25 rounded-full animate-pulse' };
      case 'done':
        return pathFound
          ? { label: t.statusFound, variant: 'default' as const, className: 'bg-[#32D74B]/15 text-[#32D74B] border-[#32D74B]/25 rounded-full' }
          : { label: t.statusNoPath, variant: 'destructive' as const, className: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/25 rounded-full' };
      default:
        return { label: t.statusReady, variant: 'secondary' as const, className: 'bg-white/[0.06] text-white/50 border-white/[0.08] rounded-full' };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-transparent shrink-0 select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold tracking-tight text-white/90">
          {t.title}
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-white/18">
        <span>BAUD_RATE: 9600 BPS</span>
        <span className="w-1 h-1 bg-white/10 rounded-full" />
        <span>SYS_CYCLE: {ticks.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className={`text-[10px] tracking-wider font-medium rounded-full px-3 ${status.className}`}>
          {status.label}
        </Badge>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wider text-white/40 hover:text-white border border-white/8 hover:border-white/20 hover:bg-white/6 transition-all cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          {lang.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

