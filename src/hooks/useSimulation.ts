import { useState, useCallback, useRef, useEffect } from 'react';
import type { Grid, Position, AlgorithmKey, SimulationState, ComparisonResult } from '@/types';
import { runAlgorithm } from '@/lib/algorithms';

interface SerialWriter {
  write(chunk: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: {
    getWriter(): SerialWriter;
  };
}

interface NavigatorWithSerial {
  serial: {
    requestPort(): Promise<SerialPort>;
  };
}

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
  }, []);

  const run = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      const result = runAlgorithm(algorithm, grid, start, end, diagonal);
      visitOrderRef.current = result.visitOrder;
      pathRef.current = result.path;
      setVisitOrder(result.visitOrder);
      setPath(result.path);
      setPathCost(result.pathCost || 0);
      setComputeTime(result.time);
      setGScores(result.gScores || {});
      setHScores(result.hScores || {});
      setVstep(0);
      setPstep(0);
      setRobotT(0);
      setState('exploring');
    },
    [algorithm, diagonal]
  );

  const stepOnce = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      if (stateRef.current === 'idle') {
        const result = runAlgorithm(algorithm, grid, start, end, diagonal);
        visitOrderRef.current = result.visitOrder;
        pathRef.current = result.path;
        setVisitOrder(result.visitOrder);
        setPath(result.path);
        setPathCost(result.pathCost || 0);
        setComputeTime(result.time);
        setGScores(result.gScores || {});
        setHScores(result.hScores || {});
        setVstep(1);
        setPstep(0);
        setRobotT(0);
        setState('exploring');
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
    [algorithm, diagonal]
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
      visitOrderRef.current = best.result.visitOrder;
      pathRef.current = best.result.path;
      setVisitOrder(best.result.visitOrder);
      setPath(best.result.path);
      setPathCost(best.result.pathCost || 0);
      setComputeTime(best.result.time);
      setGScores(best.result.gScores || {});
      setHScores(best.result.hScores || {});
      setVstep(0);
      setPstep(0);
      setRobotT(0);
      setState('exploring');
    },
    [diagonal]
  );

  const selectComparisonAlgorithm = useCallback((algo: AlgorithmKey) => {
    if (!comparison) return;
    const target = comparison.find((r) => r.algorithm === algo);
    if (!target) return;
    
    setAlgorithm(algo);
    visitOrderRef.current = target.result.visitOrder;
    pathRef.current = target.result.path;
    setVisitOrder(target.result.visitOrder);
    setPath(target.result.path);
    setPathCost(target.result.pathCost || 0);
    setComputeTime(target.result.time);
    setGScores(target.result.gScores || {});
    setHScores(target.result.hScores || {});
    setVstep(0);
    setPstep(0);
    setRobotT(0);
    setState('exploring');
  }, [comparison]);

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
              const text = new TextDecoder().decode(chunk);
              console.log('[VIRTUAL SERIAL] Sent:', text);
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
  }, [showToast]);

  const disconnectSerial = useCallback(async () => {
    try {
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

  const sendSerialChar = useCallback(async (char: string) => {
    if (!serialWriterRef.current) return;
    try {
      const encoder = new TextEncoder();
      await serialWriterRef.current.write(encoder.encode(char));
      console.log('Serial Sent:', char);
    } catch (err) {
      console.error('Gagal mengirim karakter serial:', err);
    }
  }, []);

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
            sendSerialChar(cmd);
          }
        }
        lastSentIndexRef.current = currentIndex;
      }
    } else if (state === 'done' && lastSentIndexRef.current !== -1) {
      sendSerialChar('E'); // Send End
      lastSentIndexRef.current = -1;
    } else if (state === 'idle') {
      lastSentIndexRef.current = -1;
    }
  }, [robotT, state, path, serialConnected, sendSerialChar]);

  const replan = useCallback((grid: Grid, robotPos: Position, end: Position) => {
    const result = runAlgorithm(algorithm, grid, robotPos, end, diagonal);
    lastSentIndexRef.current = -1;
    visitOrderRef.current = result.visitOrder;
    pathRef.current = result.path;
    setVisitOrder(result.visitOrder);
    setPath(result.path);
    setPathCost(result.pathCost || 0);
    setComputeTime(result.time);
    setGScores(result.gScores || {});
    setHScores(result.hScores || {});
    setVstep(result.visitOrder.length);
    setPstep(result.path.length);
    setRobotT(0);
    if (result.path.length === 0) {
      setState('done');
    } else {
      setState('moving');
    }
  }, [algorithm, diagonal]);

  return {
    state, algorithm, visitOrder, path, pathCost,
    vstep, pstep, robotT, speed, computeTime, comparison, simultaneous,
    diagonal, gScores, hScores,
    serialConnected, isVirtualSerial, fogMode, toast,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setFogMode, connectSerial, disconnectSerial, sendSerialChar,
    replan, selectComparisonAlgorithm, setSimultaneous,
    reset, run, stepOnce, compareAll, showToast, setToast,
  };
}