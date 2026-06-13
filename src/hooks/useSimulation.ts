import { useState, useCallback, useRef, useEffect } from 'react';
import type { Grid, Position, AlgorithmKey, SimulationState, ComparisonResult } from '@/types';
import { runAlgorithm } from '@/lib/algorithms';

interface SerialWriter {
  write(chunk: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface SerialReader {
  read(): Promise<{ done: boolean; value: Uint8Array | undefined }>;
  releaseLock(): void;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: {
    getWriter(): SerialWriter;
  };
  readable?: {
    getReader(): SerialReader;
  };
}

interface NavigatorWithSerial {
  serial: {
    requestPort(): Promise<SerialPort>;
  };
}

// ── Framed Serial Protocol Constants ──
// Frame format: [STX][CMD][CHECKSUM][ETX] — 4 bytes per frame
// CHECKSUM = CMD XOR 0xFF (bitwise NOT for single-byte integrity check)
// ACK response from Arduino: [STX][0x06][0xF9][ETX]
const STX = 0x02; // Start of Text — frame delimiter
const ETX = 0x03; // End of Text — frame delimiter
const ACK_BYTE = 0x06; // Acknowledge — positive response from receiver

export interface SerialStats {
  framesSent: number;
  bytesSent: number;
  ackReceived: number;
  checksumErrors: number;
}

const INITIAL_STATS: SerialStats = { framesSent: 0, bytesSent: 0, ackReceived: 0, checksumErrors: 0 };

// ── Finite State Machine — Valid Transition Map ──
// Mirrors processor control-unit state transition tables.
// Invalid transitions are silently rejected to prevent FSM corruption.
const VALID_TRANSITIONS: Record<SimulationState, Set<SimulationState>> = {
  idle: new Set(['exploring']),
  exploring: new Set(['pathing', 'done']),
  pathing: new Set(['moving']),
  moving: new Set(['done', 'moving']),   // moving→moving = replan (interrupt-driven)
  done: new Set(['idle']),
};

export function useSimulation() {
  const [state, setState] = useState<SimulationState>('idle');
  const [algorithm, setAlgorithm] = useState<AlgorithmKey>('astar');
  const [visitOrder, setVisitOrder] = useState<Position[]>([]);
  const [path, setPath] = useState<Position[]>([]);
  const [pathCost, setPathCost] = useState(0);
  const [vstep, setVstep] = useState(0);
  const [pstep, setPstep] = useState(0);
  const [robotT, setRobotT] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [computeTime, setComputeTime] = useState(0);
  const [comparison, setComparison] = useState<ComparisonResult[] | null>(null);
  const [simultaneous, setSimultaneous] = useState(true);
  
  // Settings & Debug Scores
  const [diagonal, setDiagonal] = useState(false);
  const [gScores, setGScores] = useState<Record<string, number>>({});
  const [hScores, setHScores] = useState<Record<string, number>>({});

  // Web Serial & Fog of War Innovation States
  const [serialConnected, setSerialConnected] = useState(false);
  const [isVirtualSerial, setIsVirtualSerial] = useState(false);
  const [fogMode, setFogMode] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // ── Serial Protocol Statistics ──
  const [serialStats, setSerialStats] = useState<SerialStats>({ ...INITIAL_STATS });
  const serialStatsRef = useRef<SerialStats>({ ...INITIAL_STATS });
  const serialReaderRef = useRef<SerialReader | null>(null);
  const readLoopActiveRef = useRef(false);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
  }, []);

  const serialPortRef = useRef<SerialPort | null>(null);
  const serialWriterRef = useRef<SerialWriter | null>(null);
  const lastSentIndexRef = useRef<number>(-1);


  const stateRef = useRef(state);
  const visitOrderRef = useRef<Position[]>([]);
  const pathRef = useRef<Position[]>([]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── FSM Guard — Validated state transition ──
  // Rejects illegal transitions (analogous to control-unit hazard detection).
  const transitionState = useCallback((next: SimulationState) => {
    if (VALID_TRANSITIONS[stateRef.current]?.has(next)) {
      setState(next);
    } else if (stateRef.current !== next) {
      console.warn(`[FSM] Blocked invalid transition: ${stateRef.current} → ${next}`);
    }
  }, []);

  // ── Apply algorithm result to all simulation state ──
  // Centralizes the 12-setter pattern used by run/compare/select/replan,
  // analogous to a microcode sequencer that applies a decoded instruction's effects.
  const applyAlgorithmResult = useCallback(
    (result: ReturnType<typeof runAlgorithm>, vstepInit: number, nextState: SimulationState) => {
      visitOrderRef.current = result.visitOrder;
      pathRef.current = result.path;
      setVisitOrder(result.visitOrder);
      setPath(result.path);
      setPathCost(result.pathCost || 0);
      setComputeTime(result.time);
      setGScores(result.gScores || {});
      setHScores(result.hScores || {});
      setVstep(vstepInit);
      setPstep(0);
      setRobotT(0);
      transitionState(nextState);
    },
    [transitionState]
  );

  const reset = useCallback(() => {
    setState('idle');
    setVstep(0);
    setPstep(0);
    setRobotT(0);
    setVisitOrder([]);
    setPath([]);
    setPathCost(0);
    setComputeTime(0);
    setComparison(null);
    setGScores({});
    setHScores({});
    serialStatsRef.current = { ...INITIAL_STATS };
    setSerialStats({ ...INITIAL_STATS });
  }, []);

  const run = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      const result = runAlgorithm(algorithm, grid, start, end, diagonal);
      applyAlgorithmResult(result, 0, 'exploring');
    },
    [algorithm, diagonal, applyAlgorithmResult]
  );

  const stepOnce = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      if (stateRef.current === 'idle') {
        const result = runAlgorithm(algorithm, grid, start, end, diagonal);
        applyAlgorithmResult(result, 1, 'exploring');
        return;
      }
      if (stateRef.current === 'exploring') {
        setVstep((prev) => {
          const next = prev + 1;
          if (next >= visitOrderRef.current.length) {
            setState(pathRef.current.length > 0 ? 'pathing' : 'done');
          }
          return next;
        });
      } else if (stateRef.current === 'pathing') {
        setPstep((prev) => {
          const next = prev + 1;
          if (next >= pathRef.current.length) {
            setState('moving');
            setRobotT(0);
          }
          return next;
        });
      } else if (stateRef.current === 'moving') {
        setRobotT((prev) => {
          const next = prev + 1;
          if (next >= pathRef.current.length - 1) {
            setState('done');
          }
          return next;
        });
      }
    },
    [algorithm, diagonal, applyAlgorithmResult]
  );

  const compareAll = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      const algos: AlgorithmKey[] = ['bfs', 'dijkstra', 'astar'];
      const labels: Record<AlgorithmKey, string> = { bfs: 'BFS', dijkstra: 'Dijkstra', astar: 'A*' };
      const results: ComparisonResult[] = algos.map((a) => ({
        algorithm: a,
        label: labels[a],
        result: runAlgorithm(a, grid, start, end, diagonal),
      }));
      setComparison(results);

      // Visualize A* result
      const best = results.find((r) => r.algorithm === 'astar')!;
      applyAlgorithmResult(best.result, 0, 'exploring');
    },
    [diagonal, applyAlgorithmResult]
  );

  const selectComparisonAlgorithm = useCallback((algo: AlgorithmKey) => {
    if (!comparison) return;
    const target = comparison.find((r) => r.algorithm === algo);
    if (!target) return;
    
    setAlgorithm(algo);
    applyAlgorithmResult(target.result, 0, 'exploring');
  }, [comparison, applyAlgorithmResult]);

  // ── Serial reader loop for ACK reception ──
  // Reads incoming bytes from Arduino, validates frame structure and checksum
  const startReadLoop = useCallback(() => {
    const read = async () => {
      while (readLoopActiveRef.current && serialReaderRef.current) {
        try {
          const { done, value } = await serialReaderRef.current.read();
          if (done) break;
          if (value && value.length >= 4) {
            // Parse frame: expect [STX][ACK_BYTE][CHECKSUM][ETX]
            if (value[0] === STX && value[value.length - 1] === ETX) {
              const cmd = value[1];
              const checksum = value[2];
              const expected = (cmd ^ 0xFF) & 0xFF;
              if (cmd === ACK_BYTE && checksum === expected) {
                serialStatsRef.current = {
                  ...serialStatsRef.current,
                  ackReceived: serialStatsRef.current.ackReceived + 1
                };
                setSerialStats({ ...serialStatsRef.current });
              } else {
                serialStatsRef.current = {
                  ...serialStatsRef.current,
                  checksumErrors: serialStatsRef.current.checksumErrors + 1
                };
                setSerialStats({ ...serialStatsRef.current });
              }
            }
          }
        } catch {
          break;
        }
      }
    };
    read();
  }, []);

  // Web Serial Helper Functions
  const connectSerial = useCallback(async (isVirtual = false) => {
    if (!isVirtual && !('serial' in navigator)) {
      showToast('warning', 'Web Serial API tidak didukung di browser ini. Menghubungkan secara Virtual...');
      isVirtual = true;
    }

    if (isVirtual) {
      serialPortRef.current = {
        open: async () => {},
        close: async () => {},
        writable: {
          getWriter: () => ({
            write: async (chunk: Uint8Array) => {
              // Virtual serial: decode frame and simulate ACK
              console.log('[VIRTUAL SERIAL] Frame:', Array.from(chunk).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
              // Auto-ACK for virtual serial
              serialStatsRef.current = {
                ...serialStatsRef.current,
                ackReceived: serialStatsRef.current.ackReceived + 1
              };
              setSerialStats({ ...serialStatsRef.current });
            },
            releaseLock: () => {}
          })
        }
      } as SerialPort;
      serialWriterRef.current = serialPortRef.current.writable.getWriter();
      setSerialConnected(true);
      setIsVirtualSerial(true);
      showToast('success', 'Terhubung ke Virtual COM Port (Emulator Serial).');
      return;
    }

    try {
      const port = await (navigator as unknown as NavigatorWithSerial).serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      serialWriterRef.current = port.writable.getWriter();
      // Start serial reader for ACK reception if readable is available
      if (port.readable) {
        serialReaderRef.current = port.readable.getReader();
        readLoopActiveRef.current = true;
        startReadLoop();
      }
      setSerialConnected(true);
      setIsVirtualSerial(false);
      showToast('success', 'Berhasil terhubung ke Arduino pada Baud Rate 9600.');
    } catch (err) {
      console.error('Gagal menghubungkan serial:', err);
      const errMsg = (err as Error).message;
      let userFriendlyMsg: string;
      if (errMsg.includes('No port selected')) {
        userFriendlyMsg = 'Koneksi dibatalkan: Anda tidak memilih port serial.';
      } else {
        userFriendlyMsg = `Gagal membuka port serial: ${errMsg}`;
      }
      showToast('error', userFriendlyMsg);
    }
  }, [showToast, startReadLoop]);

  const disconnectSerial = useCallback(async () => {
    readLoopActiveRef.current = false;
    try {
      if (serialReaderRef.current) {
        serialReaderRef.current.releaseLock();
        serialReaderRef.current = null;
      }
      if (serialWriterRef.current) {
        serialWriterRef.current.releaseLock();
        serialWriterRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (err) {
      console.error('Error saat memutuskan serial:', err);
    }
    const wasVirtual = isVirtualSerial;
    setSerialConnected(false);
    setIsVirtualSerial(false);
    showToast('info', wasVirtual ? 'Koneksi Serial Virtual diputuskan.' : 'Koneksi Serial diputuskan.');
  }, [showToast, isVirtualSerial]);

  // ── Build a framed serial packet ──
  // Frame: [STX=0x02][CMD byte][CHECKSUM byte][ETX=0x03]
  // Checksum = CMD XOR 0xFF ensures single-byte error detection
  const buildFrame = useCallback((cmdByte: number): Uint8Array => {
    const checksum = (cmdByte ^ 0xFF) & 0xFF;
    return new Uint8Array([STX, cmdByte, checksum, ETX]);
  }, []);

  // ── Send a framed serial command ──
  // Encodes command character into a 4-byte frame and transmits via serial
  const sendSerialFrame = useCallback(async (char: string) => {
    if (!serialWriterRef.current) return;
    try {
      const cmdByte = char.charCodeAt(0);
      const frame = buildFrame(cmdByte);
      await serialWriterRef.current.write(frame);
      serialStatsRef.current = {
        ...serialStatsRef.current,
        framesSent: serialStatsRef.current.framesSent + 1,
        bytesSent: serialStatsRef.current.bytesSent + frame.length
      };
      setSerialStats({ ...serialStatsRef.current });
      console.log(`[TX Frame] 0x${cmdByte.toString(16).toUpperCase()} '${char}' | Frame: STX CMD CKS ETX`);
    } catch (err) {
      console.error('Failed to send serial frame:', err);
    }
  }, [buildFrame]);

  // Monitor path navigation and send commands to Serial
  useEffect(() => {
    if (!serialConnected) return;

    if (state === 'moving' && path.length > 0) {
      const currentIndex = Math.floor(robotT);
      if (lastSentIndexRef.current === -1) {
        lastSentIndexRef.current = 0;
      } else if (currentIndex > lastSentIndexRef.current && currentIndex < path.length) {
        // Send a serial command character for every step traversed sequentially
        for (let i = lastSentIndexRef.current + 1; i <= currentIndex; i++) {
          const curr = path[i - 1];
          const next = path[i];
          
          let cmd = '';
          const dy = next.row - curr.row;
          const dx = next.col - curr.col;

          if (dy < 0 && dx === 0) cmd = 'U';      // Up
          else if (dy > 0 && dx === 0) cmd = 'D'; // Down
          else if (dy === 0 && dx < 0) cmd = 'L'; // Left
          else if (dy === 0 && dx > 0) cmd = 'R'; // Right
          else if (dy < 0 && dx < 0) cmd = '1';   // Up-Left (Diagonal)
          else if (dy < 0 && dx > 0) cmd = '2';   // Up-Right (Diagonal)
          else if (dy > 0 && dx < 0) cmd = '3';   // Down-Left (Diagonal)
          else if (dy > 0 && dx > 0) cmd = '4';   // Down-Right (Diagonal)

          if (cmd) {
            sendSerialFrame(cmd);
          }
        }
        lastSentIndexRef.current = currentIndex;
      }
    } else if (state === 'done' && lastSentIndexRef.current !== -1) {
      sendSerialFrame('E'); // Send End frame
      lastSentIndexRef.current = -1;
    } else if (state === 'idle') {
      lastSentIndexRef.current = -1;
    }
  }, [robotT, state, path, serialConnected, sendSerialFrame]);

  const replan = useCallback((grid: Grid, robotPos: Position, end: Position) => {
    const result = runAlgorithm(algorithm, grid, robotPos, end, diagonal);
    lastSentIndexRef.current = -1;
    // Replanning skips exploring/pathing — go directly to moving (or done if no path)
    applyAlgorithmResult(
      result,
      result.visitOrder.length,
      result.path.length === 0 ? 'done' : 'moving'
    );
  }, [algorithm, diagonal, applyAlgorithmResult]);

  return {
    state, algorithm, visitOrder, path, pathCost,
    vstep, pstep, robotT, speed, computeTime, comparison, simultaneous,
    diagonal, gScores, hScores,
    serialConnected, isVirtualSerial, fogMode, toast, serialStats,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setFogMode, connectSerial, disconnectSerial,
    replan, selectComparisonAlgorithm, setSimultaneous,
    reset, run, stepOnce, compareAll, showToast, setToast,
  };
}