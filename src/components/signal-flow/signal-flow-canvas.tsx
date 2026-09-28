"use client";

import { useState, useRef, useCallback, useEffect, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import {
  DEVICE_PRESETS,
  CONVERTER_PRESETS,
  CATEGORY_INFO,
  PRESET_CATEGORY_MAP,
  CABLE_TYPE_NAMES,
  checkPortCompatibility,
  processorToDevicePreset,
  customDevicePreset,
  type SignalFlowDevice,
  type SignalFlowConnection,
  type SignalFlowData,
  type DeviceCategory,
  type DevicePreset,
  type DeviceType,
  type PortDirection,
  type SignalFlowPort,
} from "@/lib/signal-flow-types";
import { useAuth } from "@/contexts/auth-context";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Cpu,
  AlertTriangle,
} from "lucide-react";

interface SignalFlowCanvasProps {
  data: SignalFlowData;
  onChange: (data: SignalFlowData) => void;
  onSave: () => void;
  saving: boolean;
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // not in secure context — fall through
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDeviceFromPreset(preset: DevicePreset, x: number, y: number): SignalFlowDevice {
  return {
    id: uid(),
    type: preset.type,
    name: preset.name,
    x,
    y,
    width: preset.width,
    height: preset.height,
    color: preset.color,
    ports: preset.ports.map((p) => ({ ...p, id: uid() })),
  };
}

const PORT_RADIUS = 5;
const PORT_SPACING_Y = 22;
const PORT_START_Y = 36;
const DEVICE_HEADER_HEIGHT = 34;

function getAllPortPositions(device: SignalFlowDevice) {
  const inputs = device.ports.filter((p) => p.direction === "input");
  const outputs = device.ports.filter((p) => p.direction === "output");
  return {
    inputs: inputs.map((p, i) => ({
      port: p,
      x: device.x,
      y: device.y + DEVICE_HEADER_HEIGHT + PORT_START_Y + i * PORT_SPACING_Y,
    })),
    outputs: outputs.map((p, i) => ({
      port: p,
      x: device.x + device.width,
      y: device.y + DEVICE_HEADER_HEIGHT + PORT_START_Y + i * PORT_SPACING_Y,
    })),
  };
}

interface SidebarItem {
  preset: DevicePreset;
  source: "default" | "database";
}

function groupPresetsByCategory(items: SidebarItem[]): Record<DeviceCategory, SidebarItem[]> {
  const groups: Record<DeviceCategory, SidebarItem[]> = {
    processor: [],
    "media-server": [],
    "led-screen": [],
    converter: [],
    power: [],
    network: [],
    other: [],
  };
  for (const item of items) {
    const cat = PRESET_CATEGORY_MAP[item.preset.type] ?? "other";
    groups[cat].push(item);
  }
  return groups;
}

const CATEGORY_ORDER: DeviceCategory[] = [
  "processor",
  "media-server",
  "led-screen",
  "converter",
  "power",
  "network",
  "other",
];

export function SignalFlowCanvas({ data, onChange, onSave, saving }: SignalFlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [draggingDevice, setDraggingDevice] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<{
    deviceId: string;
    portId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<DeviceCategory>>(new Set());
  const [dbProcessors, setDbProcessors] = useState<SidebarItem[]>([]);
  const [dbDevices, setDbDevices] = useState<SidebarItem[]>([]);
  const [loadingProcessors, setLoadingProcessors] = useState(true);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [compatError, setCompatError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  // Load processors + signal flow devices from database
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingProcessors(true);
      try {
        // Load processor_library
        const { data: procRows, error: procErr } = await supabase
          .from("processor_library")
          .select("manufacturer, model_name, output_port_count, input_types, is_active")
          .eq("is_active", true)
          .order("manufacturer", { ascending: true });

        if (cancelled) return;
        if (!procErr && procRows && procRows.length > 0) {
          const procItems: SidebarItem[] = (procRows as Record<string, unknown>[]).map((row) => ({
            source: "database" as const,
            preset: processorToDevicePreset(
              row.manufacturer as string,
              row.model_name as string,
              Number(row.output_port_count) || 4,
              (row.input_types as string) || null
            ),
          }));
          setDbProcessors(procItems);
        }

        // Load signal_flow_devices (admin-managed library)
        const { data: devRows, error: devErr } = await supabase
          .from("signal_flow_devices")
          .select("name, device_type, category, color, width, height, ports, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (cancelled) return;
        if (!devErr && devRows && devRows.length > 0) {
          const devItems: SidebarItem[] = (devRows as Record<string, unknown>[]).map((row) => ({
            source: "database" as const,
            preset: {
              type: row.device_type as DeviceType,
              name: row.name as string,
              color: row.color as string,
              width: Number(row.width) || 180,
              height: Number(row.height) || 120,
              ports: (row.ports as Omit<SignalFlowPort, "id">[]) ?? [],
            },
          }));
          setDbDevices(devItems);
        }
      } catch {
        // ignore — defaults still available
      } finally {
        if (!cancelled) setLoadingProcessors(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Build the full sidebar item list: DB processors + DB devices + default presets + converter presets
  // DB devices take priority over converter presets (dedup converters by name)
  const dbConverterNames = new Set(dbDevices.filter((d) => d.preset.type === "converter").map((d) => d.preset.name));
  const sidebarItems: SidebarItem[] = [
    ...dbProcessors,
    ...dbDevices,
    ...DEVICE_PRESETS
      .filter((p) => {
        if (p.type !== "processor") return true;
        // Only include default "LED Processor" if no DB processors loaded
        return dbProcessors.length === 0;
      })
      .map((p) => ({ preset: p, source: "default" as const })),
    ...CONVERTER_PRESETS
      .filter((p) => !dbConverterNames.has(p.name))
      .map((p) => ({ preset: p, source: "default" as const })),
  ];

  const groupedItems = groupPresetsByCategory(sidebarItems);

  const update = useCallback(
    (updater: (prev: SignalFlowData) => SignalFlowData) => {
      onChange(updater(data));
    },
    [data, onChange]
  );

  // Place a device in the center of the visible canvas
  const placeDeviceInCenter = useCallback(
    (preset: DevicePreset) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;
      const visibleCenterX = scrollLeft + rect.width / 2;
      const visibleCenterY = scrollTop + rect.height / 2;
      const x = visibleCenterX - preset.width / 2;
      const y = visibleCenterY - preset.height / 2;
      const newDevice = createDeviceFromPreset(preset, Math.max(0, x), Math.max(0, y));
      update((prev) => ({ ...prev, devices: [...prev.devices, newDevice] }));
      setSelectedDeviceId(newDevice.id);
      setSelectedConnectionId(null);
    },
    [update]
  );

  // Handle device dragging
  useEffect(() => {
    if (!draggingDevice) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      update((prev) => ({
        ...prev,
        devices: prev.devices.map((d) =>
          d.id === draggingDevice ? { ...d, x: Math.max(0, x), y: Math.max(0, y) } : d
        ),
      }));
    };
    const handleUp = () => setDraggingDevice(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggingDevice, dragOffset, update]);

  // Track mouse for cable drawing
  useEffect(() => {
    if (!connectingFrom) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, [connectingFrom]);

  const handleCanvasClick = (e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedDeviceId(null);
      setSelectedConnectionId(null);
      setConnectingFrom(null);
    }
  };

  const handleDeviceMouseDown = (e: MouseEvent, device: SignalFlowDevice) => {
    if (connectingFrom) return;
    e.stopPropagation();
    setSelectedDeviceId(device.id);
    setSelectedConnectionId(null);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - device.x,
      y: e.clientY - rect.top - device.y,
    });
    setDraggingDevice(device.id);
  };

  const handlePortClick = (
    e: MouseEvent,
    device: SignalFlowDevice,
    portId: string,
    portX: number,
    portY: number
  ) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom.deviceId === device.id && connectingFrom.portId === portId) {
        setConnectingFrom(null);
        return;
      }
      const fromDevice = data.devices.find((d) => d.id === connectingFrom.deviceId);
      const fromPort = fromDevice?.ports.find((p) => p.id === connectingFrom.portId);
      const toPort = device.ports.find((p) => p.id === portId);
      if (!fromPort || !toPort) {
        setConnectingFrom(null);
        return;
      }
      // Check port compatibility before creating connection
      const compat = checkPortCompatibility(fromPort, toPort);
      if (!compat.ok) {
        setCompatError(compat.reason);
        setConnectingFrom(null);
        return;
      }
      const cableType = fromPort.direction === "output" ? fromPort.portType : toPort.portType;
      const newConn: SignalFlowConnection = {
        id: uid(),
        fromDeviceId: connectingFrom.deviceId,
        fromPortId: connectingFrom.portId,
        toDeviceId: device.id,
        toPortId: portId,
        cableType,
        label: "",
      };
      update((prev) => ({ ...prev, connections: [...prev.connections, newConn] }));
      setConnectingFrom(null);
    } else {
      setConnectingFrom({ deviceId: device.id, portId, x: portX, y: portY });
    }
  };

  const handleConnectionClick = (e: MouseEvent, connId: string) => {
    e.stopPropagation();
    setSelectedConnectionId(connId);
    setSelectedDeviceId(null);
  };

  const deleteSelected = () => {
    if (selectedDeviceId) {
      update((prev) => ({
        ...prev,
        devices: prev.devices.filter((d) => d.id !== selectedDeviceId),
        connections: prev.connections.filter(
          (c) => c.fromDeviceId !== selectedDeviceId && c.toDeviceId !== selectedDeviceId
        ),
      }));
      setSelectedDeviceId(null);
    }
    if (selectedConnectionId) {
      update((prev) => ({
        ...prev,
        connections: prev.connections.filter((c) => c.id !== selectedConnectionId),
      }));
      setSelectedConnectionId(null);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectingFrom(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && (selectedDeviceId || selectedConnectionId)) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedDeviceId, selectedConnectionId]);

  const renameDevice = (deviceId: string, name: string) => {
    update((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => (d.id === deviceId ? { ...d, name } : d)),
    }));
  };

  const getCableColor = (cableTypeId: string) => {
    const ct = data.cableTypes.find((c) => c.id === cableTypeId);
    return ct?.color ?? "#64748b";
  };

  const getCableName = (cableTypeId: string) => {
    const ct = data.cableTypes.find((c) => c.id === cableTypeId);
    return ct?.name ?? "Custom";
  };

  const getConnPath = (conn: SignalFlowConnection) => {
    const fromDevice = data.devices.find((d) => d.id === conn.fromDeviceId);
    const toDevice = data.devices.find((d) => d.id === conn.toDeviceId);
    if (!fromDevice || !toDevice) return null;
    const fromPort = fromDevice.ports.find((p) => p.id === conn.fromPortId);
    const toPort = toDevice.ports.find((p) => p.id === conn.toPortId);
    if (!fromPort || !toPort) return null;

    const fromPos = getAllPortPositions(fromDevice);
    const toPos = getAllPortPositions(toDevice);

    const fromPoint = [...fromPos.inputs, ...fromPos.outputs].find((p) => p.port.id === conn.fromPortId);
    const toPoint = [...toPos.inputs, ...toPos.outputs].find((p) => p.port.id === conn.toPortId);
    if (!fromPoint || !toPoint) return null;

    const midX = (fromPoint.x + toPoint.x) / 2;

    return {
      d: `M ${fromPoint.x} ${fromPoint.y} C ${midX} ${fromPoint.y}, ${midX} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`,
      fromX: fromPoint.x,
      fromY: fromPoint.y,
      toX: toPoint.x,
      toY: toPoint.y,
      midX: (fromPoint.x + toPoint.x) / 2,
      midY: (fromPoint.y + toPoint.y) / 2,
    };
  };

  const toggleCategory = (cat: DeviceCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Device palette sidebar */}
      <div className="w-60 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Devices</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a device to add it to the canvas center.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingProcessors && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Loading devices…</span>
            </div>
          )}
          {!loadingProcessors &&
            CATEGORY_ORDER.map((cat) => {
              const items = groupedItems[cat];
              if (items.length === 0) return null;
              const isCollapsed = collapsedCategories.has(cat);
              const info = CATEGORY_INFO[cat];
              return (
                <div key={cat} className="space-y-0.5">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-white/20"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {info.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">{items.length}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1">
                      {items.map((item, i) => (
                        <button
                          key={`${cat}-${i}`}
                          onClick={() => placeDeviceInCenter(item.preset)}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted text-foreground group"
                        >
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/20"
                            style={{ backgroundColor: item.preset.color }}
                          />
                          <span className="truncate flex-1">{item.preset.name}</span>
                          {item.source === "database" && (
                            <Cpu className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          {/* Custom device button */}
          <div className="pt-2 mt-2 border-t">
            <button
              onClick={() => setShowCustomDialog(true)}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm border border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-primary transition-colors"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span>Add Custom Device</span>
            </button>
          </div>
        </div>
        {/* Cable legend */}
        <div className="border-t p-3 space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cable Types</h4>
          {data.cableTypes.map((ct) => (
            <div key={ct.id} className="flex items-center gap-2 text-xs">
              <div className="w-4 h-1 rounded-full" style={{ backgroundColor: ct.color }} />
              <span>{ct.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-[#0a0a0a]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onClick={handleCanvasClick}
      >
        <div className="relative" style={{ minWidth: 2000, minHeight: 1400 }}>
          {/* SVG layer for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
            {data.connections.map((conn) => {
              const path = getConnPath(conn);
              if (!path) return null;
              const color = getCableColor(conn.cableType);
              const isSelected = conn.id === selectedConnectionId;
              return (
                <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleConnectionClick(e, conn.id)}>
                  <path d={path.d} fill="none" stroke="transparent" strokeWidth={16} />
                  <path
                    d={path.d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 4 : 2.5}
                    opacity={isSelected ? 1 : 0.8}
                  />
                  {conn.label && (
                    <text
                      x={path.midX}
                      y={path.midY - 6}
                      fill={color}
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
            {connectingFrom && (
              <path
                d={`M ${connectingFrom.x} ${connectingFrom.y} C ${connectingFrom.x + 60} ${connectingFrom.y}, ${mousePos.x - 60} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Device blocks */}
          {data.devices.map((device) => {
            const positions = getAllPortPositions(device);
            const isSelected = device.id === selectedDeviceId;
            return (
              <div
                key={device.id}
                className={cn(
                  "absolute rounded-lg shadow-lg border-2 transition-shadow select-none",
                  isSelected ? "border-primary shadow-primary/20 ring-2 ring-primary/30" : "border-white/10"
                )}
                style={{
                  left: device.x,
                  top: device.y,
                  width: device.width,
                  height: device.height,
                  backgroundColor: device.color,
                  cursor: draggingDevice === device.id ? "grabbing" : "grab",
                }}
                onMouseDown={(e) => handleDeviceMouseDown(e, device)}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 rounded-t-lg" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                  {isSelected ? (
                    <input
                      className="bg-transparent text-white text-xs font-semibold outline-none border-b border-white/30 w-full mr-2"
                      value={device.name}
                      onChange={(e) => renameDevice(device.id, e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-white text-xs font-semibold truncate">{device.name}</span>
                  )}
                  <span className="text-[9px] text-white/50 uppercase tracking-wider flex-shrink-0">{device.type}</span>
                </div>

                <div className="relative" style={{ height: device.height - 34 }}>
                  {positions.inputs.map((p) => {
                    const absY = p.y - device.y;
                    return (
                      <div key={p.port.id} className="absolute flex items-center" style={{ left: -PORT_RADIUS, top: absY - DEVICE_HEADER_HEIGHT - PORT_RADIUS }}>
                        <button
                          className="rounded-full border-2 border-white/60 hover:border-white hover:scale-125 transition-transform"
                          style={{
                            width: PORT_RADIUS * 2,
                            height: PORT_RADIUS * 2,
                            backgroundColor: getCableColor(p.port.portType),
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handlePortClick(e, device, p.port.id, p.x, p.y)}
                          title={p.port.label}
                        />
                        <span className="text-[10px] text-white/80 ml-1.5 whitespace-nowrap">{p.port.label}</span>
                      </div>
                    );
                  })}
                  {positions.outputs.map((p) => {
                    const absY = p.y - device.y;
                    return (
                      <div key={p.port.id} className="absolute flex items-center justify-end" style={{ right: -PORT_RADIUS, top: absY - DEVICE_HEADER_HEIGHT - PORT_RADIUS }}>
                        <span className="text-[10px] text-white/80 mr-1.5 whitespace-nowrap">{p.port.label}</span>
                        <button
                          className="rounded-full border-2 border-white/60 hover:border-white hover:scale-125 transition-transform"
                          style={{
                            width: PORT_RADIUS * 2,
                            height: PORT_RADIUS * 2,
                            backgroundColor: getCableColor(p.port.portType),
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handlePortClick(e, device, p.port.id, p.x, p.y)}
                          title={p.port.label}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {data.devices.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">
                  Select a device from the left panel to start building your signal flow.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties panel */}
      {(selectedDeviceId || selectedConnectionId) && (
        <div className="w-80 flex-shrink-0 border-l bg-sidebar flex flex-col overflow-hidden">
          {selectedDeviceId && (() => {
            const device = data.devices.find((d) => d.id === selectedDeviceId);
            if (!device) return null;
            return (
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Device Properties</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Rename the device, then save your changes.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    value={device.name}
                    onChange={(e) => renameDevice(device.id, e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        className="h-8 w-12 rounded border cursor-pointer"
                        value={device.color}
                        onChange={(e) =>
                          update((prev) => ({
                            ...prev,
                            devices: prev.devices.map((d) =>
                              d.id === device.id ? { ...d, color: e.target.value } : d
                            ),
                          }))
                        }
                      />
                      <span className="text-xs text-muted-foreground font-mono">{device.color}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Ports ({device.ports.length})</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {device.ports.map((port) => (
                      <div key={port.id} className="rounded border bg-background px-2.5 py-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCableColor(port.portType) }} />
                          {isAdmin ? (
                            <input
                              className="w-full min-w-0 bg-transparent text-xs outline-none border-b border-border focus:border-primary px-1 py-1"
                              value={port.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  devices: prev.devices.map((d) =>
                                    d.id === device.id
                                      ? { ...d, ports: d.ports.map((p) => p.id === port.id ? { ...p, label: e.target.value } : p) }
                                      : d
                                  ),
                                }))
                              }
                            />
                          ) : (
                            <span className="min-w-0 flex-1 truncate text-xs">{port.label}</span>
                          )}
                          <span className="text-[9px] text-muted-foreground uppercase flex-shrink-0">{port.direction}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2 pl-4">
                            <select
                              className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-xs outline-none"
                              value={port.portType}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  devices: prev.devices.map((d) =>
                                    d.id === device.id
                                      ? { ...d, ports: d.ports.map((p) => p.id === port.id ? { ...p, portType: e.target.value } : p) }
                                      : d
                                  ),
                                }))
                              }
                            >
                              {data.cableTypes.map((ct) => (
                                <option key={ct.id} value={ct.id}>{CABLE_TYPE_NAMES[ct.id] ?? ct.name}</option>
                              ))}
                            </select>
                            <button
                              className="text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() =>
                                update((prev) => ({
                                  ...prev,
                                  devices: prev.devices.map((d) =>
                                    d.id === device.id
                                      ? { ...d, ports: d.ports.filter((p) => p.id !== port.id) }
                                      : d
                                  ),
                                  connections: prev.connections.filter(
                                    (c) => c.fromPortId !== port.id && c.toPortId !== port.id
                                  ),
                                }))
                              }
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {isAdmin && (
                    <button
                      className="w-full text-xs text-primary hover:underline mt-1"
                      onClick={() =>
                        update((prev) => ({
                          ...prev,
                          devices: prev.devices.map((d) =>
                            d.id === device.id
                              ? {
                                  ...d,
                                  height: d.height + PORT_SPACING_Y,
                                  ports: [
                                    ...d.ports,
                                    { id: uid(), label: "NEW PORT", direction: "output" as PortDirection, portType: "custom" },
                                  ],
                                }
                              : d
                          ),
                        }))
                      }
                    >
                      + Add Port
                    </button>
                  )}
                  {!isAdmin && (
                    <p className="text-[10px] text-muted-foreground/60">Port labels can be edited by admins only.</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    className="w-full text-xs text-destructive hover:bg-destructive/10 rounded-md py-2 border border-destructive/20"
                    onClick={deleteSelected}
                  >
                    Delete Device
                  </button>
                )}
                <button
                  className="w-full rounded-md py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Device Changes"}
                </button>
              </div>
            );
          })()}
          {selectedConnectionId && (() => {
            const conn = data.connections.find((c) => c.id === selectedConnectionId);
            if (!conn) return null;
            return (
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Cable Properties</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit the cable type and label.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Cable Type</label>
                  <select
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    value={conn.cableType}
                    onChange={(e) =>
                      update((prev) => ({
                        ...prev,
                        connections: prev.connections.map((c) =>
                          c.id === conn.id ? { ...c, cableType: e.target.value } : c
                        ),
                      }))
                    }
                  >
                    {data.cableTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Label</label>
                  <input
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    placeholder="e.g. 50m HDMI"
                    value={conn.label}
                    onChange={(e) =>
                      update((prev) => ({
                        ...prev,
                        connections: prev.connections.map((c) =>
                          c.id === conn.id ? { ...c, label: e.target.value } : c
                        ),
                      }))
                    }
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1 border rounded-md p-2 bg-muted/30">
                  <p><span className="text-muted-foreground/60">Cable:</span> {getCableName(conn.cableType)}</p>
                  <p><span className="text-muted-foreground/60">Color:</span> <span className="inline-block w-3 h-3 rounded-full align-middle ml-1" style={{ backgroundColor: getCableColor(conn.cableType) }} /></p>
                </div>
                <button
                  className="w-full text-xs text-destructive hover:bg-destructive/10 rounded-md py-2 border border-destructive/20"
                  onClick={deleteSelected}
                >
                  Delete Cable
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Compatibility error toast */}
      {compatError && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md"
          onClick={() => setCompatError(null)}
        >
          <div className="bg-destructive text-destructive-foreground rounded-lg shadow-xl px-4 py-3 text-sm flex items-center gap-3 cursor-pointer animate-in fade-in slide-in-from-bottom-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{compatError}</span>
          </div>
        </div>
      )}

      {/* Custom Device Dialog */}
      {showCustomDialog && (
        <CustomDeviceDialog
          cableTypes={data.cableTypes}
          onCancel={() => setShowCustomDialog(false)}
          onCreate={(preset) => {
            setShowCustomDialog(false);
            placeDeviceInCenter(preset);
          }}
        />
      )}
    </div>
  );
}

// ─── Custom Device Dialog ───────────────────────────────────────────────────

interface CustomPortRow {
  label: string;
  direction: PortDirection;
  portType: string;
}

function CustomDeviceDialog({
  cableTypes,
  onCancel,
  onCreate,
}: {
  cableTypes: { id: string; name: string; color: string }[];
  onCancel: () => void;
  onCreate: (preset: DevicePreset) => void;
}) {
  const [name, setName] = useState("");
  const [ports, setPorts] = useState<CustomPortRow[]>([
    { label: "IN", direction: "input", portType: "custom" },
    { label: "OUT", direction: "output", portType: "custom" },
  ]);

  const addPort = () => {
    setPorts((prev) => [...prev, { label: `PORT ${prev.length + 1}`, direction: "output", portType: "custom" }]);
  };

  const removePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof CustomPortRow, value: string) => {
    setPorts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleCreate = () => {
    const presetPorts: Omit<SignalFlowPort, "id">[] = ports.map((p) => ({
      label: p.label || "PORT",
      direction: p.direction,
      portType: p.portType,
    }));
    const preset = customDevicePreset(name.trim(), presetPorts);
    onCreate(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-background rounded-lg border shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Add Custom Device</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define a device with custom inputs and outputs.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Device Name</label>
            <input
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              placeholder="e.g. Millumin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Ports</label>
              <button
                className="text-xs text-primary hover:underline"
                onClick={addPort}
              >
                + Add Port
              </button>
            </div>
            <div className="space-y-1.5">
              {ports.map((port, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    className="flex-1 min-w-0 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                    placeholder="Port label"
                    value={port.label}
                    onChange={(e) => updatePort(i, "label", e.target.value)}
                  />
                  <select
                    className="rounded-md border bg-background px-1.5 py-1 text-xs outline-none"
                    value={port.direction}
                    onChange={(e) => updatePort(i, "direction", e.target.value)}
                  >
                    <option value="input">IN</option>
                    <option value="output">OUT</option>
                  </select>
                  <select
                    className="rounded-md border bg-background px-1.5 py-1 text-xs outline-none"
                    value={port.portType}
                    onChange={(e) => updatePort(i, "portType", e.target.value)}
                  >
                    {cableTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-muted-foreground hover:text-destructive px-1"
                    onClick={() => removePort(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button
            className="px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
