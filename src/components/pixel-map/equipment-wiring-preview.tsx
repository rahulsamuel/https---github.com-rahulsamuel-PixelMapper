"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cable, Zap } from "lucide-react";
import type { CableRun, DataPortEntry, PowerPortEntry, ProcessorEntry } from "@/contexts/pixel-map-context";

type SourceNode = { id: string; label: string };

type PortNode = {
  id: string;
  label: string;
  screenName: string;
  tileCount: number;
  sourceId: string | undefined;
  cable: CableRun | undefined;
};

const ROW_H = 48;
const PAD = 8;
const SOURCE_X = 0;
const SOURCE_W = 200;
const SOURCE_H = 32;
const PORT_X = 440;
const PORT_W = 240;
const DIAGRAM_W = 680;

const toMeters = (c: CableRun) => (c.unit === "ft" ? c.length * 0.3048 : c.length);

function WiringDiagram({
  sources,
  ports,
  emptyText,
}: {
  sources: SourceNode[];
  ports: PortNode[];
  emptyText: string;
}) {
  if (ports.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
  }

  const height = Math.max(ports.length, sources.length, 1) * ROW_H + PAD * 2;
  const sourceCenter = (i: number) => ((i + 0.5) * height) / Math.max(sources.length, 1);
  const rowCenter = (i: number) => PAD + i * ROW_H + ROW_H / 2;
  const sourceIndex = new Map(sources.map((s, i) => [s.id, i]));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${DIAGRAM_W} ${height}`}
        width="100%"
        style={{ minWidth: 560, maxWidth: DIAGRAM_W }}
        role="img"
        aria-label="Wiring diagram"
      >
        {ports.map((port, i) => {
          const srcIdx = port.sourceId !== undefined ? sourceIndex.get(port.sourceId) : undefined;
          if (srcIdx === undefined) return null;
          const x1 = SOURCE_X + SOURCE_W;
          const y1 = sourceCenter(srcIdx);
          const x2 = PORT_X;
          const y2 = rowCenter(i);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const label = port.cable ? `${port.cable.length} ${port.cable.unit}` : "";
          return (
            <g key={`line-${port.id}`}>
              <path
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
              />
              {label && (
                <g>
                  <rect x={mx - 30} y={my - 10} width={60} height={20} rx={4} fill="hsl(var(--background))" stroke="hsl(var(--border))" />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))">{label}</text>
                </g>
              )}
            </g>
          );
        })}

        {sources.map((src, i) => (
          <g key={src.id}>
            <rect
              x={SOURCE_X}
              y={sourceCenter(i) - SOURCE_H / 2}
              width={SOURCE_W}
              height={SOURCE_H}
              rx={6}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
            />
            <text x={SOURCE_X + 12} y={sourceCenter(i) + 4} fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">
              {src.label}
            </text>
          </g>
        ))}

        {ports.map((port, i) => (
          <g key={port.id}>
            <rect
              x={PORT_X}
              y={PAD + i * ROW_H + 5}
              width={PORT_W}
              height={ROW_H - 10}
              rx={6}
              fill="hsl(var(--background))"
              stroke="hsl(var(--border))"
            />
            <text x={PORT_X + 12} y={PAD + i * ROW_H + 18} fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">
              {port.label}
            </text>
            <text x={PORT_X + 12} y={PAD + i * ROW_H + 33} fontSize={11} fill="hsl(var(--muted-foreground))">
              {port.screenName} · {port.tileCount} tiles
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RunSummary({ cables }: { cables: (CableRun | undefined)[] }) {
  const runs = cables.filter((c): c is CableRun => c !== undefined);
  const totalM = runs.reduce((sum, c) => sum + toMeters(c), 0);
  return (
    <p className="text-sm text-muted-foreground">
      {runs.length} runs · {totalM.toFixed(1)} m total ({(totalM * 3.28084).toFixed(0)} ft)
    </p>
  );
}

export function EquipmentWiringPreview({
  processors,
  dataPorts,
  powerPorts,
  cables,
  screenName,
}: {
  processors: ProcessorEntry[];
  dataPorts: DataPortEntry[];
  powerPorts: PowerPortEntry[];
  cables: CableRun[];
  screenName: (id: string) => string;
}) {
  const sources: SourceNode[] = processors.filter(p => !p.isBackup).map(p => ({ id: p.id, label: p.label }));

  const dataNodes: PortNode[] = dataPorts
    .filter(dp => !dp.isBackup)
    .map(dp => ({
      id: dp.id,
      label: dp.label,
      screenName: screenName(dp.screenId),
      tileCount: dp.tileCount,
      sourceId: dp.processorId || undefined,
      cable: cables.find(c => c.kind === "cat" && c.fromLabel === dp.label),
    }));

  const powerNodes: PortNode[] = powerPorts.map(pp => ({
    id: pp.id,
    label: pp.label,
    screenName: screenName(pp.screenId),
    tileCount: pp.tileCount,
    sourceId: pp.processorId || undefined,
    cable: cables.find(c => c.kind === "power" && c.fromLabel === pp.label),
  }));

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Data Wiring Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <WiringDiagram
          sources={sources}
          ports={dataNodes}
          emptyText="No data ports yet. Set up wiring in the Wiring Diagram tab, then click Regenerate."
        />
        <RunSummary cables={dataNodes.map(n => n.cable)} />
      </CardContent>
      </Card>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Power Wiring Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <WiringDiagram
          sources={sources}
          ports={powerNodes}
          emptyText="No power ports yet. Enable power wiring in the Wiring Diagram tab, then click Regenerate."
        />
        <RunSummary cables={powerNodes.map(n => n.cable)} />
      </CardContent>
      </Card>
    </div>
  );
}
