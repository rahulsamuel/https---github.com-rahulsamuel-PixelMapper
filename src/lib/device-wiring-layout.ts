import type { ScreenDevice } from "@/contexts/pixel-map-types";
import type { DataPortAnchor } from "@/components/pixel-map/wiring-diagram";

export interface Point {
  x: number;
  y: number;
}

export interface PxPerMm {
  x: number;
  y: number;
}

export interface DeviceRoute {
  key: string;
  deviceId: string;
  deviceLabel: string;
  isBackup: boolean;
  port: number;
  dataLabel: string;
  path: Point[];
  lengthM: number;
}

const LANE_GAP = 3;
const SLACK_M = 1;
const PX_PER_MM = 0.5;
const PHYSICAL_MM: Record<string, { w: number; h: number }> = {
  CVT10: { w: 254.3, h: 50.6 },
  "XD Box": { w: 482.6, h: 88.5 },
};

export const BUILT_IN_DEVICE_IMAGES: Record<string, string> = {
  CVT10: "/assets/images/equipment-previews/WhatsApp_Image_2026-11-04_at_2.34.23_PM.jpeg",
};

export function deviceSize(device: ScreenDevice) {
  const mm = PHYSICAL_MM[device.model];
  if (mm) return { w: mm.w * PX_PER_MM, h: mm.h * PX_PER_MM };
  return { w: Math.max(96, device.portCount * 12), h: 28 };
}

export function portLabelOffsets(devices: ScreenDevice[]): Record<string, number> {
  const totals = { primary: 0, backup: 0 };
  const offsets: Record<string, number> = {};
  for (const device of devices) {
    const group = device.role === "backup" ? "backup" : "primary";
    offsets[device.id] = totals[group];
    totals[group] += device.portCount;
  }
  return offsets;
}

export function dataLabelFor(device: ScreenDevice, port: number, labelOffset: number) {
  const n = labelOffset + port;
  return device.role === "backup" ? `${n}B` : `${n}A`;
}

function findAnchor(anchors: DataPortAnchor[], device: ScreenDevice, label: string) {
  return anchors.find(a => (device.role === "backup" ? a.backupLabel : a.dataLabel) === label);
}

const roundOneDecimal = (m: number) => Math.round(m * 10) / 10;

export function buildDeviceRoutes({
  devices,
  origins,
  anchors,
  pxPerMm,
}: {
  devices: ScreenDevice[];
  origins: Record<string, Point>;
  anchors: DataPortAnchor[];
  pxPerMm: PxPerMm;
}): DeviceRoute[] {
  const offsets = portLabelOffsets(devices);
  return devices.flatMap(device => {
    const origin = origins[device.id];
    const size = deviceSize(device);
    return Array.from({ length: device.portCount }, (_, i) => i + 1).flatMap(port => {
      const label = dataLabelFor(device, port, offsets[device.id]);
      const anchor = findAnchor(anchors, device, label);
      if (!anchor) return [];
      const laneY = origin.y + size.h / 2 + (port - (device.portCount + 1) / 2) * LANE_GAP;
      const endX = origin.x + ((port - 0.5) * size.w) / device.portCount;
      const verticalM = Math.abs(laneY - anchor.y) / pxPerMm.y / 1000;
      const horizontalM = Math.abs(endX - anchor.x) / pxPerMm.x / 1000;
      return [{
        key: `${device.id}-${port}`,
        deviceId: device.id,
        deviceLabel: device.label,
        isBackup: device.role === "backup",
        port,
        dataLabel: label,
        path: [
          { x: anchor.x, y: anchor.y },
          { x: anchor.x, y: laneY },
          { x: endX, y: laneY },
        ],
        lengthM: roundOneDecimal(verticalM + horizontalM + SLACK_M),
      }];
    });
  });
}
