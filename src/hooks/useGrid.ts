import { useState, useCallback, useRef } from 'react';
import type { Grid, Position, Tool } from '@/types';
import { CellType } from '@/types';
import { createGrid, inBounds, applyWalls } from '@/lib/grid';
import { DEFAULT_START, DEFAULT_END, CELL } from '@/lib/constants';
import { MAP_PRESETS } from '@/lib/presets';
import { generateDFSMaze } from '@/lib/maze';

export function useGrid() {
  const [grid, setGrid] = useState<Grid>(() => applyWalls(createGrid(), MAP_PRESETS.default.walls));
  const [startPos, setStartPos] = useState<Position>(MAP_PRESETS.default.start);
  const [endPos, setEndPos] = useState<Position>(MAP_PRESETS.default.end);
  const [tool, setTool] = useState<Tool>('wall');
  const [currentPreset, setCurrentPreset] = useState('default');
  const isDragging = useRef(false);
  const lastCell = useRef<Position | null>(null);

  const applyToolAt = useCallback(
    (row: number, col: number) => {
      if (!inBounds(row, col)) return;

      setGrid((prev) => {
        const isStart = row === startPos.row && col === startPos.col;
        const isEnd = row === endPos.row && col === endPos.col;

        if (tool === 'wall' || tool === 'mud') {
          if (isStart || isEnd) return prev;
          const targetVal = tool === 'wall' ? CellType.WALL : CellType.MUD;
          if (prev[row][col] === targetVal) return prev;
          const newRow = prev[row].slice();
          newRow[col] = targetVal;
          const next = prev.slice() as Grid;
          next[row] = newRow;
          return next;
        }

        if (tool === 'erase') {
          if (prev[row][col] === CellType.EMPTY) return prev;
          const newRow = prev[row].slice();
          newRow[col] = CellType.EMPTY;
          const next = prev.slice() as Grid;
          next[row] = newRow;
          return next;
        }

        if (tool === 'start') {
          if (isEnd) return prev;
          setStartPos({ row, col });
          if (prev[row][col] === CellType.EMPTY) return prev;
          const newRow = prev[row].slice();
          newRow[col] = CellType.EMPTY;
          const next = prev.slice() as Grid;
          next[row] = newRow;
          return next;
        }

        if (tool === 'end') {
          if (isStart) return prev;
          setEndPos({ row, col });
          if (prev[row][col] === CellType.EMPTY) return prev;
          const newRow = prev[row].slice();
          newRow[col] = CellType.EMPTY;
          const next = prev.slice() as Grid;
          next[row] = newRow;
          return next;
        }

        return prev;
      });
    },
    [tool, startPos, endPos]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = e.currentTarget.width / rect.width;
      const scaleY = e.currentTarget.height / rect.height;
      const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
      const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
      lastCell.current = { row, col };
      applyToolAt(row, col);
    },
    [applyToolAt]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = e.currentTarget.width / rect.width;
      const scaleY = e.currentTarget.height / rect.height;
      const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
      const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
      if (lastCell.current && lastCell.current.row === row && lastCell.current.col === col) return;
      lastCell.current = { row, col };
      applyToolAt(row, col);
    },
    [applyToolAt]
  );

  const handleCanvasMouseUp = useCallback(() => {
    isDragging.current = false;
    lastCell.current = null;
  }, []);

  const clearGrid = useCallback(() => {
    setGrid(createGrid());
    setStartPos(DEFAULT_START);
    setEndPos(DEFAULT_END);
    setCurrentPreset('empty');
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = MAP_PRESETS[presetId];
    if (!preset) return;
    setGrid(applyWalls(createGrid(), preset.walls));
    setStartPos(preset.start);
    setEndPos(preset.end);
    setCurrentPreset(presetId);
  }, []);

  const generateMaze = useCallback(() => {
    const walls = generateDFSMaze(startPos, endPos);
    setGrid(applyWalls(createGrid(), walls));
    setCurrentPreset('maze');
  }, [startPos, endPos]);

  return {
    grid, startPos, endPos, tool, currentPreset,
    setGrid, setStartPos, setEndPos, setCurrentPreset,
    setTool, clearGrid, loadPreset, generateMaze,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  };
}