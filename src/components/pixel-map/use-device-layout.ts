"use client";

import { useRef, useState, type PointerEvent } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import type { Point } from "@/lib/device-wiring-layout";

const DEFAULT_X = 24;
const DEFAULT_Y = 24;
const ROW_GAP = 64;

type Drag = Point & { id: string };
type DragStart = Point & { id: string; px: number; py: number };

export function useDeviceLayout(scale: number) {
  const { devices, updateScreenDevice } = usePixelMap();
  const [live, setLive] = useState<Drag | null>(null);
  const liveRef = useRef<Drag | null>(null);
  const dragStart = useRef<DragStart | null>(null);

  const origins: Record<string, Point> = {};
  devices.forEach((device, index) => {
    origins[device.id] = live?.id === device.id
      ? live
      : { x: device.x ?? DEFAULT_X, y: device.y ?? DEFAULT_Y + index * ROW_GAP };
  });

  const onDragStart = (e: PointerEvent<HTMLDivElement>, deviceId: string) => {
    const origin = origins[deviceId];
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { id: deviceId, px: e.clientX, py: e.clientY, x: origin.x, y: origin.y };
  };

  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    const next: Drag = {
      id: start.id,
      x: start.x + (e.clientX - start.px) / scale,
      y: start.y + (e.clientY - start.py) / scale,
    };
    liveRef.current = next;
    setLive(next);
  };

  const onDragEnd = () => {
    const finished = liveRef.current;
    if (finished) updateScreenDevice(finished.id, { x: finished.x, y: finished.y });
    liveRef.current = null;
    dragStart.current = null;
    setLive(null);
  };

  return { origins, onDragStart, onDragMove, onDragEnd };
}
