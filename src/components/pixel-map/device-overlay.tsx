"use client";

import type { PointerEvent } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { deviceSize, type DeviceRoute, type Point } from "@/lib/device-wiring-layout";

const DEVICE_IMAGES: Record<string, string> = {
  CVT10: "/assets/images/equipment-previews/WhatsApp_Image_2026-11-04_at_2.34.23_PM.jpeg",
  "XD Box": "/assets/images/equipment-previews/XD_BOX.jpg",
};
const LINE_COLOR = "#a855f7";
const LINE_WIDTH = 4;

interface DeviceOverlayProps {
  origins: Record<string, Point>;
  routes: DeviceRoute[];
  onDragStart: (e: PointerEvent<HTMLDivElement>, deviceId: string) => void;
  onDragMove: (e: PointerEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

export function DeviceOverlay({ origins, routes, onDragStart, onDragMove, onDragEnd }: DeviceOverlayProps) {
  const { devices } = usePixelMap();

  return (
    <>
      <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
        {routes.map(route => (
          <polyline
            key={route.key}
            points={route.path.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={LINE_WIDTH}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {devices.map(device => {
        const origin = origins[device.id];
        const size = deviceSize(device);
        return (
          <div
            key={device.id}
            onPointerDown={e => onDragStart(e, device.id)}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ left: origin.x, top: origin.y, width: size.w, height: size.h }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap text-xs font-medium text-foreground">{device.label}</span>
            {DEVICE_IMAGES[device.model] ? (
              <img src={DEVICE_IMAGES[device.model]} alt={device.label} draggable={false} className="size-full rounded-sm object-fill shadow-sm" />
            ) : (
              <div className="size-full rounded-sm border bg-muted" />
            )}
          </div>
        );
      })}
    </>
  );
}
