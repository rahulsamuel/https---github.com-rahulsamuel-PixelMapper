import type { CableStyle } from "@/lib/signal-flow-types";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface CableHop {
  segment: number;
  distance: number;
}

export interface CableRoute {
  points: RoutePoint[];
  hops: CableHop[];
}

export const CORNER_RADIUS = 8;
export const HOP_RADIUS = 5;

export const CABLE_STYLE_OPTIONS: { value: CableStyle; label: string; description: string }[] = [
  { value: "curved", label: "Curved", description: "Smooth curved cables" },
  { value: "rounded-elbow", label: "Auto route", description: "Right-angle cables that go around devices, with rounded turns and hops over crossings" },
];

export function buildCurvedPath(from: RoutePoint, to: RoutePoint): string {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

export function elbowRoute(from: RoutePoint, to: RoutePoint): CableRoute {
  const midX = (from.x + to.x) / 2;
  return {
    points: [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to],
    hops: [],
  };
}

export function routeMidpoint(points: RoutePoint[]): RoutePoint {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = distance(points[i], points[i + 1]);
    lengths.push(len);
    total += len;
  }
  let remaining = total / 2;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] === 0 ? 0 : remaining / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}

export function buildRoutedPath(route: CableRoute): string {
  const { points, hops } = route;
  const last = points.length - 2;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let seg = 0; seg <= last; seg++) {
    const a = points[seg];
    const b = points[seg + 1];
    const dir = unit(a, b);
    const end = seg === last ? b : cornerEntry(points, seg + 1);

    const segmentHops = hops
      .filter((h) => h.segment === seg)
      .sort((h1, h2) => h1.distance - h2.distance);
    for (const hop of segmentHops) {
      const p = { x: a.x + dir.x * hop.distance, y: a.y + dir.y * hop.distance };
      const before = { x: p.x - dir.x * HOP_RADIUS, y: p.y - dir.y * HOP_RADIUS };
      const after = { x: p.x + dir.x * HOP_RADIUS, y: p.y + dir.y * HOP_RADIUS };
      const sweep = dir.x > 0 || dir.y > 0 ? 1 : 0;
      d += ` L ${before.x} ${before.y} A ${HOP_RADIUS} ${HOP_RADIUS} 0 0 ${sweep} ${after.x} ${after.y}`;
    }

    d += ` L ${end.x} ${end.y}`;
    if (seg < last) {
      const corner = points[seg + 1];
      const exit = cornerExit(points, seg + 1);
      d += ` Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`;
    }
  }
  return d;
}

function distance(a: RoutePoint, b: RoutePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function unit(from: RoutePoint, to: RoutePoint): RoutePoint {
  const len = distance(from, to);
  if (len === 0) return { x: 0, y: 0 };
  return { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
}

function cornerRadius(points: RoutePoint[], index: number): number {
  return Math.min(
    CORNER_RADIUS,
    distance(points[index - 1], points[index]) / 2,
    distance(points[index], points[index + 1]) / 2
  );
}

function cornerEntry(points: RoutePoint[], index: number): RoutePoint {
  const corner = points[index];
  const u = unit(corner, points[index - 1]);
  const r = cornerRadius(points, index);
  return { x: corner.x + u.x * r, y: corner.y + u.y * r };
}

function cornerExit(points: RoutePoint[], index: number): RoutePoint {
  const corner = points[index];
  const u = unit(corner, points[index + 1]);
  const r = cornerRadius(points, index);
  return { x: corner.x + u.x * r, y: corner.y + u.y * r };
}
