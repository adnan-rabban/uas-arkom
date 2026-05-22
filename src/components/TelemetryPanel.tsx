import { Card, CardContent } from '@/components/ui/card';
import type { SimulationState, Language } from '@/types';
import { translations } from '@/lib/constants';

interface TelemetryPanelProps {
  explored: number;
  pathLength: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  lang: Language;
}

export function TelemetryPanel({ explored, pathLength, computeTime, simulationState, pathFound, lang }: TelemetryPanelProps) {
  const t = translations[lang];

  const getStatusDisplay = () => {
    switch (simulationState) {
      case 'exploring': case 'pathing': case 'moving':
        return { text: t.statusRunning, color: 'text-amber-400' };
      case 'done':
        return pathFound
          ? { text: t.statusFound, color: 'text-emerald-400' }
          : { text: t.statusNoPath, color: 'text-red-400' };
      default:
        return { text: t.statusReady, color: 'text-sky-400/50' };
    }
  };

  const status = getStatusDisplay();

  const stats = [
    { label: t.explored, value: explored > 0 ? Math.floor(explored) : '—', color: 'text-sky-300' },
    { label: t.pathLength, value: pathLength > 0 ? pathLength : '—', color: 'text-sky-400' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-violet-300' },
    { label: t.status, value: status.text, color: status.color },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
        {t.telemetry}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((s) => (
          <Card key={s.label} className="bg-white/2 border-white/5">
            <CardContent className="p-2.5 text-center">
              <div className={`text-sm font-mono font-semibold ${s.color} tracking-wide`}>
                {s.value}
              </div>
              <div className="text-[8px] tracking-widest uppercase text-white/20 mt-0.5">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
