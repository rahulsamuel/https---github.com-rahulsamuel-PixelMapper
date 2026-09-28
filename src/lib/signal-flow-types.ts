export type DeviceType =
  | "processor"
  | "led-screen"
  | "media-server"
  | "power-supply"
  | "network-switch"
  | "matrix"
  | "distribution"
  | "custom";

export type DeviceCategory =
  | "processor"
  | "media-server"
  | "led-screen"
  | "power"
  | "network"
  | "other";

export const CATEGORY_INFO: Record<DeviceCategory, { label: string; color: string }> = {
  processor: { label: "LED Processors", color: "#1e3a5f" },
  "media-server": { label: "Media Servers", color: "#7c2d12" },
  "led-screen": { label: "LED Screens", color: "#0d9488" },
  power: { label: "Power", color: "#b45309" },
  network: { label: "Network", color: "#1e40af" },
  other: { label: "Other", color: "#475569" },
};

export const PRESET_CATEGORY_MAP: Record<DeviceType, DeviceCategory> = {
  processor: "processor",
  "media-server": "media-server",
  "led-screen": "led-screen",
  "power-supply": "power",
  "network-switch": "network",
  matrix: "other",
  distribution: "other",
  custom: "other",
};

export type PortDirection = "input" | "output";

export interface SignalFlowPort {
  id: string;
  label: string;
  direction: PortDirection;
  portType: string; // cable type id
}

export interface SignalFlowDevice {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  ports: SignalFlowPort[];
}

export interface SignalFlowConnection {
  id: string;
  fromDeviceId: string;
  fromPortId: string;
  toDeviceId: string;
  toPortId: string;
  cableType: string;
  label: string;
}

export interface CableType {
  id: string;
  name: string;
  color: string;
}

export interface SignalFlowData {
  devices: SignalFlowDevice[];
  connections: SignalFlowConnection[];
  cableTypes: CableType[];
}

export const DEFAULT_CABLE_TYPES: CableType[] = [
  { id: "hdmi", name: "HDMI", color: "#ef4444" },
  { id: "sdi", name: "SDI", color: "#3b82f6" },
  { id: "rj45", name: "RJ45 / Ethernet", color: "#10b981" },
  { id: "dvi", name: "DVI", color: "#f59e0b" },
  { id: "fiber", name: "Fiber", color: "#06b6d4" },
  { id: "power", name: "Power", color: "#f97316" },
  { id: "custom", name: "Custom", color: "#64748b" },
];

export interface DevicePreset {
  type: DeviceType;
  name: string;
  color: string;
  width: number;
  height: number;
  ports: Omit<SignalFlowPort, "id">[];
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    type: "processor",
    name: "LED Processor",
    color: "#1e3a5f",
    width: 200,
    height: 160,
    ports: [
      { label: "HDMI IN 1", direction: "input", portType: "hdmi" },
      { label: "HDMI IN 2", direction: "input", portType: "hdmi" },
      { label: "SDI IN", direction: "input", portType: "sdi" },
      { label: "OUT 1", direction: "output", portType: "rj45" },
      { label: "OUT 2", direction: "output", portType: "rj45" },
      { label: "OUT 3", direction: "output", portType: "rj45" },
      { label: "OUT 4", direction: "output", portType: "rj45" },
    ],
  },
  {
    type: "led-screen",
    name: "LED Screen",
    color: "#0d9488",
    width: 180,
    height: 120,
    ports: [
      { label: "DATA IN", direction: "input", portType: "rj45" },
      { label: "DATA OUT", direction: "output", portType: "rj45" },
      { label: "POWER IN", direction: "input", portType: "power" },
    ],
  },
  {
    type: "media-server",
    name: "Media Server",
    color: "#7c2d12",
    width: 180,
    height: 130,
    ports: [
      { label: "OUT 1", direction: "output", portType: "hdmi" },
      { label: "OUT 2", direction: "output", portType: "sdi" },
    ],
  },
  {
    type: "power-supply",
    name: "Power Supply",
    color: "#b45309",
    width: 160,
    height: 140,
    ports: [
      { label: "CH 1", direction: "output", portType: "power" },
      { label: "CH 2", direction: "output", portType: "power" },
      { label: "CH 3", direction: "output", portType: "power" },
      { label: "CH 4", direction: "output", portType: "power" },
    ],
  },
  {
    type: "network-switch",
    name: "Network Switch",
    color: "#1e40af",
    width: 200,
    height: 150,
    ports: [
      { label: "PORT 1", direction: "input", portType: "rj45" },
      { label: "PORT 2", direction: "input", portType: "rj45" },
      { label: "PORT 3", direction: "output", portType: "rj45" },
      { label: "PORT 4", direction: "output", portType: "rj45" },
      { label: "PORT 5", direction: "output", portType: "rj45" },
      { label: "PORT 6", direction: "output", portType: "rj45" },
    ],
  },
  {
    type: "matrix",
    name: "Matrix Router",
    color: "#581c87",
    width: 200,
    height: 180,
    ports: [
      { label: "IN 1", direction: "input", portType: "hdmi" },
      { label: "IN 2", direction: "input", portType: "hdmi" },
      { label: "IN 3", direction: "input", portType: "sdi" },
      { label: "IN 4", direction: "input", portType: "sdi" },
      { label: "OUT 1", direction: "output", portType: "hdmi" },
      { label: "OUT 2", direction: "output", portType: "hdmi" },
      { label: "OUT 3", direction: "output", portType: "sdi" },
      { label: "OUT 4", direction: "output", portType: "sdi" },
    ],
  },
  {
    type: "distribution",
    name: "Distribution Box",
    color: "#0f766e",
    width: 160,
    height: 120,
    ports: [
      { label: "IN", direction: "input", portType: "rj45" },
      { label: "OUT 1", direction: "output", portType: "rj45" },
      { label: "OUT 2", direction: "output", portType: "rj45" },
      { label: "OUT 3", direction: "output", portType: "rj45" },
      { label: "OUT 4", direction: "output", portType: "rj45" },
    ],
  },
  {
    type: "custom",
    name: "Custom Device",
    color: "#475569",
    width: 160,
    height: 100,
    ports: [
      { label: "IN", direction: "input", portType: "custom" },
      { label: "OUT", direction: "output", portType: "custom" },
    ],
  },
];

export function processorToDevicePreset(
  manufacturer: string,
  modelName: string,
  outputPortCount: number,
  inputTypes?: string | null
): DevicePreset {
  const inputs: Omit<SignalFlowPort, "id">[] = [];
  if (inputTypes) {
    const types = inputTypes.split(",").map((t) => t.trim()).filter(Boolean);
    for (const t of types) {
      const lower = t.toLowerCase();
      const portType = lower.includes("hdmi") ? "hdmi" : lower.includes("sdi") ? "sdi" : lower.includes("dvi") ? "dvi" : lower.includes("fiber") ? "fiber" : "custom";
      inputs.push({ label: t.toUpperCase(), direction: "input", portType });
    }
  }
  if (inputs.length === 0) {
    inputs.push({ label: "HDMI IN", direction: "input", portType: "hdmi" });
    inputs.push({ label: "SDI IN", direction: "input", portType: "sdi" });
  }

  const outputCount = Math.max(1, outputPortCount);
  const outputs: Omit<SignalFlowPort, "id">[] = [];
  for (let i = 1; i <= outputCount; i++) {
    outputs.push({ label: `OUT ${i}`, direction: "output", portType: "rj45" });
  }

  const portCount = inputs.length + outputs.length;
  const height = Math.max(120, 34 + 36 + portCount * 22);

  return {
    type: "processor",
    name: `${manufacturer} ${modelName}`.trim(),
    color: "#1e3a5f",
    width: 200,
    height,
    ports: [...inputs, ...outputs],
  };
}

export function customDevicePreset(
  name: string,
  ports: Omit<SignalFlowPort, "id">[]
): DevicePreset {
  const height = Math.max(100, 34 + 36 + ports.length * 22);
  return {
    type: "custom",
    name: name || "Custom Device",
    color: "#475569",
    width: 180,
    height,
    ports: ports.length > 0 ? ports : [
      { label: "IN", direction: "input", portType: "custom" },
      { label: "OUT", direction: "output", portType: "custom" },
    ],
  };
}
