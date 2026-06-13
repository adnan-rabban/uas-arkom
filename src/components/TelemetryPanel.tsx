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
    { label: t.pathCost, value: pathCost > 0 ? pathCost : '—', color: 'text-[#38bdf8]' },
    { label: t.computeTime, value: computeTime > 0 ? `${computeTime}ms` : '—', color: 'text-white' },
    { label: lang === 'id' ? 'KOLOM ROBOT' : 'ROBOT COL', value: currentCol, color: 'text-[#1c69d4] font-bold' },
    { label: lang === 'id' ? 'BARIS ROBOT' : 'ROBOT ROW', value: currentRow, color: 'text-[#1c69d4] font-bold' },
    { label: lang === 'id' ? 'ARAH GERAKAN' : 'COMMAND TX', value: direction, color: 'text-[#e0a800] font-bold' },
    // Serial Protocol Statistics (only when connected)
    ...(serialConnected ? [
      { label: 'TX FRAMES', value: serialStats.framesSent, color: 'text-[#2ccb5d]' },
      { label: 'TX BYTES', value: serialStats.bytesSent, color: 'text-white/70' },
      { label: 'ACK RX', value: serialStats.ackReceived, color: 'text-[#38bdf8]' },
      { label: 'CHK ERR', value: serialStats.checksumErrors, color: serialStats.checksumErrors > 0 ? 'text-red-500 font-bold' : 'text-white/40' },
    ] : []),
  ];

  return (
    <div className="space-y-1.5 select-none">
      <span className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#1c69d4]">
        {t.telemetry}
      </span>
      <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 font-mono text-[10.5px] rounded-none">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
            <span className="text-white/30 uppercase tracking-wider text-[9px]">{s.label}</span>
            <span className={`${s.color} tracking-wider`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
