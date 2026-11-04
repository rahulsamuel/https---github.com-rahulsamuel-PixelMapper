"use client";

import { useRef, useState, type PointerEvent } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import type { ScreenDevice } from "@/contexts/pixel-map-types";
import type { DataPortAnchor } from "./wiring-diagram";

const PX_PER_MM = 0.5;
const CVT10_IMAGE = "/assets/images/equipment-previews/WhatsApp_Image_2026-11-04_at_2.34.23_PM.jpeg";
const PHYSICAL_MM: Record<string, { w: number; h: number }> = {
  CVT10: { w: 254.3, h: 50.6 },
};
const LINE_COLOR = "#a855f7";
const DEFAULT_X = 24;
const DEFAULT_Y = 24;
const ROW_GAP = 64;

type Point = { x: number; y: number };
type Drag = Point & { id: string };

function deviceSize(device: ScreenDevice) {
  const mm = PHYSICAL_MM[device.model];
  if (mm) return { w: mm.w * PX_PER_MM, h: mm.h * PX_PER_MM };
  return { w: Math.max(96, device.portCount * 12), h: 28 };
}

function portAnchor(anchors: DataPortAnchor[], device: ScreenDevice, port: number) {
  return device.role === "backup"
    ? anchors.find(a => a.backupLabel === `${port}B`)
    : anchors.find(a => a.dataLabel === String(port));
}

export function DeviceOverlay({ anchors, scale }: { anchors: DataPortAnchor[]; scale: number }) {
  const { devices, updateScreenDevice } = usePixelMap();
  const [live, setLive] = useState<Drag | null>(null);
  const liveRef = useRef<Drag | null>(null);
  const pointerStart = useRef<(Point & { px: number; py: number; id: string }) | null>(null);

  const positionOf = (device: ScreenDevice, index: number): Point => {
    if (live?.id === device.id) return live;
    return { x: device.x ?? DEFAULT_X, y: device.y ?? DEFAULT_Y + index * ROW_GAP };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>, device: ScreenDevice, origin: Point) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStart.current = { id: device.id, px: e.clientX, py: e.clientY, x: origin.x, y: origin.y };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (!start) return;
    const next: Drag = {
      id: start.id,
      x: start.x + (e.clientX - start.px) / scale,
      y: start.y + (e.clientY - start.py) / scale,
    };
    liveRef.current = next;
    setLive(next);
  };

  const handlePointerUp = () => {
    const finished = liveRef.current;
    if (finished) updateScreenDevice(finished.id, { x: finished.x, y: finished.y });
    liveRef.current = null;
    pointerStart.current = null;
    setLive(null);
  };

  return (
    <>
      <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
        {devices.map((device, index) => {
          const origin = positionOf(device, index);
          const size = deviceSize(device);
          return Array.from({ length: device.portCount }, (_, i) => i + 1).map(port => {
            const anchor = portAnchor(anchors, device, port);
            if (!anchor) return null;
            return (
              <line
                key={`${device.id}-${port}`}
                x1={anchor.x}
                y1={anchor.y}
                x2={origin.x + ((port - 0.5) * size.w) / device.portCount}
                y2={origin.y + size.h / 2}
                stroke={LINE_COLOR}
                strokeWidth={2}
              />
            );
          });
        })}
      </svg>

      {devices.map((device, index) => {
        const origin = positionOf(device, index);
        const size = deviceSize(device);
        return (
          <div
            key={device.id}
            onPointerDown={(e) => handlePointerDown(e, device, origin)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ left: origin.x, top: origin.y, width: size.w, height: size.h }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap text-xs font-medium text-foreground">{device.label}</span>
            {device.model === "CVT10" ? (
              <img src={CVT10_IMAGE} alt={device.label} draggable={false} className="size-full rounded-sm object-fill shadow-sm" />
            ) : (
              <div className="size-full rounded-sm border bg-muted" />
            )}
          </div>
        );
      })}
    </>
  );
}
