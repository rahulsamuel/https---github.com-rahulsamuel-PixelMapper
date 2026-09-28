"use client";

import { useState, useRef, useCallback, useEffect, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import {
  DEVICE_PRESETS,
  DEFAULT_CABLE_TYPES,
  type SignalFlowDevice,
  type SignalFlowConnection,
  type SignalFlowData,
  type DeviceType,
  type PortDirection,
} from "@/lib/signal-flow-types";

interface SignalFlowCanvasProps {
  data: SignalFlowData;
  onChange: (data: SignalFlowData) => void;
}

function uid() {
  return crypto.randomUUID();
}

function createDeviceFromPreset(presetIndex: number, x: number, y: number): SignalFlowDevice {
  const preset = DEVICE_PRESETS[presetIndex];
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

function getPortPosition(device: SignalFlowDevice, portIndex: number, direction: PortDirection) {
  const portsInDirection = device.ports.filter((p) => p.direction === direction);
  const indexInDirection = portsInDirection.findIndex((p) => p.id === device.ports[portIndex]?.id);
  if (indexInDirection < 0) return null;
  const y = device.y + PORT_START_Y + indexInDirection * PORT_SPACING_Y;
  const x = direction === "input" ? device.x : device.x + device.width;
  return { x, y };
}

function getAllPortPositions(device: SignalFlowDevice) {
  const inputs = device.ports.filter((p) => p.direction === "input");
  const outputs = device.ports.filter((p) => p.direction === "output");
  return {
    inputs: inputs.map((p, i) => ({
      port: p,
      x: device.x,
      y: device.y + PORT_START_Y + i * PORT_SPACING_Y,
    })),
    outputs: outputs.map((p, i) => ({
      port: p,
      x: device.x + device.width,
      y: device.y + PORT_START_Y + i * PORT_SPACING_Y,
    })),
  };
}

export function SignalFlowCanvas({ data, onChange }: SignalFlowCanvasProps) {
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
  const [addingPresetIndex, setAddingPresetIndex] = useState<number | null>(null);

  const update = useCallback(
    (updater: (prev: SignalFlowData) => SignalFlowData) => {
      onChange(updater(data));
    },
    [data, onChange]
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
    const handleUp = () => {
      setConnectingFrom(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [connectingFrom]);

  const handleCanvasClick = (e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedDeviceId(null);
      setSelectedConnectionId(null);
    }
    // If we're in "add device" mode
    if (addingPresetIndex !== null && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - DEVICE_PRESETS[addingPresetIndex].width / 2;
      const y = e.clientY - rect.top - 30;
      const newDevice = createDeviceFromPreset(addingPresetIndex, x, y);
      update((prev) => ({ ...prev, devices: [...prev.devices, newDevice] }));
      setAddingPresetIndex(null);
      setSelectedDeviceId(newDevice.id);
    }
  };

  const handleDeviceMouseDown = (e: MouseEvent, device: SignalFlowDevice) => {
    if (connectingFrom) return;
    if (addingPresetIndex !== null) return;
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
      // Complete the connection
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
      // Determine cable type from the output port (prefer output → input direction)
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
      // Start a connection
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

  // Keyboard delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

  // Calculate port positions for rendering connections
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

    const dx = Math.abs(toPoint.x - fromPoint.x);
    const offset = Math.max(40, dx * 0.4);
    const c1x = fromPoint.x + (fromPort.direction === "output" ? offset : -offset);
    const c2x = toPoint.x + (toPort.direction === "input" ? -offset : offset);

    return {
      d: `M ${fromPoint.x} ${fromPoint.y} C ${c1x} ${fromPoint.y}, ${c2x} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`,
      fromX: fromPoint.x,
      fromY: fromPoint.y,
      toX: toPoint.x,
      toY: toPoint.y,
      midX: (fromPoint.x + toPoint.x) / 2,
      midY: (fromPoint.y + toPoint.y) / 2,
    };
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Device palette sidebar */}
      <div className="w-52 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Devices</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a device, then click the canvas to place it.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {DEVICE_PRESETS.map((preset, i) => (
            <button
              key={preset.type}
              onClick={() => setAddingPresetIndex(addingPresetIndex === i ? null : i)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors border",
                addingPresetIndex === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent hover:bg-muted text-foreground"
              )}
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/20"
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
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
          cursor: addingPresetIndex !== null ? "crosshair" : "default",
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
                  {/* Invisible wider path for easier clicking */}
                  <path d={path.d} fill="none" stroke="transparent" strokeWidth={16} />
                  <path
                    d={path.d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 4 : 2.5}
                    opacity={isSelected ? 1 : 0.8}
                    strokeDasharray={isSelected ? "0" : "0"}
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
            {/* Pending connection line */}
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
                {/* Device header */}
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

                {/* Ports */}
                <div className="relative" style={{ height: device.height - 34 }}>
                  {positions.inputs.map((p, i) => {
                    const absY = p.y - device.y;
                    return (
                      <div key={p.port.id} className="absolute flex items-center" style={{ left: -PORT_RADIUS, top: absY - PORT_RADIUS, transform: "translateY(2px)" }}>
                        <button
                          className="rounded-full border-2 border-white/60 hover:border-white hover:scale-125 transition-transform"
                          style={{
                            width: PORT_RADIUS * 2,
                            height: PORT_RADIUS * 2,
                            backgroundColor: getCableColor(p.port.portType),
                          }}
                          onClick={(e) => handlePortClick(e, device, p.port.id, p.x, p.y)}
                          title={p.port.label}
                        />
                        <span className="text-[10px] text-white/80 ml-1.5 whitespace-nowrap">{p.port.label}</span>
                      </div>
                    );
                  })}
                  {positions.outputs.map((p, i) => {
                    const absY = p.y - device.y;
                    return (
                      <div key={p.port.id} className="absolute flex items-center justify-end" style={{ right: -PORT_RADIUS, top: absY - PORT_RADIUS, transform: "translateY(2px)" }}>
                        <span className="text-[10px] text-white/80 mr-1.5 whitespace-nowrap">{p.port.label}</span>
                        <button
                          className="rounded-full border-2 border-white/60 hover:border-white hover:scale-125 transition-transform"
                          style={{
                            width: PORT_RADIUS * 2,
                            height: PORT_RADIUS * 2,
                            backgroundColor: getCableColor(p.port.portType),
                          }}
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
                  {addingPresetIndex !== null
                    ? "Click anywhere on the canvas to place the device."
                    : "Select a device from the left panel to start building your signal flow."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties panel */}
      {(selectedDeviceId || selectedConnectionId) && (
        <div className="w-60 flex-shrink-0 border-l bg-sidebar flex flex-col overflow-hidden">
          {selectedDeviceId && (() => {
            const device = data.devices.find((d) => d.id === selectedDeviceId);
            if (!device) return null;
            return (
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Device Properties</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit the device name and color.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    value={device.name}
                    onChange={(e) => renameDevice(device.id, e.target.value)}
                  />
                </div>
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
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Ports ({device.ports.length})</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {device.ports.map((port) => (
                      <div key={port.id} className="flex items-center gap-2 text-xs rounded border px-2 py-1.5 bg-background">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCableColor(port.portType) }} />
                        <span className="truncate flex-1">{port.label}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{port.direction}</span>
                        <button
                          className="text-muted-foreground hover:text-destructive"
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
                    ))}
                  </div>
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
                </div>
                <button
                  className="w-full text-xs text-destructive hover:bg-destructive/10 rounded-md py-2 border border-destructive/20"
                  onClick={deleteSelected}
                >
                  Delete Device
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
    </div>
  );
}
