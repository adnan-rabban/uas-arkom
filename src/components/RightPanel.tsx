import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Play, SkipForward, RotateCcw, Trash2, Keyboard, Cpu, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { TelemetryPanel } from './TelemetryPanel';
import { SerialModal } from './SerialModal';
import type { SimulationState, Language, Position } from '@/types';
import type { SerialStats } from '@/hooks/useSimulation';
import { translations } from '@/lib/constants';

interface RightPanelProps {
  lang: Language;
  speed: number;
  explored: number;
  pathLength: number;
  pathCost: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  path: Position[];
  robotT: number;
  serialConnected: boolean;
  isVirtualSerial: boolean;
  serialStats: SerialStats;
  onConnectSerial: (isVirtual?: boolean) => void;
  onDisconnectSerial: () => void;
  onSetSpeed: (s: number) => void;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
}

export const RightPanel = memo(function RightPanel(props: RightPanelProps) {
  const t = translations[props.lang];
  const [copiedType, setCopiedType] = useState<'c' | 'asm' | 'live' | 'mem' | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [selectedModalTab, setSelectedModalTab] = useState<'c' | 'asm' | 'live'>('c');
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const isRunning = props.simulationState !== 'idle' && props.simulationState !== 'done';


  const getArduinoCode = useCallback(() => {
    if (props.path.length === 0) return '';
    const coords = props.path.map((p) => `{${p.row}, ${p.col}}`).join(', ');
    return `// Arduino Navigation Route (Optimized with PROGMEM to save SRAM)\n#include <avr/pgmspace.h>\nconst int PATH_LEN = ${props.path.length};\nconst byte path[${props.path.length}][2] PROGMEM = {\n  ${coords}\n};`;
  }, [props.path]);

  const getAssemblyCode = useCallback(() => {
    if (props.path.length === 0) return '';
    const bytes = props.path
      .map((p) => {
        const rStr = p.row.toString(16).toUpperCase().padStart(2, '0') + 'h';
        const cStr = p.col.toString(16).toUpperCase().padStart(2, '0') + 'h';
        return `${rStr}, ${cStr}`;
      })
      .join(', ');

    const lenStr = props.path.length.toString(16).toUpperCase().padStart(4, '0') + 'h';
    return `; Assembly ROM Navigation Route\nPATH_LEN  DW ${lenStr}\nPATH_DATA DB ${bytes}`;
  }, [props.path]);

  const getArduinoLiveCode = useCallback(() => {
    return `// Arduino Live Receiver Sketch (Framed Protocol)
// Protocol: [STX=0x02][CMD][CHECKSUM][ETX=0x03]
// Commands: U(Up), D(Down), L(Left), R(Right),
//           1-4 (Diagonal), E(End)
// Checksum: CMD XOR 0xFF
// ACK: sends [0x02][0x06][0xF9][0x03] on success

const byte STX = 0x02;
const byte ETX = 0x03;
const byte ACK = 0x06;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("[SYSTEM] Arduino Ready. Framed protocol.");
}

void sendAck() {
  byte frame[4] = { STX, ACK, (byte)(ACK ^ 0xFF), ETX };
  Serial.write(frame, 4);
}

void loop() {
  if (Serial.available() >= 4) {
    byte s = Serial.read();
    if (s != STX) return;
    byte cmd = Serial.read();
    byte chk = Serial.read();
    byte e = Serial.read();
    if (e != ETX) return;
    if (chk != (cmd ^ 0xFF)) return; // checksum fail

    if (cmd=='U'||cmd=='D'||cmd=='L'||cmd=='R'||
        cmd=='1'||cmd=='2'||cmd=='3'||cmd=='4') {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(50);
      digitalWrite(LED_BUILTIN, LOW);
      sendAck();
    } else if (cmd == 'E') {
      for (int i=0; i<5; i++) {
        digitalWrite(LED_BUILTIN, HIGH); delay(100);
        digitalWrite(LED_BUILTIN, LOW); delay(100);
      }
      sendAck();
    }
  }
}`;
  }, []);

  const handleCopy = useCallback((code: string, type: 'c' | 'asm' | 'live' | 'mem') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 1500);
      }).catch((err) => {
        console.error('Failed to copy: ', err);
      });
    } else {
      // Fallback copy method for unsupported clipboard API in Firefox/Safari or HTTP
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'absolute';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 1500);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const currentRobotPos = (() => {
    if (props.path.length === 0 || (props.simulationState !== 'moving' && props.simulationState !== 'done')) {
      return null;
    }
    const idx = Math.min(Math.floor(props.robotT), props.path.length - 1);
    return props.path[idx];
  })();

  const currentDirection = (() => {
    if (!currentRobotPos || props.path.length === 0 || props.simulationState !== 'moving') {
      return '—';
    }
    const idx = Math.min(Math.floor(props.robotT), props.path.length - 1);
    if (idx === 0) return 'START';
    if (idx >= props.path.length - 1) return 'END';
    
    const curr = props.path[idx - 1];
    const next = props.path[idx];
    const dy = next.row - curr.row;
    const dx = next.col - curr.col;

    if (dy < 0 && dx === 0) return 'UP (U)';
    if (dy > 0 && dx === 0) return 'DOWN (D)';
    if (dy === 0 && dx < 0) return 'LEFT (L)';
    if (dy === 0 && dx > 0) return 'RIGHT (R)';
    if (dy < 0 && dx < 0) return 'UP-LEFT (1)';
    if (dy < 0 && dx > 0) return 'UP-RIGHT (2)';
    if (dy > 0 && dx < 0) return 'DOWN-LEFT (3)';
    if (dy > 0 && dx > 0) return 'DOWN-RIGHT (4)';
    return '—';
  })();

  // Logging Effect: Serial Status changes
  useEffect(() => {
    const addLog = (msg: string) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev].slice(0, 15));
    };

    if (props.serialConnected) {
      addLog(props.isVirtualSerial ? "SERIAL: Connected to Virtual COM Port." : "SERIAL: Connected to COM Port.");
    } else {
      addLog("SERIAL: Disconnected.");
    }
  }, [props.serialConnected, props.isVirtualSerial]);

  // Logging Effect: Simulation State changes
  useEffect(() => {
    const addLog = (msg: string) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev].slice(0, 15));
    };

    if (props.simulationState === 'idle') {
      addLog("SIM: System ready. Idle.");
    } else if (props.simulationState === 'exploring') {
      addLog("SIM: Exploring grid frontier...");
    } else if (props.simulationState === 'pathing') {
      addLog("SIM: Optimal path found. Generating output code.");
    } else if (props.simulationState === 'moving') {
      addLog("MOTOR: Navigating robot. Streaming serial.");
    } else if (props.simulationState === 'done') {
      if (props.pathFound) {
        addLog("SIM: Done. Target reached. Sent 'E'.");
      } else {
        addLog("SIM: Done. No path exists.");
      }
    }
  }, [props.simulationState, props.pathFound]);

  // Logging Effect: Coordinates transmission
  useEffect(() => {
    if (props.simulationState !== 'moving' || currentDirection === '—') return;
    const addLog = (msg: string) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev].slice(0, 15));
    };

    let char = '';
    if (currentDirection.includes('UP (U)')) char = 'U';
    else if (currentDirection.includes('DOWN (D)')) char = 'D';
    else if (currentDirection.includes('LEFT (L)')) char = 'L';
    else if (currentDirection.includes('RIGHT (R)')) char = 'R';
    else if (currentDirection.includes('UP-LEFT (1)')) char = '1';
    else if (currentDirection.includes('UP-RIGHT (2)')) char = '2';
    else if (currentDirection.includes('DOWN-LEFT (3)')) char = '3';
    else if (currentDirection.includes('DOWN-RIGHT (4)')) char = '4';

    if (char) {
      const prefix = props.isVirtualSerial ? "TX (VIRTUAL)" : "TX";
      addLog(`${prefix}: '${char}' -> [Col: ${currentRobotPos?.col}, Row: ${currentRobotPos?.row}]`);
    }
  }, [currentDirection, props.simulationState, currentRobotPos?.col, currentRobotPos?.row, props.isVirtualSerial]);

  // Logging Effect: Path replanned during movement
  const lastPathRef = useRef<Position[]>(props.path);
  const prevStateRef = useRef<SimulationState>(props.simulationState);

  useEffect(() => {
    const stateChanged = prevStateRef.current !== props.simulationState;
    prevStateRef.current = props.simulationState;

    if (props.simulationState !== 'moving' || props.path.length === 0) {
      lastPathRef.current = props.path;
      return;
    }

    // If we were already in 'moving' state and the path changed, it's a replan!
    if (!stateChanged && lastPathRef.current !== props.path) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs((prev) => [`[${timeStr}] SIM: Route updated. Recalculating path (Length: ${props.path.length}).`, ...prev].slice(0, 15));
    }

    lastPathRef.current = props.path;
  }, [props.path, props.simulationState]);

  return (
    <div className="h-full flex flex-col justify-between min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 scrollbar-none pr-0.5">
        {/* Speed Control */}
        <div className="glass-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="ios-label">
              {t.speed}
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-black/4 px-2.5 py-0.5 rounded-full font-semibold">{props.speed}x</span>
          </div>
          <Slider
            value={[props.speed]}
            onValueChange={(val) => {
              const v = Array.isArray(val) ? val[0] : val;
              props.onSetSpeed(v as number);
            }}
            min={1}
            max={30}
            step={1}
            className="py-1"
          />
        </div>

        <Separator className="bg-black/8" />

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <span className="ios-label">
            {t.actions}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={props.onRun}
              disabled={isRunning}
              size="sm"
              variant="ghost"
              className="ios-btn ios-btn-success rounded-2xl h-10 text-[12px] cursor-pointer disabled:opacity-25"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {t.run}
            </Button>

            <Button
              onClick={props.onStep}
              size="sm"
              variant="ghost"
              className="ios-btn ios-btn-secondary rounded-2xl h-10 text-[12px] cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 mr-1.5" />
              {t.step}
            </Button>

            <Button
              onClick={props.onReset}
              size="sm"
              variant="ghost"
              className="ios-btn ios-btn-secondary rounded-2xl h-10 text-[12px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {t.reset}
            </Button>

            <Button
              onClick={props.onClear}
              size="sm"
              variant="ghost"
              className="ios-btn ios-btn-danger rounded-2xl h-10 text-[12px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {t.clear}
            </Button>
          </div>
        </div>

        <Separator className="bg-black/8" />

        {/* Telemetry */}
        <TelemetryPanel
          explored={props.explored}
          pathLength={props.pathLength}
          pathCost={props.pathCost}
          computeTime={props.computeTime}
          simulationState={props.simulationState}
          pathFound={props.pathFound}
          lang={props.lang}
          currentCol={currentRobotPos ? currentRobotPos.col : '—'}
          currentRow={currentRobotPos ? currentRobotPos.row : '—'}
          direction={currentDirection}
          serialConnected={props.serialConnected}
          serialStats={props.serialStats}
        />

        <Separator className="bg-black/8" />

        {/* Serial & Code Exporters Block */}
        <div className="space-y-2.5">
          <span className="ios-label">
            {t.serialTitle}
          </span>
          <div className="glass-card p-3.5 space-y-3">
            {/* Web Serial status & connect button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Serial Status</span>
                <span className={`text-[12px] font-semibold ${props.serialConnected ? "text-[#D97706]" : "text-slate-300"}`}>
                  {props.serialConnected 
                    ? (props.isVirtualSerial 
                        ? (props.lang === 'id' ? 'Terhubung (Virtual)' : 'Connected (Virtual)') 
                        : t.serialConnected)
                    : t.serialDisconnected}
                </span>
              </div>
              <Button
                onClick={() => setSerialModalOpen(true)}
                size="sm"
                variant="ghost"
                className={`ios-btn h-7 px-3.5 text-[11px] cursor-pointer rounded-full ${
                  props.serialConnected
                    ? 'ios-btn-danger'
                    : 'ios-btn-secondary'
                }`}
              >
                {props.serialConnected ? t.serialDisconnect : t.serialConnect}
              </Button>
            </div>

            {/* Code exporters buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-black/8">
              <Button
                onClick={() => {
                  setSelectedModalTab('live');
                  setCodeModalOpen(true);
                }}
                size="sm"
                variant="ghost"
                className="ios-btn ios-btn-secondary rounded-lg h-7 text-[10px] cursor-pointer"
                title={t.arduinoCodeTitle}
              >
                live.ino
              </Button>
              <Button
                disabled={!props.pathFound || props.path.length === 0}
                onClick={() => {
                  setSelectedModalTab('c');
                  setCodeModalOpen(true);
                }}
                size="sm"
                variant="ghost"
                className="ios-btn ios-btn-secondary rounded-lg h-7 text-[10px] cursor-pointer disabled:opacity-25"
                title="arduino_route.c"
              >
                route.c
              </Button>
              <Button
                disabled={!props.pathFound || props.path.length === 0}
                onClick={() => {
                  setSelectedModalTab('asm');
                  setCodeModalOpen(true);
                }}
                size="sm"
                variant="ghost"
                className="ios-btn ios-btn-secondary rounded-lg h-7 text-[10px] cursor-pointer disabled:opacity-25"
                title="route.asm"
              >
                route.asm
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-black/8" />

        {/* Memory Map Collapsible (Open by default) */}
        <Collapsible open={memoryOpen} onOpenChange={setMemoryOpen}>
          <CollapsibleTrigger className="ios-label flex items-center gap-2 hover:text-slate-600 transition-colors cursor-pointer w-full text-left justify-between select-none">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D97706]" />
              {t.memoryMapTitle}
              {props.path.length > 127 && (
                <span className="text-[#BE123C] font-semibold text-[10px] animate-pulse ml-1 normal-case bg-[#BE123C]/10 px-2 py-0.5 rounded-full">
                  {props.lang === 'id' ? 'TERPOTONG (BATAS ALAMAT 8-BIT)' : 'TRUNCATED (8-BIT ADDR SPACE LIMIT)'}
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${memoryOpen ? 'rotate-0' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {memoryOpen && (
              <>
                <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                  {t.memoryMapDesc}
                </p>

                <div className="glass-card p-2 font-mono text-[8.5px] leading-tight select-none pcb-grid relative overflow-hidden">
                  {/* Mini PCB corner details */}
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#D97706]/30 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#D97706]/30 pointer-events-none" />
                  {/* Header */}
                  <div className="flex text-slate-400 border-b border-black/8 pb-1 mb-1 font-bold">
                    <span className="w-3.75 shrink-0">ADR</span>
                    <span className="flex-1 gap-px text-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                      {['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'].map(h => (
                        <span key={h}>{h}</span>
                      ))}
                    </span>
                  </div>
                  
                  {/* Rows */}
                  <div className="space-y-0.5 pr-0.5">
                    {(() => {
                      const mem = Array(256).fill(0);
                      if (props.path && props.path.length > 0) {
                        // 16-bit little-endian length encoding at addresses 0x00-0x01
                        // Coordinates cap at 127 since 2 + 127 * 2 = 256 bytes
                        const pathLen = Math.min(props.path.length, 127);
                        mem[0] = pathLen & 0xFF;         // low byte
                        mem[1] = (pathLen >> 8) & 0xFF;  // high byte
                        // Coordinate data starts at address 0x02
                        for (let i = 0; i < props.path.length; i++) {
                          if (2 + i * 2 + 1 < 256) {
                            mem[2 + i * 2] = props.path[i].row;
                            mem[2 + i * 2 + 1] = props.path[i].col;
                          }
                        }
                      }

                      const currentRobotIndex = Math.floor(props.robotT);
                      const activeAddr1 = (props.simulationState === 'moving' || props.simulationState === 'done') && props.path.length > 0 ? 2 + currentRobotIndex * 2 : -1;
                      const activeAddr2 = (props.simulationState === 'moving' || props.simulationState === 'done') && props.path.length > 0 ? 2 + currentRobotIndex * 2 + 1 : -1;

                      const rows = [];
                      for (let r = 0; r < 16; r++) {
                        const addrPrefix = (r * 16).toString(16).toUpperCase().padStart(2, '0');
                        const cols = [];
                        for (let c = 0; c < 16; c++) {
                          const addr = r * 16 + c;
                          const val = mem[addr];
                          const hexVal = val.toString(16).toUpperCase().padStart(2, '0');
                          const isActive = addr === activeAddr1 || addr === activeAddr2;
                          const isLength = (addr === 0 || addr === 1) && props.path.length > 0;
                          
                          let textColor = 'text-slate-400';
                          let bgColor = 'bg-transparent';
                          
                          if (isActive) {
                            textColor = 'text-white font-bold';
                            bgColor = 'bg-[#D97706]';
                          } else if (isLength) {
                            textColor = 'text-[#BE123C] font-bold';
                          } else if (val > 0) {
                            textColor = 'text-slate-600';
                          }

                          cols.push(
                            <span
                              key={c}
                              className={`text-center rounded-[1px] transition-colors ${textColor} ${bgColor}`}
                              title={`Addr: 0x${addr.toString(16).toUpperCase().padStart(2, '0')} | Dec: ${val}`}
                            >
                              {hexVal}
                            </span>
                          );
                        }
                        rows.push(
                          <div key={r} className="flex items-center">
                            <span className="w-3.75 text-slate-400 shrink-0 font-bold">{addrPrefix}</span>
                            <div className="flex-1 gap-px" style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                              {cols}
                            </div>
                          </div>
                        );
                      }
                      return rows;
                    })()}
                  </div>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Live Console Logs */}
        <Separator className="bg-black/8" />
        
        <Collapsible open={consoleOpen} onOpenChange={setConsoleOpen}>
          <CollapsibleTrigger className="ios-label flex items-center gap-2 hover:text-slate-600 transition-colors cursor-pointer w-full text-left justify-between select-none">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${consoleOpen ? 'bg-[#D97706]' : 'bg-black/12'}`} />
              {props.lang === 'id' ? 'Konsol Serial' : 'Serial Console'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${consoleOpen ? 'rotate-0' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            {consoleOpen && (
              <div className="glass-card p-3 font-mono text-[10px] text-[#D97706] h-27.5 overflow-y-auto scrollbar-thin space-y-1 leading-relaxed select-none bg-black/2">
                {logs.length === 0 ? (
                  <div className="text-slate-300 italic text-[11px]">No activity logs yet.</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap font-mono">
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-black/8" />

        {/* Keyboard Shortcuts */}
        <Button
          onClick={() => setShortcutsModalOpen(true)}
          variant="ghost"
          size="sm"
          className="w-full ios-btn ios-btn-secondary rounded-2xl h-10 text-[12px] text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <Keyboard className="w-4 h-4 mr-2" />
          {t.shortcuts}
        </Button>
      </div>

      {/* Code Export Modal */}
      <Modal 
        isOpen={codeModalOpen} 
        onClose={() => setCodeModalOpen(false)} 
        title="Code Export"
      >
        <div className="space-y-4">
          <div className="ios-segmented flex mb-2">
            {([
              { id: 'c', label: 'arduino_route.c' },
              { id: 'asm', label: 'route.asm' },
              { id: 'live', label: 'live_receiver.ino' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedModalTab(tab.id)}
                data-active={selectedModalTab === tab.id}
                className="ios-segmented-item flex-1 py-1.5 text-center cursor-pointer"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-card p-4 relative">
            <div className="flex justify-between items-center text-[11px] border-b border-black/8 pb-2 mb-3 font-mono text-slate-500">
              <span className="font-medium">
                {selectedModalTab === 'c' && 'arduino_route.c'}
                {selectedModalTab === 'asm' && 'route.asm'}
                {selectedModalTab === 'live' && 'live_receiver.ino'}
              </span>
              <button
                onClick={() => {
                  const code = selectedModalTab === 'c' ? getArduinoCode() : selectedModalTab === 'asm' ? getAssemblyCode() : getArduinoLiveCode();
                  handleCopy(code, selectedModalTab);
                }}
                className="hover:text-[#B88020] transition-colors cursor-pointer text-[11px] text-[#D97706] font-semibold"
              >
                {copiedType === selectedModalTab ? t.copied : t.copyCode}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-600 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-87.5 scrollbar-thin">
              {selectedModalTab === 'c' && getArduinoCode()}
              {selectedModalTab === 'asm' && getAssemblyCode()}
              {selectedModalTab === 'live' && getArduinoLiveCode()}
            </pre>
          </div>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <Modal 
        isOpen={shortcutsModalOpen} 
        onClose={() => setShortcutsModalOpen(false)} 
        title={t.shortcuts || 'Keyboard Shortcuts'}
      >
        <div className="space-y-2 py-1">
          {[
            ['Space', t.run],
            ['S', t.step],
            ['R', t.reset],
            ['C', t.clear],
            ['1', t.wall],
            ['2', t.start],
            ['3', t.goal],
            ['5', t.mud.split(' ')[0]],
            ['4', t.erase],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
              <kbd className="text-[11px] font-mono bg-black/4 border border-black/8 rounded-lg px-2.5 py-1 text-slate-600 font-medium min-w-9 text-center">
                {key}
              </kbd>
              <span className="text-[12px] text-slate-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Serial Connection Modal */}
      <SerialModal
        isOpen={serialModalOpen}
        onClose={() => setSerialModalOpen(false)}
        serialConnected={props.serialConnected}
        isVirtualSerial={props.isVirtualSerial}
        onConnectSerial={props.onConnectSerial}
        onDisconnectSerial={props.onDisconnectSerial}
        lang={props.lang}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lang === nextProps.lang &&
    prevProps.speed === nextProps.speed &&
    prevProps.simulationState === nextProps.simulationState &&
    prevProps.pathFound === nextProps.pathFound &&
    prevProps.serialConnected === nextProps.serialConnected &&
    prevProps.isVirtualSerial === nextProps.isVirtualSerial &&
    prevProps.path === nextProps.path &&
    prevProps.pathCost === nextProps.pathCost &&
    prevProps.computeTime === nextProps.computeTime &&
    prevProps.serialStats.framesSent === nextProps.serialStats.framesSent &&
    prevProps.serialStats.bytesSent === nextProps.serialStats.bytesSent &&
    prevProps.serialStats.ackReceived === nextProps.serialStats.ackReceived &&
    prevProps.serialStats.checksumErrors === nextProps.serialStats.checksumErrors &&
    Math.floor(prevProps.explored) === Math.floor(nextProps.explored) &&
    Math.floor(prevProps.robotT) === Math.floor(nextProps.robotT) &&
    prevProps.onRun === nextProps.onRun &&
    prevProps.onStep === nextProps.onStep &&
    prevProps.onReset === nextProps.onReset &&
    prevProps.onClear === nextProps.onClear &&
    prevProps.onConnectSerial === nextProps.onConnectSerial &&
    prevProps.onDisconnectSerial === nextProps.onDisconnectSerial &&
    prevProps.onSetSpeed === nextProps.onSetSpeed
  );
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-lg p-4 animate-in fade-in duration-200">
      <div 
        className="glass-modal w-full max-w-125 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
          <span className="text-[15px] font-semibold text-slate-800 tracking-[-0.01em]">
            {title}
          </span>
          <button 
            onClick={onClose}
            className="text-[#D97706] hover:text-[#B88020] transition-colors cursor-pointer font-semibold text-[14px]"
          >
            Done
          </button>
        </div>
        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
