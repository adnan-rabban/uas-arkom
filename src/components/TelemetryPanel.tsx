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
        return { text: t.statusRunning, color: 'text-[#e22718]' };
      case 'done':
        return pathFound
          ? { text: t.statusFound, color: 'text-[#2ccb5d]' }
          : { text: t.statusNoPath, color: 'text-red-500' };
      default:
        return { text: t.statusReady, color: 'text-[#1c69d4]' };
    }
  };

  const status = getStatusDisplay();

  const stats = [
    { label: t.explored, value: explored > 0 ? Math.floor(explored) : '—', color: 'text-white font-bold' },
    { label: t.pathLength, value: pathLength > 0 ? pathLength : '—', color: 'text-white font-bold' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-white font-bold' },
    { label: t.status, value: status.text, color: status.color + ' font-bold' },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
        {t.telemetry}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((s) => (
          <Card key={s.label} className="bg-[#0d0d0d] border-[#3c3c3c] rounded-none">
            <CardContent className="p-2.5 text-center">
              <div className={`text-xs font-mono ${s.color} tracking-wider`}>
                {s.value}
              </div>
              <div className="text-[8px] tracking-widest uppercase text-white/20 mt-1">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
