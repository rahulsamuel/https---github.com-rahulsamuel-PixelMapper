import {
  CORNER_RADIUS,
  HOP_RADIUS,
  elbowRoute,
  type CableRoute,
  type RoutePoint,
} from "@/lib/signal-flow-routing";

export interface RouteObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RouteAnchor extends RoutePoint {
  dir: 1 | -1;
}

export interface RouteRequest {
  id: string;
  from: RouteAnchor;
  to: RouteAnchor;
}

const GRID = 14;
const PAD = 56;
const STUB = 24;
const OBSTACLE_MARGIN = GRID;
const NEAR_OBSTACLE_BAND = 2;
const TURN_COST = 6;
const OVERLAP_COST = 60;
const CROSSING_COST = 14;
const NEAR_OBSTACLE_COST = 3;
const HOP_CLEARANCE = CORNER_RADIUS + HOP_RADIUS + 2;
const NO_DIR = 4;
const DX = [1, -1, 0, 0];
const DY = [0, 0, -1, 1];

interface Grid {
  width: number;
  height: number;
  blocked: Uint8Array;
  nearObstacle: Uint8Array;
  usedH: Uint8Array;
  usedV: Uint8Array;
}

interface Segment {
  a: RoutePoint;
  b: RoutePoint;
  horizontal: boolean;
  index: number;
}

export function routeCables(obstacles: RouteObstacle[], requests: RouteRequest[]): Map<string, CableRoute> {
  if (requests.length === 0) return new Map();
  const grid = createGrid(obstacles, requests);
  const entries = requests.map((req) => ({ id: req.id, route: routeRequest(grid, req) }));
  addCrossingHops(entries.map((e) => e.route));
  return new Map(entries.map((e) => [e.id, e.route]));
}

function toIndex(world: number): number {
  return Math.round((world + PAD) / GRID);
}

function toWorld(index: number): number {
  return index * GRID - PAD;
}

function createGrid(obstacles: RouteObstacle[], requests: RouteRequest[]): Grid {
  const xs = [...obstacles.map((o) => o.x + o.width), ...requests.flatMap((r) => [r.from.x, r.to.x])];
  const ys = [...obstacles.map((o) => o.y + o.height), ...requests.flatMap((r) => [r.from.y, r.to.y])];
  const width = toIndex(Math.max(0, ...xs) + PAD) + 2;
  const height = toIndex(Math.max(0, ...ys) + PAD) + 2;
  const blocked = new Uint8Array(width * height);

  for (let gy = 0; gy < height; gy++) {
    for (let gx = 0; gx < width; gx++) {
      const wx = toWorld(gx);
      const wy = toWorld(gy);
      const hit = obstacles.some(
        (o) =>
          wx > o.x - OBSTACLE_MARGIN &&
          wx < o.x + o.width + OBSTACLE_MARGIN &&
          wy > o.y - OBSTACLE_MARGIN &&
          wy < o.y + o.height + OBSTACLE_MARGIN
      );
      if (hit) blocked[gy * width + gx] = 1;
    }
  }

  return {
    width,
    height,
    blocked,
    nearObstacle: markNearObstacles(blocked, width, height),
    usedH: new Uint8Array(width * height),
    usedV: new Uint8Array(width * height),
  };
}

function markNearObstacles(blocked: Uint8Array, width: number, height: number): Uint8Array {
  const near = new Uint8Array(width * height);
  for (let gy = 0; gy < height; gy++) {
    for (let gx = 0; gx < width; gx++) {
      if (!blocked[gy * width + gx]) continue;
      for (let dy = -NEAR_OBSTACLE_BAND; dy <= NEAR_OBSTACLE_BAND; dy++) {
        for (let dx = -NEAR_OBSTACLE_BAND; dx <= NEAR_OBSTACLE_BAND; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          near[ny * width + nx] = 1;
        }
      }
    }
  }
  return near;
}

function routeRequest(grid: Grid, req: RouteRequest): CableRoute {
  const start = {
    x: toIndex(req.from.x + req.from.dir * STUB),
    y: toIndex(req.from.y),
  };
  const goal = {
    x: toIndex(req.to.x + req.to.dir * STUB),
    y: toIndex(req.to.y),
  };
  const fallback = elbowRoute(req.from, req.to);
  const startIdx = start.y * grid.width + start.x;
  const goalIdx = goal.y * grid.width + goal.x;
  if (grid.blocked[startIdx] || grid.blocked[goalIdx]) return fallback;

  const nodes = findGridPath(grid, startIdx, goalIdx);
  if (!nodes) return fallback;

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const edge = Math.min(a, b);
    if (Math.abs(b - a) === 1) grid.usedH[edge] = 1;
    else grid.usedV[edge] = 1;
  }

  const gridPoints = nodes.map((n) => ({
    x: toWorld(n % grid.width),
    y: toWorld(Math.floor(n / grid.width)),
  }));
  const first = gridPoints[0];
  const lastPoint = gridPoints[gridPoints.length - 1];
  return {
    points: simplifyPolyline([
      req.from,
      { x: first.x, y: req.from.y },
      ...gridPoints,
      { x: lastPoint.x, y: req.to.y },
      req.to,
    ]),
    hops: [],
  };
}

function trafficVertical(grid: Grid, idx: number): boolean {
  return grid.usedV[idx] === 1 || (idx >= grid.width && grid.usedV[idx - grid.width] === 1);
}

function trafficHorizontal(grid: Grid, idx: number): boolean {
  return grid.usedH[idx] === 1 || (idx % grid.width > 0 && grid.usedH[idx - 1] === 1);
}

function findGridPath(grid: Grid, startIdx: number, goalIdx: number): number[] | null {
  const w = grid.width;
  const goalX = goalIdx % w;
  const goalY = Math.floor(goalIdx / w);
  const stateCount = grid.width * grid.height * 5;
  const gScore = new Float64Array(stateCount).fill(Infinity);
  const parent = new Int32Array(stateCount).fill(-1);
  const closed = new Uint8Array(stateCount);
  const open = new MinHeap();
  const heuristic = (node: number) =>
    Math.abs((node % w) - goalX) + Math.abs(Math.floor(node / w) - goalY);

  const startState = startIdx * 5 + NO_DIR;
  gScore[startState] = 0;
  open.push(heuristic(startIdx), startState);

  while (open.size > 0) {
    const state = open.pop();
    if (closed[state]) continue;
    closed[state] = 1;

    const node = Math.floor(state / 5);
    const dir = state % 5;
    if (node === goalIdx) return reconstruct(state, parent);

    const gx = node % w;
    const gy = Math.floor(node / w);
    for (let nd = 0; nd < 4; nd++) {
      if (dir !== NO_DIR && nd === (dir ^ 1)) continue;
      const nx = gx + DX[nd];
      const ny = gy + DY[nd];
      if (nx < 0 || ny < 0 || nx >= w || ny >= grid.height) continue;
      const next = ny * w + nx;
      if (grid.blocked[next]) continue;

      let cost = 1;
      if (dir !== NO_DIR && nd !== dir) cost += TURN_COST;
      if (grid.nearObstacle[next]) cost += NEAR_OBSTACLE_COST;
      const edge = Math.min(node, next);
      if (DX[nd] !== 0) {
        if (grid.usedH[edge]) cost += OVERLAP_COST;
        if (trafficVertical(grid, next)) cost += CROSSING_COST;
      } else {
        if (grid.usedV[edge]) cost += OVERLAP_COST;
        if (trafficHorizontal(grid, next)) cost += CROSSING_COST;
      }

      const nextState = next * 5 + nd;
      const nextG = gScore[state] + cost;
      if (nextG < gScore[nextState]) {
        gScore[nextState] = nextG;
        parent[nextState] = state;
        open.push(nextG + Math.abs(nx - goalX) + Math.abs(ny - goalY), nextState);
      }
    }
  }
  return null;
}

function reconstruct(endState: number, parent: Int32Array): number[] {
  const nodes: number[] = [];
  let state = endState;
  while (state !== -1) {
    nodes.push(Math.floor(state / 5));
    state = parent[state];
  }
  return nodes.reverse();
}

function simplifyPolyline(points: RoutePoint[]): RoutePoint[] {
  const distinct: RoutePoint[] = [];
  for (const p of points) {
    const prev = distinct[distinct.length - 1];
    if (prev && Math.abs(prev.x - p.x) < 1e-6 && Math.abs(prev.y - p.y) < 1e-6) continue;
    distinct.push(p);
  }
  const result: RoutePoint[] = [distinct[0]];
  for (let i = 1; i < distinct.length - 1; i++) {
    const a = result[result.length - 1];
    const b = distinct[i];
    const c = distinct[i + 1];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-6) continue;
    result.push(b);
  }
  result.push(distinct[distinct.length - 1]);
  return result;
}

function segmentsOf(points: RoutePoint[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      a: points[i],
      b: points[i + 1],
      horizontal: Math.abs(points[i].y - points[i + 1].y) < 1e-6,
      index: i,
    });
  }
  return segments;
}

function addCrossingHops(routes: CableRoute[]) {
  const segmentLists = routes.map((r) => segmentsOf(r.points));
  routes.forEach((route, j) => {
    for (let i = 0; i < j; i++) {
      for (const sj of segmentLists[j]) {
        for (const si of segmentLists[i]) {
          if (sj.horizontal === si.horizontal) continue;
          const hop = crossingOf(sj, si);
          if (!hop) continue;
          const dir = sj.horizontal ? Math.sign(sj.b.x - sj.a.x) : Math.sign(sj.b.y - sj.a.y);
          const distance = sj.horizontal ? (hop.x - sj.a.x) * dir : (hop.y - sj.a.y) * dir;
          route.hops.push({ segment: sj.index, distance });
        }
      }
    }
  });
}

function crossingOf(h: Segment, v: Segment): RoutePoint | null {
  const horizontal = h.horizontal ? h : v;
  const vertical = h.horizontal ? v : h;
  const x = vertical.a.x;
  const y = horizontal.a.y;
  const hMin = Math.min(horizontal.a.x, horizontal.b.x);
  const hMax = Math.max(horizontal.a.x, horizontal.b.x);
  const vMin = Math.min(vertical.a.y, vertical.b.y);
  const vMax = Math.max(vertical.a.y, vertical.b.y);
  if (x - hMin < HOP_CLEARANCE || hMax - x < HOP_CLEARANCE) return null;
  if (y - vMin < HOP_CLEARANCE || vMax - y < HOP_CLEARANCE) return null;
  return { x, y };
}

class MinHeap {
  private keys: number[] = [];
  private values: number[] = [];

  get size(): number {
    return this.keys.length;
  }

  push(key: number, value: number) {
    this.keys.push(key);
    this.values.push(value);
    let i = this.keys.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= this.keys[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number {
    const top = this.values[0];
    const lastKey = this.keys.pop()!;
    const lastValue = this.values.pop()!;
    if (this.keys.length > 0) {
      this.keys[0] = lastKey;
      this.values[0] = lastValue;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.keys.length && this.keys[left] < this.keys[smallest]) smallest = left;
        if (right < this.keys.length && this.keys[right] < this.keys[smallest]) smallest = right;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number) {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.values[a], this.values[b]] = [this.values[b], this.values[a]];
  }
}
