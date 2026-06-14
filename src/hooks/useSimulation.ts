import { useState, useCallback, useRef, useEffect } from 'react';
import type { Grid, Position, AlgorithmKey, SimulationState } from '@/types';
import { runAlgorithm } from '@/lib/algorithms';

interface SerialWriter {
  write(chunk: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface SerialReader {
  read(): Promise<{ done: boolean; value: Uint8Array | undefined }>;
  releaseLock(): void;
  cancel?(): Promise<void>;
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
  idle: new Set(['exploring', 'moving', 'done']),       // idle→moving/done = fog exploration start
  exploring: new Set(['pathing', 'done']),
  pathing: new Set(['moving']),
  moving: new Set(['done', 'moving']),                  // moving→moving = replan (interrupt-driven)
  done: new Set(['idle', 'moving']),                    // done→moving = resume next exploration leg
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

  // ── Fog terminal flag ──
  // During frontier exploration the robot reaches many intermediate "done"
  // states (one per frontier leg). The End ('E') byte must only be transmitted
  // when the robot has actually arrived at the goal — not at every leg. This
  // defaults to true so normal (non-fog) runs behave exactly as before.
  const fogTerminalRef = useRef(true);
  const setFogTerminal = useCallback((isTerminal: boolean) => {
    fogTerminalRef.current = isTerminal;
  }, []);

  const stateRef = useRef(state);
  const visitOrderRef = useRef<Position[]>([]);
  const pathRef = useRef<Position[]>([]);
  const vstepRef = useRef(vstep);
  const pstepRef = useRef(pstep);
  const robotTRef = useRef(robotT);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => { vstepRef.current = vstep; }, [vstep]);
  useEffect(() => { pstepRef.current = pstep; }, [pstep]);
  useEffect(() => { robotTRef.current = robotT; }, [robotT]);

  // ── FSM Guard — Validated state transition ──
  // Rejects illegal transitions (analogous to control-unit hazard detection).
  const transitionState = useCallback((next: SimulationState) => {
    if (VALID_TRANSITIONS[stateRef.current]?.has(next)) {
      setState(next);
      stateRef.current = next;
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
      vstepRef.current = vstepInit;
      const pstepInit = (nextState === 'moving' || nextState === 'done') ? result.path.length : 0;
      setPstep(pstepInit);
      pstepRef.current = pstepInit;
      setRobotT(0);
      robotTRef.current = 0;
      transitionState(nextState);
    },
    [transitionState]
  );

  const reset = useCallback(() => {
    setState('idle');
    stateRef.current = 'idle';
    setVstep(0);
    vstepRef.current = 0;
    setPstep(0);
    pstepRef.current = 0;
    setRobotT(0);
    robotTRef.current = 0;
    setVisitOrder([]);
    setPath([]);
    setPathCost(0);
    setComputeTime(0);
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
        const vstepInit = Math.min(2, result.visitOrder.length);
        const nextState = vstepInit >= result.visitOrder.length
          ? (result.path.length > 0 ? 'pathing' : 'done')
          : 'exploring';
        applyAlgorithmResult(result, vstepInit, nextState);
        return;
      }
      if (stateRef.current === 'exploring') {
        const next = vstepRef.current + 1;
        setVstep(next);
        vstepRef.current = next;
        if (next >= visitOrderRef.current.length) {
          transitionState(pathRef.current.length > 0 ? 'pathing' : 'done');
        }
      } else if (stateRef.current === 'pathing') {
        const next = pstepRef.current + 1;
        setPstep(next);
        pstepRef.current = next;
        if (next >= pathRef.current.length) {
          transitionState('moving');
          setRobotT(0);
          robotTRef.current = 0;
        }
      } else if (stateRef.current === 'moving') {
        const next = robotTRef.current + 1;
        setRobotT(next);
        robotTRef.current = next;
        if (next >= pathRef.current.length - 1) {
          transitionState('done');
        }
      }
    },
    [algorithm, diagonal, applyAlgorithmResult, transitionState]
  );

  // ── Serial reader loop for ACK reception ──
  // Reads incoming bytes from Arduino, validates frame structure and checksum
  const startReadLoop = useCallback(() => {
    const read = async () => {
      let buffer: number[] = [];
      while (readLoopActiveRef.current && serialReaderRef.current) {
        try {
          const { done, value } = await serialReaderRef.current.read();
          if (done) break;
          if (value) {
            for (let i = 0; i < value.length; i++) {
              buffer.push(value[i]);
            }
            while (buffer.length >= 4) {
              const stxIdx = buffer.indexOf(STX);
              if (stxIdx === -1) {
                buffer = [];
                break;
              }
              if (stxIdx > 0) {
                buffer = buffer.slice(stxIdx);
              }
              if (buffer.length < 4) {
                break;
              }
              const frame = buffer.slice(0, 4);
              if (frame[3] === ETX) {
                const cmd = frame[1];
                const checksum = frame[2];
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
                buffer = buffer.slice(4);
              } else {
                buffer = buffer.slice(1);
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
            write: async () => {
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
        if (serialReaderRef.current.cancel) {
          await serialReaderRef.current.cancel().catch(() => {});
        }
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
    } catch (err) {
      console.error('Failed to send serial frame:', err);
    }
  }, [buildFrame]);

  // Monitor path navigation and send commands to Serial
  useEffect(() => {
    if (!serialConnected) return;

    const sendCommandsSequentially = async (cmds: string[]) => {
      for (const cmd of cmds) {
        await sendSerialFrame(cmd);
      }
    };

    if (state === 'moving' && path.length > 0) {
      const currentIndex = Math.floor(robotT);
      if (lastSentIndexRef.current === -1) {
        lastSentIndexRef.current = 0;
      } else if (currentIndex > lastSentIndexRef.current && currentIndex < path.length) {
        const cmds: string[] = [];
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
            cmds.push(cmd);
          }
        }
        if (cmds.length > 0) {
          sendCommandsSequentially(cmds);
        }
        lastSentIndexRef.current = currentIndex;
      }
    } else if (state === 'done' && lastSentIndexRef.current !== -1) {
      const cmds: string[] = [];
      if (lastSentIndexRef.current < path.length - 1) {
        for (let i = lastSentIndexRef.current + 1; i < path.length; i++) {
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
            cmds.push(cmd);
          }
        }
      }
      // Only emit the End frame when the robot truly finished at the goal.
      // Intermediate frontier legs (fog exploration) must NOT send 'E'.
      if (fogTerminalRef.current) {
        cmds.push('E'); // Send End frame
      }
      if (cmds.length > 0) {
        sendCommandsSequentially(cmds);
      }
      lastSentIndexRef.current = -1;
    } else if (state === 'idle') {
      lastSentIndexRef.current = -1;
    }
  }, [robotT, state, path, serialConnected, sendSerialFrame]);

  const replan = useCallback((grid: Grid, robotPos: Position, end: Position) => {
    const result = runAlgorithm(algorithm, grid, robotPos, end, diagonal);
    lastSentIndexRef.current = -1;
    applyAlgorithmResult(
      result,
      result.visitOrder.length,
      result.path.length === 0 ? 'done' : 'moving'
    );
  }, [algorithm, diagonal, applyAlgorithmResult]);

  return {
    state, algorithm, visitOrder, path, pathCost,
    vstep, pstep, robotT, speed, computeTime,
    diagonal, gScores, hScores,
    serialConnected, isVirtualSerial, fogMode, toast, serialStats,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState: transitionState, setDiagonal,
    setFogMode, connectSerial, disconnectSerial,
    replan, setFogTerminal,
    reset, run, stepOnce, showToast, setToast,
  };
}