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
    { label: t.status, value: status.text, color: status.color },
    { label: t.explored, value: explored > 0 ? Math.floor(explored) : '—', color: 'text-white' },
    { label: t.pathLength, value: pathLength > 0 ? pathLength : '—', color: 'text-white' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-white' },
  ];

  return (
    <div className="space-y-1.5">
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[#1c69d4]">
        {t.telemetry}
      </span>
      <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 font-mono text-[9px] rounded-none">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">{s.label}</span>
            <span className={`${s.color} font-bold tracking-wider`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
