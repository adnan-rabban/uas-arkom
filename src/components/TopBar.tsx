import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
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

  const getStatusConfig = () => {
    switch (simulationState) {
      case 'exploring':
      case 'pathing':
      case 'moving':
        return { label: t.statusRunning, variant: 'default' as const, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' };
      case 'done':
        return pathFound
          ? { label: t.statusFound, variant: 'default' as const, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
          : { label: t.statusNoPath, variant: 'destructive' as const, className: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: t.statusReady, variant: 'secondary' as const, className: 'bg-sky-500/10 text-sky-400/60 border-sky-500/20' };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#080e1c]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
        <h1 className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-300/80">
          {t.title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className={`text-[10px] tracking-wider font-mono ${status.className}`}>
          {status.label}
        </Badge>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono tracking-wider text-sky-400/50 hover:text-sky-300 border border-white/5 hover:border-sky-500/20 transition-all cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          {lang.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
