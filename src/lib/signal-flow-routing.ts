import type { CableStyle } from "@/lib/signal-flow-types";
import { routeOrthogonalCables } from "@/lib/signal-flow-cable-router";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RouteEndpoint {
  point: RoutePoint;
  side: 1 | -1;
}

export interface RouteObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CableRouteInput {
  id: string;
  from: RouteEndpoint;
  to: RouteEndpoint;
  bend?: RoutePoint;
}

export interface RoutedCable {
  d: string;
  midX: number;
  midY: number;
}

const ELBOW_CORNER_RADIUS = 14;

export const CABLE_STYLE_OPTIONS: { value: CableStyle; label: string; description: string }[] = [
  { value: "curved", label: "Curved", description: "Smooth curved cables" },
  { value: "rounded-elbow", label: "Rounded L", description: "Right-angle cables that route around devices" },
];

export function routeCables(
  inputs: CableRouteInput[],
  obstacles: RouteObstacle[],
  style: CableStyle
): Map<string, RoutedCable> {
  const routes = new Map<string, RoutedCable>();

  if (style === "curved") {
    for (const input of inputs) {
      routes.set(input.id, buildCablePath(input.from.point, input.to.point, "curved", input.bend));
    }
    return routes;
  }

  const polylines = routeOrthogonalCables(
    inputs.map((input) => ({
      id: input.id,
      from: input.from,
      to: input.to,
      waypoints: input.bend ? [input.bend] : [],
    })),
    obstacles
  );
  for (const [id, points] of polylines) {
    routes.set(id, {
      d: roundedPolylinePath(points, ELBOW_CORNER_RADIUS),
      ...polylineMidpoint(points),
    });
  }
  return routes;
}

export function buildCablePath(
  from: RoutePoint,
  to: RoutePoint,
  style: CableStyle,
  bend?: RoutePoint
): RoutedCable {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  if (style === "curved") {
    if (bend) {
      return {
        d: `${curveSegment(from, bend)} ${curveSegment(bend, to, false)}`,
        midX: bend.x,
        midY: bend.y,
      };
    }
    return {
      d: `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`,
      midX,
      midY,
    };
  }

  const points = [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  return { d: roundedPolylinePath(points, ELBOW_CORNER_RADIUS), midX, midY };
}

function curveSegment(a: RoutePoint, b: RoutePoint, startWithMove = true): string {
  const midX = (a.x + b.x) / 2;
  const body = `C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
  return startWithMove ? `M ${a.x} ${a.y} ${body}` : body;
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

function polylineMidpoint(points: RoutePoint[]): { midX: number; midY: number } {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  let remaining = total / 2;
  for (let i = 1; i < points.length; i++) {
    const segment = distance(points[i - 1], points[i]);
    if (remaining <= segment && segment > 0) {
      const p = pointTowards(points[i - 1], points[i], remaining);
      return { midX: p.x, midY: p.y };
    }
    remaining -= segment;
  }
  const last = points[points.length - 1];
  return { midX: last.x, midY: last.y };
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
