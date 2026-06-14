import type { Position } from '@/types';
import { ROWS, COLS } from '@/lib/constants';

// ── Fisher-Yates shuffle (in-place, zero allocation) ──
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── Start↔Goal Connectivity Guarantee ──
// Post-processing steps (boundary cleanup, room/plaza carving, random walks) can
// leave the start and goal in disconnected components — producing a genuinely
// unsolvable maze. This floods from the start over free cells; if the goal isn't
// reached, it carves a straight L-shaped tunnel from the nearest reachable cell
// to the goal, guaranteeing at least one route exists.
function ensureConnected(isWall: boolean[][], start: Position, end: Position): void {
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const queue: Position[] = [start];
  visited[start.row][start.col] = true;
  let head = 0;
  const reachable: Position[] = [];

  while (head < queue.length) {
    const cur = queue[head++];
    reachable.push(cur);
    for (const [dr, dc] of dirs) {
      const nr = cur.row + dr, nc = cur.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc] && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  if (visited[end.row][end.col]) return; // already solvable

  // Find the reachable cell closest to the goal, then carve an L-tunnel to it.
  let best = start;
  let bestDist = Infinity;
  for (const p of reachable) {
    const d = Math.abs(p.row - end.row) + Math.abs(p.col - end.col);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  let r = best.row, c = best.col;
  while (r !== end.row) { isWall[r][c] = false; r += r < end.row ? 1 : -1; }
  while (c !== end.col) { isWall[r][c] = false; c += c < end.col ? 1 : -1; }
  isWall[r][c] = false;
}

export interface MazeResult {
  walls: Position[];
  muds: Position[];
}

export function generateDFSMaze(start: Position, end: Position): MazeResult {
  const walls: Position[] = [];
  const muds: Position[] = [];

  // Start with a grid where all cells are walls
  const isWall = Array.from({ length: ROWS }, () => new Array(COLS).fill(true));

  // Track visited cells in our passage grid
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const stack: Position[] = [];

  // ── Randomized parameters for variety ──
  // Each generation produces a different structural mix of rooms, corridors,
  // plazas, and loop density — preventing the "template" feel.
  const numRooms = 3 + Math.floor(Math.random() * 4);       // 3–6 rooms
  const numPlazas = Math.random() < 0.6 ? 1 : 2;            // 1–2 plazas
  const loopRemovalPct = 0.12 + Math.random() * 0.10;        // 12–22% walls removed
  const widenPct = 0.15 + Math.random() * 0.20;              // 15–35% corridors widened

  // ══════════════════════════════════════════════════════════
  //  STEP 1: DFS Maze Carving (Recursive Backtracking)
  // ══════════════════════════════════════════════════════════
  // Uses even-indexed cells as nodes and odd-indexed cells as edges,
  // producing a perfect maze with single-width corridors.
  const startRow = Math.floor(start.row / 2) * 2;
  const startCol = Math.floor(start.col / 2) * 2;

  visited[startRow][startCol] = true;
  isWall[startRow][startCol] = false;
  stack.push({ row: startRow, col: startCol });

  // Randomized direction order per iteration for organic feel
  const baseDirs = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Position[] = [];
    const dirs = shuffle([...baseDirs]);

    for (const { dr, dc } of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        neighbors.push({ row: nr, col: nc });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      const wallRow = current.row + (next.row - current.row) / 2;
      const wallCol = current.col + (next.col - current.col) / 2;

      visited[next.row][next.col] = true;
      isWall[next.row][next.col] = false;
      isWall[wallRow][wallCol] = false;

      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Ensure start, end, and their immediate orthogonal neighbors are cleared
  const startNeighbors = [
    start,
    { row: start.row - 1, col: start.col },
    { row: start.row + 1, col: start.col },
    { row: start.row, col: start.col - 1 },
    { row: start.row, col: start.col + 1 },
  ];
  const endNeighbors = [
    end,
    { row: end.row - 1, col: end.col },
    { row: end.row + 1, col: end.col },
    { row: end.row, col: end.col - 1 },
    { row: end.row, col: end.col + 1 },
  ];
  for (const pos of [...startNeighbors, ...endNeighbors]) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      isWall[pos.row][pos.col] = false;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 2: Room Generation
  // ══════════════════════════════════════════════════════════
  // Place random rectangular rooms (3x3 to 6x6) that carve open areas
  // into the maze, creating multi-path intersections and visual variety.
  for (let i = 0; i < numRooms; i++) {
    const roomW = 3 + Math.floor(Math.random() * 4); // 3–6 wide
    const roomH = 3 + Math.floor(Math.random() * 4); // 3–6 tall
    const roomR = 2 + Math.floor(Math.random() * (ROWS - roomH - 4));
    const roomC = 2 + Math.floor(Math.random() * (COLS - roomW - 4));

    for (let r = roomR; r < roomR + roomH && r < ROWS - 1; r++) {
      for (let c = roomC; c < roomC + roomW && c < COLS - 1; c++) {
        isWall[r][c] = false;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 3: Plaza Generation (Large Open Areas)
  // ══════════════════════════════════════════════════════════
  // Plazas are large open areas that force the robot to navigate across
  // empty space, contrasting with tight corridor sections.
  for (let i = 0; i < numPlazas; i++) {
    const plazaW = 5 + Math.floor(Math.random() * 4); // 5–8 wide
    const plazaH = 5 + Math.floor(Math.random() * 3); // 5–7 tall
    const plazaR = 2 + Math.floor(Math.random() * Math.max(1, ROWS - plazaH - 4));
    const plazaC = 2 + Math.floor(Math.random() * Math.max(1, COLS - plazaW - 4));

    for (let r = plazaR; r < plazaR + plazaH && r < ROWS - 1; r++) {
      for (let c = plazaC; c < plazaC + plazaW && c < COLS - 1; c++) {
        isWall[r][c] = false;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 4: Braid Maze — Dead-End Removal
  // ══════════════════════════════════════════════════════════
  // Connect dead ends to adjacent corridors, creating multiple routes
  // and eliminating the "single winding path" template feel.
  const deadEnds: Position[] = [];
  const orthDirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isWall[r][c]) {
        let openCount = 0;
        for (const [dr, dc] of orthDirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc]) openCount++;
        }
        if (openCount === 1) deadEnds.push({ row: r, col: c });
      }
    }
  }

  shuffle(deadEnds);
  for (const pos of deadEnds) {
    let openCount = 0;
    for (const [dr, dc] of orthDirs) {
      const nr = pos.row + dr, nc = pos.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc]) openCount++;
    }
    if (openCount > 1) continue;

    const candidates: { wr: number; wc: number }[] = [];
    const stepDirs = [
      { dr: -2, dc: 0, wr: -1, wc: 0 },
      { dr: 2, dc: 0, wr: 1, wc: 0 },
      { dr: 0, dc: -2, wr: 0, wc: -1 },
      { dr: 0, dc: 2, wr: 0, wc: 1 },
    ];
    for (const { dr, dc, wr, wc } of stepDirs) {
      const nr = pos.row + dr, nc = pos.col + dc;
      const wallR = pos.row + wr, wallC = pos.col + wc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !isWall[nr][nc] && isWall[wallR][wallC]) {
        candidates.push({ wr: wallR, wc: wallC });
      }
    }
    if (candidates.length > 0) {
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      isWall[choice.wr][choice.wc] = false;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 5: Loop Creation — Random Wall Removal
  // ══════════════════════════════════════════════════════════
  // Remove a percentage of internal walls that sit between two open
  // cells. This creates alternative routes and makes the maze feel
  // less like a single-path puzzle and more like a real environment.
  const removableWalls: Position[] = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (isWall[r][c]) {
        const h = (!isWall[r - 1][c] && !isWall[r + 1][c]); // vertical bridge
        const v = (!isWall[r][c - 1] && !isWall[r][c + 1]); // horizontal bridge
        if (h || v) removableWalls.push({ row: r, col: c });
      }
    }
  }

  shuffle(removableWalls);
  const numToRemove = Math.floor(removableWalls.length * loopRemovalPct);
  for (let i = 0; i < numToRemove; i++) {
    const rm = removableWalls[i];
    isWall[rm.row][rm.col] = false;
    // Turn 70% of these shortcuts into MUD (jalan pelosok/gang sempit)
    if (Math.random() < 0.7) {
      muds.push({ row: rm.row, col: rm.col });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 6: Corridor Widening
  // ══════════════════════════════════════════════════════════
  // Randomly select passage cells and widen them by carving one
  // adjacent wall cell. This creates hallways and asymmetry that
  // break the uniform single-cell corridor pattern.
  const passageCells: Position[] = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (!isWall[r][c]) passageCells.push({ row: r, col: c });
    }
  }

  shuffle(passageCells);
  const numWiden = Math.floor(passageCells.length * widenPct);
  for (let i = 0; i < numWiden; i++) {
    const pos = passageCells[i];
    const dirs = shuffle([...orthDirs]);
    for (const [dr, dc] of dirs) {
      const nr = pos.row + dr, nc = pos.col + dc;
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && isWall[nr][nc]) {
        isWall[nr][nc] = false;
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 7: Organic Noise — Random Walk Carving
  // ══════════════════════════════════════════════════════════
  // Perform several short random walks from random passage cells.
  // This creates organic, non-grid-aligned patterns that contrast
  // with the structured DFS corridors.
  const numWalks = 3 + Math.floor(Math.random() * 3);
  for (let w = 0; w < numWalks; w++) {
    // Pick a random existing passage cell as the walk origin
    const origin = passageCells[Math.floor(Math.random() * passageCells.length)];
    let wr = origin.row, wc = origin.col;
    const walkLen = 8 + Math.floor(Math.random() * 15);
    for (let s = 0; s < walkLen; s++) {
      const [dr, dc] = orthDirs[Math.floor(Math.random() * 4)];
      const nr = wr + dr, nc = wc + dc;
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1) {
        isWall[nr][nc] = false;
        wr = nr; wc = nc;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 8: Boundary Cleanup
  // ══════════════════════════════════════════════════════════
  // Mirror the second-to-last row/col onto the boundary to prevent
  // solid walls on the bottom and right edges of the grid.
  for (let c = 0; c < COLS; c++) {
    isWall[ROWS - 1][c] = isWall[ROWS - 2][c];
  }
  for (let r = 0; r < ROWS; r++) {
    isWall[r][COLS - 1] = isWall[r][COLS - 2];
  }

  // Re-ensure start and end are accessible after all carving steps
  for (const pos of [...startNeighbors, ...endNeighbors]) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      isWall[pos.row][pos.col] = false;
    }
  }

  // Guarantee the goal is actually reachable from the start.
  ensureConnected(isWall, start, end);

  // Convert isWall grid back to a list of wall Positions
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isWall[r][c]) {
        walls.push({ row: r, col: c });
      }
    }
  }

  return { walls, muds };
}

export function generateRecursiveDivisionMaze(start: Position, end: Position): MazeResult {
  const walls: Position[] = [];
  const muds: Position[] = [];
  const isWall = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));

  // 1. Build outer boundary walls
  for (let r = 0; r < ROWS; r++) {
    isWall[r][0] = true;
    isWall[r][COLS - 1] = true;
  }
  for (let c = 0; c < COLS; c++) {
    isWall[0][c] = true;
    isWall[ROWS - 1][c] = true;
  }

  // Helper for recursive division
  function divide(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
    const width = colEnd - colStart;
    const height = rowEnd - rowStart;

    if (width < 2 || height < 2) return;

    // Decide orientation: horizontal or vertical
    const horizontal = width > height
      ? false
      : height > width
        ? true
        : Math.random() < 0.5;

    if (horizontal) {
      // Pick a horizontal wall row (must be even index to align nicely)
      const candidates: number[] = [];
      for (let r = rowStart + 1; r < rowEnd; r++) {
        if (r % 2 === 0) candidates.push(r);
      }
      if (candidates.length === 0) return;
      const wallRow = candidates[Math.floor(Math.random() * candidates.length)];

      // Pick a passage column (must be odd index to align nicely)
      const passageCandidates: number[] = [];
      for (let c = colStart; c <= colEnd; c++) {
        if (c % 2 !== 0) passageCandidates.push(c);
      }
      if (passageCandidates.length === 0) return;
      const passageCol = passageCandidates[Math.floor(Math.random() * passageCandidates.length)];

      // Draw horizontal wall
      for (let c = colStart; c <= colEnd; c++) {
        if (c !== passageCol) {
          isWall[wallRow][c] = true;
        }
      }

      // Recurse top and bottom
      divide(rowStart, wallRow - 1, colStart, colEnd);
      divide(wallRow + 1, rowEnd, colStart, colEnd);
    } else {
      // Pick a vertical wall col (must be even index)
      const candidates: number[] = [];
      for (let c = colStart + 1; c < colEnd; c++) {
        if (c % 2 === 0) candidates.push(c);
      }
      if (candidates.length === 0) return;
      const wallCol = candidates[Math.floor(Math.random() * candidates.length)];

      // Pick a passage row (must be odd index)
      const passageCandidates: number[] = [];
      for (let r = rowStart; r <= rowEnd; r++) {
        if (r % 2 !== 0) passageCandidates.push(r);
      }
      if (passageCandidates.length === 0) return;
      const passageRow = passageCandidates[Math.floor(Math.random() * passageCandidates.length)];

      // Draw vertical wall
      for (let r = rowStart; r <= rowEnd; r++) {
        if (r !== passageRow) {
          isWall[r][wallCol] = true;
        }
      }

      // Recurse left and right
      divide(rowStart, rowEnd, colStart, wallCol - 1);
      divide(rowStart, rowEnd, wallCol + 1, colEnd);
    }
  }

  // Start division
  divide(1, ROWS - 2, 1, COLS - 2);

  // Re-ensure start and end, and their immediate neighbors are clear
  const clearNeighbors = [
    start,
    { row: start.row - 1, col: start.col },
    { row: start.row + 1, col: start.col },
    { row: start.row, col: start.col - 1 },
    { row: start.row, col: start.col + 1 },
    end,
    { row: end.row - 1, col: end.col },
    { row: end.row + 1, col: end.col },
    { row: end.row, col: end.col - 1 },
    { row: end.row, col: end.col + 1 },
  ];
  for (const pos of clearNeighbors) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      isWall[pos.row][pos.col] = false;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STEP 2: Shortcut Hole Punching (Muddy Doors)
  // ══════════════════════════════════════════════════════════
  // The basic recursive division creates a "perfect maze" (1 path only).
  // We punch random holes in the generated walls to create shortcuts,
  // and fill them with MUD to represent heavy/locked doors or alleys.
  const wallPositions = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (isWall[r][c]) {
        // Only punch holes that connect two empty spaces
        const h = !isWall[r - 1][c] && !isWall[r + 1][c];
        const v = !isWall[r][c - 1] && !isWall[r][c + 1];
        if (h || v) wallPositions.push({ row: r, col: c });
      }
    }
  }
  
  shuffle(wallPositions);
  const numShortcuts = Math.floor(wallPositions.length * 0.15); // 15% walls removed
  for (let i = 0; i < numShortcuts; i++) {
    const pos = wallPositions[i];
    isWall[pos.row][pos.col] = false;
    muds.push({ row: pos.row, col: pos.col });
  }

  // Guarantee the goal is actually reachable from the start.
  ensureConnected(isWall, start, end);

  // Convert to Position list
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isWall[r][c]) {
        walls.push({ row: r, col: c });
      }
    }
  }

  return { walls, muds };
}

export function generateCellularAutomataCave(start: Position, end: Position): MazeResult {
  const walls: Position[] = [];
  const muds: Position[] = [];
  let grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));

  // 1. Randomly fill the grid (45% wall chance)
  const fillChance = 0.45;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Keep boundaries as walls
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        grid[r][c] = true;
      } else {
        grid[r][c] = Math.random() < fillChance;
      }
    }
  }

  // Protect start and end positions
  const protectCells = (pos: Position) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = pos.row + dr, nc = pos.col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          grid[nr][nc] = false;
        }
      }
    }
  };
  protectCells(start);
  protectCells(end);

  // Helper to count 8-neighbors that are walls
  function countWallNeighbors(g: boolean[][], r: number, c: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = r + i, nc = c + j;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (g[nr][nc]) count++;
        } else {
          // Out of bounds counts as wall
          count++;
        }
      }
    }
    return count;
  }

  // 2. Run Cellular Automata steps (4 iterations)
  for (let step = 0; step < 4; step++) {
    const nextGrid = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Keep boundaries as walls
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
          nextGrid[r][c] = true;
          continue;
        }
        const neighbors = countWallNeighbors(grid, r, c);
        if (neighbors >= 5) {
          nextGrid[r][c] = true;
        } else {
          nextGrid[r][c] = false;
        }
      }
    }
    grid = nextGrid;
  }

  // Re-protect start and end
  protectCells(start);
  protectCells(end);

  // 3. Flood fill to connect start and end (Cavern Connection Guarantee)
  const visitedStart = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const queueStart: Position[] = [start];
  visitedStart[start.row][start.col] = true;
  let headStart = 0;
  const cavernStart: Position[] = [];

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (headStart < queueStart.length) {
    const cur = queueStart[headStart++];
    cavernStart.push(cur);
    for (const [dr, dc] of dirs) {
      const nr = cur.row + dr, nc = cur.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc] && !visitedStart[nr][nc]) {
        visitedStart[nr][nc] = true;
        queueStart.push({ row: nr, col: nc });
      }
    }
  }

  // If end is not reachable from start, find end's connected component and tunnel
  if (!visitedStart[end.row][end.col]) {
    const visitedEnd = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const queueEnd: Position[] = [end];
    visitedEnd[end.row][end.col] = true;
    let headEnd = 0;
    const cavernEnd: Position[] = [];

    while (headEnd < queueEnd.length) {
      const cur = queueEnd[headEnd++];
      cavernEnd.push(cur);
      for (const [dr, dc] of dirs) {
        const nr = cur.row + dr, nc = cur.col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc] && !visitedEnd[nr][nc]) {
          visitedEnd[nr][nc] = true;
          queueEnd.push({ row: nr, col: nc });
        }
      }
    }

    // Find the pair of cells (one from cavernStart, one from cavernEnd) with min Manhattan distance
    let minDist = Infinity;
    let bestStart: Position = start;
    let bestEnd: Position = end;

    for (const pS of cavernStart) {
      for (const pE of cavernEnd) {
        const dist = Math.abs(pS.row - pE.row) + Math.abs(pS.col - pE.col);
        if (dist < minDist) {
          minDist = dist;
          bestStart = pS;
          bestEnd = pE;
        }
      }
    }

    // Carve a tunnel between bestStart and bestEnd
    let currR = bestStart.row;
    let currC = bestStart.col;

    while (currR !== bestEnd.row) {
      grid[currR][currC] = false;
      currR += currR < bestEnd.row ? 1 : -1;
    }
    while (currC !== bestEnd.col) {
      grid[currR][currC] = false;
      currC += currC < bestEnd.col ? 1 : -1;
    }
    grid[currR][currC] = false;
  }

  // 4. Mud Generation (Swampy patches)
  // Add mud in random open areas to create varying traversal costs in the cave.
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (!grid[r][c] && Math.random() < 0.08) {
        // Protect start and end from mud
        const isStart = Math.abs(r - start.row) <= 1 && Math.abs(c - start.col) <= 1;
        const isEnd = Math.abs(r - end.row) <= 1 && Math.abs(c - end.col) <= 1;
        if (!isStart && !isEnd) {
          muds.push({ row: r, col: c });
        }
      }
    }
  }

  // 5. Convert to list of wall Positions
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        walls.push({ row: r, col: c });
      }
    }
  }

  return { walls, muds };
}

