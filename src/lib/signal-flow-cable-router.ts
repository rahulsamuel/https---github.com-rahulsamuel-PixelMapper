import type { RouteEndpoint, RouteObstacle, RoutePoint } from "@/lib/signal-flow-routing";

export interface OrthogonalRouteInput {
  id: string;
  from: RouteEndpoint;
  to: RouteEndpoint;
  waypoints: RoutePoint[];
}

const GRID = 8;
const PORT_EXIT = 16;
const CLEARANCE = 8;
const TURN_COST = 4;
const OCCUPIED_COST = 40;
const NEAR_COST = 4;
const NEAR_RADIUS = 2;
const GRID_PADDING_CELLS = 6;

const DIRS = [
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
  { dc: 0, dr: -1 },
];

interface Grid {
  originX: number;
  originY: number;
  cols: number;
  rows: number;
  blocked: Uint8Array;
  occupied: Uint8Array;
  near: Uint8Array;
}

interface HeapEntry {
  f: number;
  g: number;
  state: number;
}

export function routeOrthogonalCables(
  inputs: OrthogonalRouteInput[],
  obstacles: RouteObstacle[]
): Map<string, RoutePoint[]> {
  const routes = new Map<string, RoutePoint[]>();
  if (inputs.length === 0) return routes;

  const grid = buildGrid(inputs, obstacles);
  for (const input of inputs) {
    routes.set(input.id, simplifyPolyline(routeOne(grid, input)));
  }
  return routes;
}

function buildGrid(inputs: OrthogonalRouteInput[], obstacles: RouteObstacle[]): Grid {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const o of obstacles) {
    xs.push(o.x, o.x + o.width);
    ys.push(o.y, o.y + o.height);
  }
  for (const input of inputs) {
    for (const p of [input.from.point, input.to.point, ...input.waypoints]) {
      xs.push(p.x);
      ys.push(p.y);
    }
  }
  const pad = GRID * GRID_PADDING_CELLS;
  const originX = Math.floor((Math.min(...xs) - pad) / GRID) * GRID;
  const originY = Math.floor((Math.min(...ys) - pad) / GRID) * GRID;
  const cols = Math.ceil((Math.max(...xs) + pad - originX) / GRID) + 1;
  const rows = Math.ceil((Math.max(...ys) + pad - originY) / GRID) + 1;

  const grid: Grid = {
    originX,
    originY,
    cols,
    rows,
    blocked: new Uint8Array(cols * rows),
    occupied: new Uint8Array(cols * rows),
    near: new Uint8Array(cols * rows),
  };

  for (const o of obstacles) {
    const x0 = o.x - CLEARANCE;
    const x1 = o.x + o.width + CLEARANCE;
    const y0 = o.y - CLEARANCE;
    const y1 = o.y + o.height + CLEARANCE;
    for (let r = 0; r < rows; r++) {
      const y = originY + r * GRID;
      if (y < y0 || y > y1) continue;
      for (let c = 0; c < cols; c++) {
        const x = originX + c * GRID;
        if (x >= x0 && x <= x1) grid.blocked[r * cols + c] = 1;
      }
    }
  }
  return grid;
}

function routeOne(grid: Grid, input: OrthogonalRouteInput): RoutePoint[] {
  const { from, to } = input;
  const startPoint = { x: from.point.x + from.side * PORT_EXIT, y: from.point.y };
  const endPoint = { x: to.point.x + to.side * PORT_EXIT, y: to.point.y };

  const startIdx = nodeAt(grid, startPoint);
  const endIdx = nodeAt(grid, endPoint);
  const waypointIdxs = input.waypoints.map((p) => nodeAt(grid, p));

  const nodes: number[] = [startIdx];
  let current = startIdx;
  let dir = from.side > 0 ? 0 : 2;
  for (const target of [...waypointIdxs, endIdx]) {
    const segment = findPath(grid, current, dir, target);
    if (!segment) return [from.point, { x: to.point.x, y: from.point.y }, to.point];
    nodes.push(...segment.slice(1));
    if (segment.length > 1) dir = directionOf(grid, segment[segment.length - 2], segment[segment.length - 1]);
    current = target;
  }
  commitRoute(grid, nodes);

  const first = nodePoint(grid, startIdx);
  const last = nodePoint(grid, endIdx);
  return [
    from.point,
    { x: first.x, y: from.point.y },
    ...nodes.map((idx) => nodePoint(grid, idx)),
    { x: last.x, y: to.point.y },
    to.point,
  ];
}

function nodeAt(grid: Grid, p: RoutePoint): number {
  const col = clamp(Math.round((p.x - grid.originX) / GRID), 0, grid.cols - 1);
  const row = clamp(Math.round((p.y - grid.originY) / GRID), 0, grid.rows - 1);
  return row * grid.cols + col;
}

function nodePoint(grid: Grid, idx: number): RoutePoint {
  const col = idx % grid.cols;
  const row = (idx - col) / grid.cols;
  return { x: grid.originX + col * GRID, y: grid.originY + row * GRID };
}

function directionOf(grid: Grid, from: number, to: number): number {
  const diff = to - from;
  if (diff === 1) return 0;
  if (diff === grid.cols) return 1;
  if (diff === -1) return 2;
  return 3;
}

function heuristic(grid: Grid, idx: number, goalIdx: number): number {
  const col = idx % grid.cols;
  const row = (idx - col) / grid.cols;
  const goalCol = goalIdx % grid.cols;
  const goalRow = (goalIdx - goalCol) / grid.cols;
  return Math.abs(col - goalCol) + Math.abs(row - goalRow);
}

function findPath(grid: Grid, startIdx: number, startDir: number, goalIdx: number): number[] | null {
  const { cols, rows, blocked, occupied, near } = grid;
  const stateCount = cols * rows * 4;
  const best = new Float64Array(stateCount).fill(Infinity);
  const parent = new Int32Array(stateCount).fill(-1);
  const heap: HeapEntry[] = [];

  const startState = startIdx * 4 + startDir;
  best[startState] = 0;
  pushHeap(heap, { f: heuristic(grid, startIdx, goalIdx), g: 0, state: startState });

  while (heap.length > 0) {
    const { g, state } = popHeap(heap);
    if (g > best[state]) continue;
    const idx = state >> 2;
    const dir = state & 3;
    if (idx === goalIdx) return reconstruct(parent, state);

    const col = idx % cols;
    const row = (idx - col) / cols;
    for (let nd = 0; nd < 4; nd++) {
      if (nd === (dir + 2) % 4) continue;
      const nc = col + DIRS[nd].dc;
      const nr = row + DIRS[nd].dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const nIdx = nr * cols + nc;
      if (blocked[nIdx] && nIdx !== goalIdx && nIdx !== startIdx) continue;
      const step = 1 + (nd !== dir ? TURN_COST : 0) + occupied[nIdx] * OCCUPIED_COST + near[nIdx] * NEAR_COST;
      const ng = g + step;
      const nState = nIdx * 4 + nd;
      if (ng < best[nState]) {
        best[nState] = ng;
        parent[nState] = state;
        pushHeap(heap, { f: ng + heuristic(grid, nIdx, goalIdx), g: ng, state: nState });
      }
    }
  }
  return null;
}

function reconstruct(parent: Int32Array, state: number): number[] {
  const path: number[] = [];
  let s = state;
  while (s !== -1) {
    path.push(s >> 2);
    s = parent[s];
  }
  return path.reverse();
}

function commitRoute(grid: Grid, nodes: number[]) {
  for (const idx of nodes) {
    grid.occupied[idx] = 1;
    const col = idx % grid.cols;
    const row = (idx - col) / grid.cols;
    for (let dr = -NEAR_RADIUS; dr <= NEAR_RADIUS; dr++) {
      for (let dc = -NEAR_RADIUS; dc <= NEAR_RADIUS; dc++) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue;
        grid.near[nr * grid.cols + nc] = 1;
      }
    }
  }
}

function simplifyPolyline(points: RoutePoint[]): RoutePoint[] {
  const deduped: RoutePoint[] = [];
  for (const p of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || prev.x !== p.x || prev.y !== p.y) deduped.push(p);
  }
  const result: RoutePoint[] = [];
  for (let i = 0; i < deduped.length; i++) {
    const prev = deduped[i - 1];
    const next = deduped[i + 1];
    const p = deduped[i];
    if (prev && next && ((prev.x === p.x && p.x === next.x) || (prev.y === p.y && p.y === next.y))) continue;
    result.push(p);
  }
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pushHeap(heap: HeapEntry[], entry: HeapEntry) {
  heap.push(entry);
  let i = heap.length - 1;
  while (i > 0) {
    const parentIdx = (i - 1) >> 1;
    if (heap[parentIdx].f <= heap[i].f) break;
    [heap[parentIdx], heap[i]] = [heap[i], heap[parentIdx]];
    i = parentIdx;
  }
}

function popHeap(heap: HeapEntry[]): HeapEntry {
  const top = heap[0];
  const last = heap.pop() as HeapEntry;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < heap.length && heap[left].f < heap[smallest].f) smallest = left;
      if (right < heap.length && heap[right].f < heap[smallest].f) smallest = right;
      if (smallest === i) break;
      [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
      i = smallest;
    }
  }
  return top;
}
