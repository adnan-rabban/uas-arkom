import type { SimulationState, Language } from '@/types';
import type { SerialStats } from '@/hooks/useSimulation';
import { translations } from '@/lib/constants';

interface TelemetryPanelProps {
  explored: number;
  pathLength: number;
  pathCost: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  lang: Language;
  currentCol: number | string;
  currentRow: number | string;
  direction: string;
  serialConnected: boolean;
  serialStats: SerialStats;
}

export function TelemetryPanel({
  explored,
  pathLength,
  pathCost,
  computeTime,
  simulationState,
  pathFound,
  lang,
  currentCol,
  currentRow,
  direction,
  serialConnected,
  serialStats,
}: TelemetryPanelProps) {
  const t = translations[lang];

  const getStatusDisplay = () => {
    switch (simulationState) {
      case 'exploring': case 'pathing': case 'moving':
        return { text: t.statusRunning, color: 'text-[#D97706]' };
      case 'done':
        return pathFound
          ? { text: t.statusFound, color: 'text-[#D97706]' }
          : { text: t.statusNoPath, color: 'text-[#BE123C]' };
      default:
        return { text: t.statusReady, color: 'text-[#D97706]' };
    }
  };

  const status = getStatusDisplay();

  const stats = [
    { label: t.status, value: status.text, color: status.color },
    { label: t.explored, value: explored > 0 ? Math.floor(explored) : '—', color: 'text-slate-800' },
    { label: t.pathLength, value: pathLength > 0 ? pathLength : '—', color: 'text-slate-800' },
    { label: t.pathCost, value: pathCost > 0 ? pathCost : '—', color: 'text-[#D97706]' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-slate-600' },
    { label: lang === 'id' ? 'KOLOM ROBOT' : 'ROBOT COL', value: currentCol, color: 'text-[#D97706] font-semibold' },
    { label: lang === 'id' ? 'BARIS ROBOT' : 'ROBOT ROW', value: currentRow, color: 'text-[#D97706] font-semibold' },
    { label: lang === 'id' ? 'ARAH GERAKAN' : 'COMMAND TX', value: direction, color: 'text-[#D97706] font-semibold' },
    // Serial Protocol Statistics (only when connected)
    ...(serialConnected ? [
      { label: 'TX FRAMES', value: serialStats.framesSent, color: 'text-[#D97706]' },
      { label: 'TX BYTES', value: serialStats.bytesSent, color: 'text-slate-500' },
      { label: 'ACK RX', value: serialStats.ackReceived, color: 'text-[#D97706]' },
      { label: 'CHK ERR', value: serialStats.checksumErrors, color: serialStats.checksumErrors > 0 ? 'text-[#BE123C] font-bold' : 'text-slate-400' },
    ] : []),
  ];

  return (
    <div className="space-y-2.5 select-none">
      <span className="ios-label">
        {t.telemetry}
      </span>
      <div className="space-y-0 glass-card overflow-hidden">
        {stats.map((s, idx) => (
          <div key={s.label} className={`flex justify-between items-center px-3.5 py-2 border-b border-black/5 last:border-0 ${idx % 2 === 0 ? 'bg-black/2' : ''}`}>
            <span className="text-slate-500 text-[10px] font-medium tracking-[-0.01em]">{s.label}</span>
            <span className={`flex items-center gap-1.5 ${s.color} text-[11px] tracking-[-0.01em] font-semibold`}>
              {s.label === t.status && (
                <span className={`w-1.5 h-1.5 rounded-full ${
                  simulationState === 'done' && pathFound ? 'bg-[#D97706]' :
                  simulationState === 'done' && !pathFound ? 'bg-[#BE123C]' :
                  (simulationState === 'exploring' || simulationState === 'pathing' || simulationState === 'moving') ? 'bg-[#D97706] animate-pulse' :
                  'bg-[#D97706]'
                }`} />
              )}
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
