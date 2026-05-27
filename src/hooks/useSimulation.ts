import { useState, useCallback, useRef, useEffect } from 'react';
import type { Grid, Position, AlgorithmKey, SimulationState, ComparisonResult } from '@/types';
import { runAlgorithm } from '@/lib/algorithms';

interface SerialWriter {
  write(chunk: Uint8Array): Promise<void>;
  releaseLock(): Promise<void>;
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
  const [vstep, setVstep] = useState(0);
  const [pstep, setPstep] = useState(0);
  const [robotT, setRobotT] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [computeTime, setComputeTime] = useState(0);
  const [comparison, setComparison] = useState<ComparisonResult[] | null>(null);
  
  // Settings & Debug Scores
  const [diagonal, setDiagonal] = useState(false);
  const [gScores, setGScores] = useState<Record<string, number>>({});
  const [hScores, setHScores] = useState<Record<string, number>>({});

  // Web Serial & SLAM Innovation States
  const [serialConnected, setSerialConnected] = useState(false);
  const [slamMode, setSlamMode] = useState(false);
  const serialPortRef = useRef<SerialPort | null>(null);
  const serialWriterRef = useRef<SerialWriter | null>(null);
  const lastSentIndexRef = useRef<number>(-1);


  const stateRef = useRef(state);
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
    setComputeTime(0);
    setComparison(null);
    setGScores({});
    setHScores({});
  }, []);

  const run = useCallback(
    (grid: Grid, start: Position, end: Position) => {
      const result = runAlgorithm(algorithm, grid, start, end, diagonal);
      setVisitOrder(result.visitOrder);
      setPath(result.path);
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
        setVisitOrder(result.visitOrder);
        setPath(result.path);
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
          if (next >= visitOrder.length) {
            setState(path.length > 0 ? 'pathing' : 'done');
          }
          return next;
        });
      } else if (stateRef.current === 'pathing') {
        setPstep((prev) => {
          const next = prev + 1;
          if (next >= path.length) {
            setState('moving');
            setRobotT(0);
          }
          return next;
        });
      } else if (stateRef.current === 'moving') {
        setRobotT((prev) => {
          const next = prev + 1;
          if (next >= path.length - 1) {
            setState('done');
          }
          return next;
        });
      }
    },
    [algorithm, visitOrder.length, path.length, diagonal]
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
      setVisitOrder(best.result.visitOrder);
      setPath(best.result.path);
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

  // Web Serial Helper Functions
  const connectSerial = useCallback(async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API tidak didukung di browser ini. Gunakan Chrome atau Edge.');
      return;
    }
    try {
      const port = await (navigator as unknown as NavigatorWithSerial).serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      serialWriterRef.current = port.writable.getWriter();
      setSerialConnected(true);
    } catch (err) {
      console.error('Gagal menghubungkan serial:', err);
      alert('Gagal membuka port serial: ' + (err as Error).message);
    }
  }, []);

  const disconnectSerial = useCallback(async () => {
    try {
      if (serialWriterRef.current) {
        await serialWriterRef.current.releaseLock();
        serialWriterRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (err) {
      console.error('Error saat memutuskan serial:', err);
    }
    setSerialConnected(false);
  }, []);

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
        const curr = path[lastSentIndexRef.current];
        const next = path[currentIndex];
        
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
    setVisitOrder(result.visitOrder);
    setPath(result.path);
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
    state, algorithm, visitOrder, path,
    vstep, pstep, robotT, speed, computeTime, comparison,
    diagonal, gScores, hScores,
    serialConnected, slamMode,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    setSlamMode, connectSerial, disconnectSerial, sendSerialChar,
    replan,
    reset, run, stepOnce, compareAll,
  };
}
