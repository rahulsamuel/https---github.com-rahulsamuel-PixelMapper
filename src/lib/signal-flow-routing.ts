import type { CableStyle } from "@/lib/signal-flow-types";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RoutedCable {
  d: string;
  midX: number;
  midY: number;
}

const ELBOW_CORNER_RADIUS = 14;

export const CABLE_STYLE_OPTIONS: { value: CableStyle; label: string; description: string }[] = [
  { value: "curved", label: "Curved", description: "Smooth curved cables" },
  { value: "rounded-elbow", label: "Rounded L", description: "Right-angle cables with rounded turns" },
];

export function buildCablePath(from: RoutePoint, to: RoutePoint, style: CableStyle): RoutedCable {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  if (style === "curved") {
    return {
      d: `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`,
      midX,
      midY,
    };
  }

  const points = [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  return { d: roundedPolylinePath(points, ELBOW_CORNER_RADIUS), midX, midY };
}

function distance(a: RoutePoint, b: RoutePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointTowards(from: RoutePoint, to: RoutePoint, amount: number): RoutePoint {
  const length = distance(from, to);
  return {
    x: from.x + ((to.x - from.x) * amount) / length,
    y: from.y + ((to.y - from.y) * amount) / length,
  };
}

function roundedPolylinePath(points: RoutePoint[], radius: number): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    const r = Math.min(radius, distance(prev, corner) / 2, distance(corner, next) / 2);
    if (r < 0.5) {
      d += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const before = pointTowards(corner, prev, r);
    const after = pointTowards(corner, next, r);
    d += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}
