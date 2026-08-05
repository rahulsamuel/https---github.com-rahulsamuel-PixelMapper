"use client";

import { useState, useMemo, useEffect } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  Trash2,
  Cpu,
  Network,
  Cable,
  Ruler,
  Zap,
  CableCar,
} from "lucide-react";
import type { GearConfig, ProcessorEntry, FiberBoxEntry, CableRun, ProcessorType } from "@/contexts/pixel-map-context";

const PROCESSOR_TYPES: { value: ProcessorType; label: string; boxLabel: string; defaultPorts: number }[] = [
  { value: "Novastar", label: "Novastar (CVT)", boxLabel: "Novastar CVT Box", defaultPorts: 16 },
  { value: "Brompton", label: "Brompton (SX40)", boxLabel: "XD Box", defaultPorts: 10 },
  { value: "Helios", label: "Helios", boxLabel: "Helios Switch", defaultPorts: 12 },
];

export function EquipmentView() {
  const {
    screens,
    gear,
    gearVersion,
    regenerateGear,
    addProcessor,
    updateProcessor,
    removeProcessor,
    addFiberBox,
    updateFiberBox,
    removeFiberBox,
    addCable,
    updateCable,
    removeCable,
  } = usePixelMap();

  void gearVersion;

  // Auto-populate on mount
  useEffect(() => {
    regenerateGear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showAddProc, setShowAddProc] = useState(false);
  const [newProcLabel, setNewProcLabel] = useState("");
  const [newProcType, setNewProcType] = useState<ProcessorType>("Novastar");

  const processors = gear?.processors ?? [];
  const dataPorts = gear?.dataPorts ?? [];
  const powerPorts = gear?.powerPorts ?? [];
  const fiberBoxes = gear?.fiberBoxes ?? [];
  const cables = gear?.cables ?? [];

  const screenName = (id: string) => screens.find(s => s.id === id)?.name ?? "Unknown";

  const handleAddProcessor = () => {
    const label = newProcLabel.trim() || `Processor ${processors.length + 1}`;
    addProcessor({ label, type: newProcType, screenIds: [], rasterGroupId: `manual-${Date.now()}` });
    setNewProcLabel("");
    setShowAddProc(false);
  };

  const handleAddFiberBox = (processorId: string) => {
    const proc = processors.find(p => p.id === processorId);
    if (!proc) return;
    const meta = PROCESSOR_TYPES.find(t => t.value === proc.type);
    const boxLabel = meta?.boxLabel ?? "Fiber Box";
    addFiberBox({
      label: `${boxLabel} ${fiberBoxes.filter(b => b.processorId === processorId).length + 1}`,
      processorId,
      portCount: meta?.defaultPorts ?? 12,
      screenIds: [],
    });
  };

  // Totals
  const totals = useMemo(() => {
    const fiberCables = cables.filter(c => c.kind === "fiber");
    const catCables = cables.filter(c => c.kind === "cat");
    const powerCables = cables.filter(c => c.kind === "power");
    const toM = (c: CableRun) => c.unit === "ft" ? c.length * 0.3048 : c.length;
    const toFt = (c: CableRun) => c.unit === "m" ? c.length * 3.28084 : c.length;
    return {
      fiberTotalM: fiberCables.reduce((s, c) => s + toM(c), 0),
      fiberTotalFt: fiberCables.reduce((s, c) => s + toFt(c), 0),
      catTotalM: catCables.reduce((s, c) => s + toM(c), 0),
      catTotalFt: catCables.reduce((s, c) => s + toFt(c), 0),
      powerTotalM: powerCables.reduce((s, c) => s + toM(c), 0),
      powerTotalFt: powerCables.reduce((s, c) => s + toFt(c), 0),
      fiberCount: fiberCables.length,
      catCount: catCables.length,
      powerCount: powerCables.length,
    };
  }, [cables]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Equipment List</h2>
          <p className="text-sm text-muted-foreground">Auto-populated from raster groups and wiring. Edit values as needed.</p>
        </div>
        <Button variant="outline" onClick={regenerateGear}>
          <RefreshCw className="size-4 mr-2" /> Regenerate from Wiring
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Processors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{processors.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Data Ports</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{dataPorts.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Power Ports</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{powerPorts.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Fiber Boxes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fiberBoxes.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Cable Runs</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{cables.length}</p></CardContent>
        </Card>
      </div>

      {/* Processors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="size-5" /> Processors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {processors.length === 0 && !showAddProc && (
            <p className="text-sm text-muted-foreground py-2">No processors. Add raster groups in the Raster Map tab or add one manually.</p>
          )}
          {processors.map((proc) => {
            const boxes = fiberBoxes.filter(b => b.processorId === proc.id);
            return (
              <div key={proc.id} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    value={proc.label}
                    onChange={(e) => updateProcessor(proc.id, { label: e.target.value })}
                    className="w-48 font-medium"
                  />
                  <Select value={proc.type} onValueChange={(v) => updateProcessor(proc.id, { type: v as ProcessorType })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROCESSOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {proc.screenIds.map(sid => (
                      <span key={sid} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{screenName(sid)}</span>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProcessor(proc.id)} className="text-destructive ml-auto">
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Fiber boxes under this processor */}
                <div className="pl-4 space-y-2 border-l-2 border-border">
                  <div className="flex items-center gap-2">
                    <Network className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Fiber Boxes</span>
                    <Button size="sm" variant="outline" onClick={() => handleAddFiberBox(proc.id)}>
                      <Plus className="size-3 mr-1" /> Add Box
                    </Button>
                  </div>
                  {boxes.map((box) => (
                    <div key={box.id} className="rounded-md border p-3 space-y-2 bg-background">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          value={box.label}
                          onChange={(e) => updateFiberBox(box.id, { label: e.target.value })}
                          className="w-44 text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <Label className="text-xs whitespace-nowrap">Ports</Label>
                          <Input
                            type="number"
                            min={1}
                            value={box.portCount}
                            onChange={(e) => updateFiberBox(box.id, { portCount: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-16 text-sm"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFiberBox(box.id)} className="text-destructive ml-auto">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {showAddProc ? (
            <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="Processor name"
                  value={newProcLabel}
                  onChange={(e) => setNewProcLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddProcessor()}
                  className="w-48"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={newProcType} onValueChange={(v) => setNewProcType(v as ProcessorType)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROCESSOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddProcessor}><Plus className="size-4 mr-1" /> Add</Button>
              <Button variant="ghost" onClick={() => setShowAddProc(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddProc(true)}><Plus className="size-4 mr-1" /> Add Processor Manually</Button>
          )}
        </CardContent>
      </Card>

      {/* Data Ports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Data Ports (Cat Runs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dataPorts.length === 0 && <p className="text-sm text-muted-foreground py-2">No data ports. Set up wiring in the Wiring Diagram tab.</p>}
          {dataPorts.map((dp) => (
            <div key={dp.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20 text-sm">
              <span className="font-mono font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{dp.label}</span>
              {dp.backupLabel && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">Backup: {dp.backupLabel}</span>
              )}
              <span className="text-muted-foreground">{screenName(dp.screenId)}</span>
              <span className="text-muted-foreground">{dp.tileCount} tiles</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Power Ports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Power Ports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {powerPorts.length === 0 && <p className="text-sm text-muted-foreground py-2">No power ports. Enable power wiring in the Wiring Diagram tab.</p>}
          {powerPorts.map((pp) => (
            <div key={pp.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20 text-sm">
              <span className="font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{pp.label}</span>
              <span className="text-muted-foreground">{screenName(pp.screenId)}</span>
              <span className="text-muted-foreground">{pp.tileCount} tiles</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cable Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="size-5" /> Cable Runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cables.length === 0 && <p className="text-sm text-muted-foreground py-2">No cable runs defined yet.</p>}
          {cables.map((cable) => (
            <div key={cable.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${cable.kind === "fiber" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : cable.kind === "power" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"}`}>
                {cable.kind === "fiber" ? "Fiber" : cable.kind === "power" ? "Power" : "Cat5e/6"}
              </span>
              <Input
                value={cable.fromLabel}
                onChange={(e) => updateCable(cable.id, { fromLabel: e.target.value })}
                className="w-32 text-sm"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                value={cable.toLabel}
                onChange={(e) => updateCable(cable.id, { toLabel: e.target.value })}
                className="w-32 text-sm"
              />
              <Input
                type="number"
                min={0}
                value={cable.length}
                onChange={(e) => updateCable(cable.id, { length: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-20 text-sm"
              />
              <Select value={cable.unit} onValueChange={(v: "ft" | "m") => updateCable(cable.id, { unit: v })}>
                <SelectTrigger className="w-16 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeCable(cable.id)} className="text-destructive ml-auto">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addCable({ kind: "cat", fromLabel: "", toLabel: "", length: 10, unit: "m" })}>
            <Plus className="size-3 mr-1" /> Add Cable Run
          </Button>
        </CardContent>
      </Card>

      {/* Cable totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Fiber Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{totals.fiberTotalM.toFixed(1)}m</p>
            <p className="text-xs text-muted-foreground">{totals.fiberTotalFt.toFixed(0)}ft ({totals.fiberCount} runs)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Cat5e/6 Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{totals.catTotalM.toFixed(1)}m</p>
            <p className="text-xs text-muted-foreground">{totals.catTotalFt.toFixed(0)}ft ({totals.catCount} runs)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Power Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{totals.powerTotalM.toFixed(1)}m</p>
            <p className="text-xs text-muted-foreground">{totals.powerTotalFt.toFixed(0)}ft ({totals.powerCount} runs)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
