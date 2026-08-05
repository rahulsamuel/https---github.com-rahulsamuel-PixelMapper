"use client";

import { useState, useMemo } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Cpu,
  Network,
  Cable,
  Ruler,
} from "lucide-react";
import type { GearConfig, ProcessorEntry, FiberBoxEntry, CableRun, ProcessorType } from "@/contexts/pixel-map-context";

const PROCESSOR_TYPES: { value: ProcessorType; label: string; boxLabel: string; defaultPorts: number }[] = [
  { value: "Novastar", label: "Novastar (CVT)", boxLabel: "Novastar CVT Box", defaultPorts: 16 },
  { value: "Brompton", label: "Brompton (SX40)", boxLabel: "XD Box", defaultPorts: 10 },
  { value: "Helios", label: "Helios", boxLabel: "Helios Switch", defaultPorts: 12 },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function EquipmentView() {
  const {
    screens,
    gear,
    gearVersion,
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

  // gearVersion is read to trigger re-render when gearRef changes
  void gearVersion;

  const [newProcLabel, setNewProcLabel] = useState("");
  const [newProcType, setNewProcType] = useState<ProcessorType>("Novastar");

  const processors = gear?.processors ?? [];
  const fiberBoxes = gear?.fiberBoxes ?? [];
  const cables = gear?.cables ?? [];

  const screenOptions = screens.map(s => ({ id: s.id, name: s.name }));

  const handleAddProcessor = () => {
    const label = newProcLabel.trim() || `Processor ${processors.length + 1}`;
    addProcessor({ label, type: newProcType, screenIds: [] });
    setNewProcLabel("");
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

  const handleAddFiberCable = (processorId: string, boxId: string) => {
    const proc = processors.find(p => p.id === processorId);
    const box = fiberBoxes.find(b => b.id === boxId);
    if (!proc || !box) return;
    addCable({
      kind: "fiber",
      fromLabel: proc.label,
      toLabel: box.label,
      length: 100,
      unit: "m",
    });
  };

  const handleAddCatCable = (boxId: string) => {
    const box = fiberBoxes.find(b => b.id === boxId);
    if (!box) return;
    addCable({
      kind: "cat",
      fromLabel: box.label,
      toLabel: "LED Tile",
      length: 10,
      unit: "m",
    });
  };

  // Totals
  const totals = useMemo(() => {
    const fiberCables = cables.filter(c => c.kind === "fiber");
    const catCables = cables.filter(c => c.kind === "cat");
    const fiberTotalM = fiberCables.reduce((sum, c) => sum + (c.unit === "ft" ? c.length * 0.3048 : c.length), 0);
    const fiberTotalFt = fiberCables.reduce((sum, c) => sum + (c.unit === "m" ? c.length * 3.28084 : c.length), 0);
    const catTotalM = catCables.reduce((sum, c) => sum + (c.unit === "ft" ? c.length * 0.3048 : c.length), 0);
    const catTotalFt = catCables.reduce((sum, c) => sum + (c.unit === "m" ? c.length * 3.28084 : c.length), 0);
    return { fiberTotalM, fiberTotalFt, catTotalM, catTotalFt, fiberCount: fiberCables.length, catCount: catCables.length };
  }, [cables]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Processors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{processors.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fiber Boxes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fiberBoxes.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fiber Cable</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.fiberTotalM.toFixed(1)}m</p>
            <p className="text-xs text-muted-foreground">{totals.fiberTotalFt.toFixed(0)}ft ({totals.fiberCount} runs)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cat5e/Cat6</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.catTotalM.toFixed(1)}m</p>
            <p className="text-xs text-muted-foreground">{totals.catTotalFt.toFixed(0)}ft ({totals.catCount} runs)</p>
          </CardContent>
        </Card>
      </div>

      {/* Processors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="size-5" /> Processors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="Processor name"
                value={newProcLabel}
                onChange={(e) => setNewProcLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddProcessor()}
                className="w-48"
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
            <Button onClick={handleAddProcessor}><Plus className="size-4 mr-1" /> Add Processor</Button>
          </div>

          {processors.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No processors yet. Add one to get started.</p>
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
                  <ScreenMultiSelect
                    value={proc.screenIds}
                    options={screenOptions}
                    onChange={(ids) => updateProcessor(proc.id, { screenIds: ids })}
                  />
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
                        <ScreenMultiSelect
                          value={box.screenIds}
                          options={screenOptions}
                          onChange={(ids) => updateFiberBox(box.id, { screenIds: ids })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFiberBox(box.id)} className="text-destructive ml-auto">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddFiberCable(proc.id, box.id)}>
                          <Cable className="size-3 mr-1" /> Add Fiber Run
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAddCatCable(box.id)}>
                          <Cable className="size-3 mr-1" /> Add Cat Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cable list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="size-5" /> Cable Runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cables.length === 0 && <p className="text-sm text-muted-foreground py-2">No cable runs defined yet.</p>}
          {cables.map((cable) => (
            <div key={cable.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cable.kind === "fiber" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"}`}>
                {cable.kind === "fiber" ? "Fiber" : "Cat5e/6"}
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
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenMultiSelect({ value, options, onChange }: { value: string[]; options: { id: string; name: string }[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs">Screens</Label>
      <div className="flex flex-wrap gap-1 min-h-[32px] rounded-md border p-1 bg-background">
        {options.length === 0 && <span className="text-xs text-muted-foreground px-1 py-1">No screens</span>}
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${value.includes(opt.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}
