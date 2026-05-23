import { useEffect } from 'react';

interface KeyboardActions {
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onToolWall: () => void;
  onToolStart: () => void;
  onToolEnd: () => void;
  onToolErase: () => void;
  onToolMud: () => void;
}

export function useKeyboard(actions: KeyboardActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.onRun();
          break;
        case 's':
          actions.onStep();
          break;
        case 'r':
          actions.onReset();
          break;
        case 'c':
          actions.onClear();
          break;
        case '1':
          actions.onToolWall();
          break;
        case '2':
          actions.onToolStart();
          break;
        case '3':
          actions.onToolEnd();
          break;
        case '4':
          actions.onToolErase();
          break;
        case '5':
          actions.onToolMud();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions]);
}
