"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import {
  CONVERTER_PRESETS,
  DEVICE_PRESETS,
  type DevicePreset,
  type DeviceType,
  type SignalFlowPort,
} from "@/lib/signal-flow-types";
import type { TechDocDevice } from "@/lib/tech-doc-saves";

interface TechnicalDocumentDevicePickerProps {
  devices: TechDocDevice[];
  onChange: (devices: TechDocDevice[]) => void;
}

const DEVICE_TYPES = new Set<DeviceType>([
  "processor",
  "led-screen",
  "media-server",
  "power-supply",
  "network-switch",
  "matrix",
  "distribution",
  "converter",
  "custom",
]);

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `tech-doc-device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseDatabasePreset(row: Record<string, unknown>): DevicePreset | null {
  const type = row.device_type;
  const name = row.name;
  const color = row.color;
  const ports = row.ports;
  if (
    typeof type !== "string" || !DEVICE_TYPES.has(type as DeviceType) ||
    typeof name !== "string" || !name.trim() ||
    typeof color !== "string" ||
    !Array.isArray(ports)
  ) return null;

  const parsedPorts = ports.flatMap((port): Omit<SignalFlowPort, "id">[] => {
    if (!port || typeof port !== "object") return [];
    const value = port as Record<string, unknown>;
    if (
      typeof value.label !== "string" ||
      (value.direction !== "input" && value.direction !== "output") ||
      typeof value.portType !== "string"
    ) return [];
    return [{
      label: value.label,
      direction: value.direction,
      portType: value.portType,
    }];
  });
  if (parsedPorts.length === 0) return null;

  return {
    type: type as DeviceType,
    name: name.trim(),
    color,
    width: typeof row.width === "number" && Number.isFinite(row.width) ? row.width : 180,
    height: typeof row.height === "number" && Number.isFinite(row.height) ? row.height : 120,
    ports: parsedPorts,
  };
}

function toTechDocDevice(preset: DevicePreset): TechDocDevice {
  return {
    id: createId(),
    type: preset.type,
    name: preset.name,
    width: preset.width,
    height: preset.height,
    color: preset.color,
    ports: preset.ports.map((port) => ({ ...port, id: createId() })),
  };
}

export function TechnicalDocumentDevicePicker({ devices, onChange }: TechnicalDocumentDevicePickerProps) {
  const [databasePresets, setDatabasePresets] = useState<DevicePreset[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLibrary() {
      const { data, error } = await supabase
        .from("signal_flow_devices")
        .select("name, device_type, color, width, height, ports, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];
      setDatabasePresets(rows.flatMap((row) => {
        const preset = parseDatabasePreset(row);
        return preset ? [preset] : [];
      }));
      setLoading(false);
    }
    void loadLibrary();
    return () => { cancelled = true; };
  }, []);

  const library = useMemo(() => {
    const databaseKeys = new Set(databasePresets.map((preset) => `${preset.type}:${preset.name.trim().toLowerCase()}`));
    return [
      ...databasePresets,
      ...DEVICE_PRESETS,
      ...CONVERTER_PRESETS,
    ].filter((preset, index, presets) => {
      const key = `${preset.type}:${preset.name.trim().toLowerCase()}`;
      return !databaseKeys.has(key) || presets.findIndex((candidate) => `${candidate.type}:${candidate.name.trim().toLowerCase()}` === key) === index;
    });
  }, [databasePresets]);

  const addDevice = () => {
    const preset = library.find((candidate) => `${candidate.type}:${candidate.name}` === selectedKey);
    if (!preset) return;
    onChange([...devices, toTechDocDevice(preset)]);
    setSelectedKey("");
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">Signal Flow Devices</p>
          <p className="text-[11px] text-muted-foreground">Add device cards below this wiring image.</p>
        </div>
        {devices.length > 0 && <span className="text-[11px] text-muted-foreground">{devices.length} added</span>}
      </div>
      <div className="flex min-w-0 gap-1.5">
        <select
          value={selectedKey}
          onChange={(event) => setSelectedKey(event.target.value)}
          disabled={loading}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          aria-label="Choose a Signal Flow device"
        >
          <option value="">Choose a device...</option>
          {library.map((preset) => (
            <option key={`${preset.type}:${preset.name}`} value={`${preset.type}:${preset.name}`}>
              {preset.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={addDevice} disabled={!selectedKey || loading} aria-label="Add device">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {loadError && <p className="text-[11px] text-muted-foreground">Some database devices could not be loaded. Built-in devices are still available.</p>}
      {devices.length > 0 && (
        <div className="space-y-1">
          {devices.map((device) => (
            <div key={device.id} className="flex min-w-0 items-center gap-2 rounded border bg-background px-2 py-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: device.color }} />
              <span className="min-w-0 flex-1 truncate text-xs">{device.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{device.ports.length} ports</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onChange(devices.filter((candidate) => candidate.id !== device.id))} aria-label={`Remove ${device.name}`}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
