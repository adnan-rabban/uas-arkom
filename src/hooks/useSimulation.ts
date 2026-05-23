import { useState, useCallback, useRef, useEffect } from 'react';
import type { Grid, Position, AlgorithmKey, SimulationState, ComparisonResult } from '@/types';
import { runAlgorithm } from '@/lib/algorithms';

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

  return {
    state, algorithm, visitOrder, path,
    vstep, pstep, robotT, speed, computeTime, comparison,
    diagonal, gScores, hScores,
    setAlgorithm, setSpeed, setVstep, setPstep, setRobotT, setState, setDiagonal,
    reset, run, stepOnce, compareAll,
  };
}
