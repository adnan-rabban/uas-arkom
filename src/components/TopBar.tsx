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
        return { label: t.statusRunning, variant: 'default' as const, className: 'bg-[#e22718]/15 text-[#e22718] border-[#e22718]/30 rounded-none animate-pulse' };
      case 'done':
        return pathFound
          ? { label: t.statusFound, variant: 'default' as const, className: 'bg-[#2ccb5d]/15 text-[#2ccb5d] border-[#2ccb5d]/30 rounded-none' }
          : { label: t.statusNoPath, variant: 'destructive' as const, className: 'bg-red-500/15 text-red-400 border-red-500/30 rounded-none' };
      default:
        return { label: t.statusReady, variant: 'secondary' as const, className: 'bg-white/5 text-white/50 border-[#3c3c3c] rounded-none' };
    }
  };

  const getLEDColor = () => {
    switch (simulationState) {
      case 'exploring':
      case 'pathing':
      case 'moving':
        return 'led-orange led-pulse';
      case 'done':
        return pathFound ? 'led-green' : 'led-red';
      default:
        return 'led-blue';
    }
  };

  const status = getStatusConfig();

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-black border-none shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className={`led-dot ${getLEDColor()}`} />
        <h1 className="text-[11px] font-bold tracking-[0.18em] uppercase text-white">
          {t.title}
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-white/20">
        <span>BAUD_RATE: 9600 BPS</span>
        <span className="w-1 h-1 bg-white/10 rounded-full" />
        <span>SYS_CYCLE: {ticks.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className={`text-[9px] tracking-widest font-mono rounded-none uppercase ${status.className}`}>
          {status.label}
        </Badge>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[9px] font-mono tracking-widest text-white/40 hover:text-white border border-[#3c3c3c] hover:border-white transition-all cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          {lang.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

