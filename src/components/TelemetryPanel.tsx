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
        return { text: t.statusRunning, color: 'text-[#FF9F0A]' };
      case 'done':
        return pathFound
          ? { text: t.statusFound, color: 'text-[#32D74B]' }
          : { text: t.statusNoPath, color: 'text-[#FF453A]' };
      default:
        return { text: t.statusReady, color: 'text-[#0A84FF]' };
    }
  };

  const status = getStatusDisplay();

  const stats = [
    { label: t.status, value: status.text, color: status.color },
    { label: t.explored, value: explored > 0 ? Math.floor(explored) : '—', color: 'text-white' },
    { label: t.pathLength, value: pathLength > 0 ? pathLength : '—', color: 'text-white' },
    { label: t.pathCost, value: pathCost > 0 ? pathCost : '—', color: 'text-[#64D2FF]' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-white/80' },
    { label: lang === 'id' ? 'KOLOM ROBOT' : 'ROBOT COL', value: currentCol, color: 'text-[#0A84FF] font-semibold' },
    { label: lang === 'id' ? 'BARIS ROBOT' : 'ROBOT ROW', value: currentRow, color: 'text-[#0A84FF] font-semibold' },
    { label: lang === 'id' ? 'ARAH GERAKAN' : 'COMMAND TX', value: direction, color: 'text-[#FF9F0A] font-semibold' },
    // Serial Protocol Statistics (only when connected)
    ...(serialConnected ? [
      { label: 'TX FRAMES', value: serialStats.framesSent, color: 'text-[#32D74B]' },
      { label: 'TX BYTES', value: serialStats.bytesSent, color: 'text-white/60' },
      { label: 'ACK RX', value: serialStats.ackReceived, color: 'text-[#64D2FF]' },
      { label: 'CHK ERR', value: serialStats.checksumErrors, color: serialStats.checksumErrors > 0 ? 'text-[#FF453A] font-bold' : 'text-white/30' },
    ] : []),
  ];

  return (
    <div className="space-y-2.5 select-none">
      <span className="ios-label">
        {t.telemetry}
      </span>
      <div className="space-y-1 glass-card p-3 font-mono text-[11px]">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-center border-b border-white/4 pb-1.5 last:border-0 last:pb-0">
            <span className="text-white/30 text-[10px] font-medium tracking-wide">{s.label}</span>
            <span className={`${s.color} tracking-wide`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
