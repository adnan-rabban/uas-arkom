import { useState, useCallback, useRef } from 'react';
import type { Grid, Position, Tool } from '@/types';
import { CellType } from '@/types';
import { createGrid, inBounds, applyWalls } from '@/lib/grid';
import { DEFAULT_START, DEFAULT_END, CELL } from '@/lib/constants';
import { MAP_PRESETS } from '@/lib/presets';

export function useGrid() {
  const [grid, setGrid] = useState<Grid>(() => {
    const g = createGrid();
    return applyWalls(g, MAP_PRESETS.default.walls);
  });
  const [startPos, setStartPos] = useState<Position>(DEFAULT_START);
  const [endPos, setEndPos] = useState<Position>(DEFAULT_END);
  const [tool, setTool] = useState<Tool>('wall');
  const [currentPreset, setCurrentPreset] = useState('default');
  const isDragging = useRef(false);
  const lastCell = useRef<Position | null>(null);

  const applyToolAt = useCallback(
    (row: number, col: number) => {
      if (!inBounds(row, col)) return;

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        switch (tool) {
          case 'wall':
            if ((row === startPos.row && col === startPos.col) || (row === endPos.row && col === endPos.col)) return prev;
            next[row][col] = CellType.WALL;
            break;
          case 'erase':
            next[row][col] = CellType.EMPTY;
            break;
          case 'start':
            next[row][col] = CellType.EMPTY;
            setStartPos({ row, col });
            break;
          case 'end':
            next[row][col] = CellType.EMPTY;
            setEndPos({ row, col });
            break;
        }
        return next;
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
    const g = createGrid();
    setGrid(applyWalls(g, preset.walls));
    setStartPos(preset.start);
    setEndPos(preset.end);
    setCurrentPreset(presetId);
  }, []);

  return {
    grid, startPos, endPos, tool, currentPreset,
    setTool, clearGrid, loadPreset,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  };
}
