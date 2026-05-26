import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Play, SkipForward, RotateCcw, Trash2, Keyboard, Code, Radio, Cpu } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useCallback } from 'react';
import { TelemetryPanel } from './TelemetryPanel';
import type { SimulationState, Language, Position } from '@/types';
import { translations } from '@/lib/constants';

interface RightPanelProps {
  lang: Language;
  speed: number;
  explored: number;
  pathLength: number;
  computeTime: number;
  simulationState: SimulationState;
  pathFound: boolean;
  path: Position[];
  robotT: number;
  serialConnected: boolean;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onSetSpeed: (s: number) => void;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
}

export function RightPanel(props: RightPanelProps) {
  const t = translations[props.lang];
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(true);
  const [serialOpen, setSerialOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(true);
  const [copiedType, setCopiedType] = useState<'c' | 'asm' | 'live' | 'mem' | null>(null);
  const isRunning = props.simulationState !== 'idle' && props.simulationState !== 'done';


  const getArduinoCode = useCallback(() => {
    if (props.path.length === 0) return '';
    const coords = props.path.map((p) => `{${p.row}, ${p.col}}`).join(', ');
    return `// Arduino Navigation Route\nconst int PATH_LEN = ${props.path.length};\nconst int path[${props.path.length}][2] = {\n  ${coords}\n};`;
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

    const lenStr = props.path.length.toString(16).toUpperCase().padStart(2, '0') + 'h';
    return `; Assembly ROM Navigation Route\nPATH_LEN  DB ${lenStr}\nPATH_DATA DB ${bytes}`;
  }, [props.path]);

  const getArduinoLiveCode = useCallback(() => {
    return `// Arduino Live Receiver Sketch
// Receives: U(Up), D(Down), L(Left), R(Right), E(End)
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}
void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'U' || cmd == 'D' || cmd == 'L' || cmd == 'R') {
      digitalWrite(LED_BUILTIN, HIGH);
    } else if (cmd == 'E') {
      for (int i=0; i<5; i++) {
        digitalWrite(LED_BUILTIN, HIGH); delay(100);
        digitalWrite(LED_BUILTIN, LOW); delay(100);
      }
    }
  }
}`;
  }, []);

  const handleCopy = useCallback((code: string, type: 'c' | 'asm' | 'live' | 'mem') => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1500);
    });
  }, []);


  return (
    <div className="space-y-4">
      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
            {t.speed}
          </span>
          <span className="text-[10px] font-mono text-white/25">{props.speed}x</span>
        </div>
        <Slider
          value={[props.speed]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val;
            props.onSetSpeed(v as number);
          }}
          min={1}
          max={20}
          step={1}
          className="py-1"
        />
      </div>

      <Separator className="bg-white/5" />

      {/* Action Buttons */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
          {t.actions}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            onClick={props.onRun}
            disabled={isRunning}
            size="sm"
            className="bg-white text-black font-bold uppercase rounded-none border border-white hover:bg-transparent hover:text-white transition-all text-[9px] tracking-widest h-8 cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3 h-3 mr-1" />
            {t.run}
          </Button>

          <Button
            onClick={props.onStep}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
          >
            <SkipForward className="w-3 h-3 mr-1" />
            {t.step}
          </Button>

          <Button
            onClick={props.onReset}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {t.reset}
          </Button>

          <Button
            onClick={props.onClear}
            size="sm"
            variant="ghost"
            className="text-white/40 border border-[#3c3c3c] hover:border-white hover:text-white hover:bg-transparent rounded-none text-[9px] tracking-widest font-bold h-8 cursor-pointer"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {t.clear}
          </Button>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Telemetry */}
      <TelemetryPanel
        explored={props.explored}
        pathLength={props.pathLength}
        computeTime={props.computeTime}
        simulationState={props.simulationState}
        pathFound={props.pathFound}
        lang={props.lang}
      />

      {/* Route Code Exporter */}
      {props.pathFound && props.path && props.path.length > 0 && (
        <>
          <Separator className="bg-white/5" />

      {/* Web Serial Connection */}
      <Collapsible open={serialOpen} onOpenChange={setSerialOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-[#1c69d4] hover:text-[#1c69d4]/80 transition-colors cursor-pointer select-none">
          <Radio className="w-3.5 h-3.5" />
          {t.serialTitle}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-[8px] font-mono">
            <span className="text-white/30">Status:</span>
            <span className={props.serialConnected ? "text-[#2ccb5d] font-bold" : "text-white/20"}>
              {props.serialConnected ? t.serialConnected : t.serialDisconnected}
            </span>
          </div>

          <Button
            onClick={props.serialConnected ? props.onDisconnectSerial : props.onConnectSerial}
            size="sm"
            variant="ghost"
            className={`w-full text-[8px] font-mono tracking-widest uppercase border rounded-none h-7 cursor-pointer ${
              props.serialConnected
                ? 'bg-red-950/30 text-red-500 border-red-900/50 hover:bg-red-900/40 hover:text-red-400'
                : 'border-[#3c3c3c] text-white/60 hover:border-white hover:text-white'
            }`}
          >
            {props.serialConnected ? t.serialDisconnect : t.serialConnect}
          </Button>

          <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 rounded-none">
            <div className="flex justify-between items-center text-[7px] border-b border-white/5 pb-1 mb-1 font-mono text-white/40">
              <span>{t.arduinoCodeTitle}</span>
              <button
                onClick={() => handleCopy(getArduinoLiveCode(), 'live')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {copiedType === 'live' ? t.copied : t.copyCode}
              </button>
            </div>
            <pre className="text-[6.5px] font-mono text-white/50 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[85px] scrollbar-thin">
              {getArduinoLiveCode()}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-white/5" />

          <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-[#1c69d4] hover:text-[#1c69d4]/80 transition-colors cursor-pointer select-none">
              <Code className="w-3.5 h-3.5" />
              {t.exportPath}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <p className="text-[8px] text-white/30 font-light leading-normal">
                {t.exportPathDesc}
              </p>

              <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 rounded-none">
                <div className="flex justify-between items-center text-[8px] border-b border-white/5 pb-1 mb-1 font-mono text-white/40">
                  <span>arduino_route.c</span>
                  <button
                    onClick={() => handleCopy(getArduinoCode(), 'c')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedType === 'c' ? t.copied : t.copyCode}
                  </button>
                </div>
                <pre className="text-[7px] font-mono text-white/60 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[80px] scrollbar-thin">
                  {getArduinoCode()}
                </pre>
              </div>

              <div className="space-y-1 bg-black border border-[#3c3c3c] p-2 rounded-none">
                <div className="flex justify-between items-center text-[8px] border-b border-white/5 pb-1 mb-1 font-mono text-white/40">
                  <span>route.asm</span>
                  <button
                    onClick={() => handleCopy(getAssemblyCode(), 'asm')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedType === 'asm' ? t.copied : t.copyCode}
                  </button>
                </div>
                <pre className="text-[7px] font-mono text-white/60 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[80px] scrollbar-thin">
                  {getAssemblyCode()}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <Separator className="bg-white/5" />

      {/* Memory Map / Hex Dump */}
      <Collapsible open={memoryOpen} onOpenChange={setMemoryOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-[#1c69d4] hover:text-[#1c69d4]/80 transition-colors cursor-pointer select-none">
          <Cpu className="w-3.5 h-3.5" />
          {t.memoryMapTitle}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <p className="text-[8px] text-white/30 font-light leading-normal">
            {t.memoryMapDesc}
          </p>

          <div className="bg-black border border-[#3c3c3c] p-2 rounded-none font-mono text-[7px] leading-tight select-none">
            {/* Header */}
            <div className="flex text-white/20 border-b border-white/5 pb-1 mb-1 font-bold">
              <span className="w-[18px] shrink-0">ADR</span>
              <span className="flex-1 gap-0.5 text-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                {['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'].map(h => (
                  <span key={h}>{h}</span>
                ))}
              </span>
            </div>
            
            {/* Rows */}
            <div className="space-y-0.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
              {(() => {
                const mem = Array(256).fill(0);
                if (props.path && props.path.length > 0) {
                  mem[0] = Math.min(props.path.length, 255);
                  for (let i = 0; i < props.path.length; i++) {
                    if (1 + i * 2 + 1 < 256) {
                      mem[1 + i * 2] = props.path[i].row;
                      mem[1 + i * 2 + 1] = props.path[i].col;
                    }
                  }
                }

                const currentRobotIndex = Math.floor(props.robotT);
                const activeAddr1 = (props.simulationState === 'moving' || props.simulationState === 'done') && props.path.length > 0 ? 1 + currentRobotIndex * 2 : -1;
                const activeAddr2 = (props.simulationState === 'moving' || props.simulationState === 'done') && props.path.length > 0 ? 1 + currentRobotIndex * 2 + 1 : -1;

                const rows = [];
                for (let r = 0; r < 16; r++) {
                  const addrPrefix = (r * 16).toString(16).toUpperCase().padStart(2, '0');
                  const cols = [];
                  for (let c = 0; c < 16; c++) {
                    const addr = r * 16 + c;
                    const val = mem[addr];
                    const hexVal = val.toString(16).toUpperCase().padStart(2, '0');
                    const isActive = addr === activeAddr1 || addr === activeAddr2;
                    const isLength = addr === 0 && props.path.length > 0;
                    
                    let textColor = 'text-white/40';
                    let bgColor = 'bg-transparent';
                    
                    if (isActive) {
                      textColor = 'text-white font-bold';
                      bgColor = 'bg-[#1c69d4]';
                    } else if (isLength) {
                      textColor = 'text-[#2ccb5d] font-bold';
                    } else if (val > 0) {
                      textColor = 'text-white/70';
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
                      <span className="w-[18px] text-white/20 shrink-0 font-bold">{addrPrefix}</span>
                      <div className="flex-1 gap-0.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                        {cols}
                      </div>
                    </div>
                  );
                }
                return rows;
              })()}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-white/5" />

      {/* Keyboard Shortcuts */}
      <Collapsible open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] tracking-wider font-mono text-white/15 hover:text-white/30 transition-colors cursor-pointer">
          <Keyboard className="w-3 h-3" />
          {t.shortcuts}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1">
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
              <div key={key} className="flex items-center justify-between">
                <kbd className="text-[8px] font-mono bg-[#1a1a1a] border border-[#3c3c3c] rounded-none px-1.5 py-0.5 text-white/40">
                  {key}
                </kbd>
                <span className="text-[9px] text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
