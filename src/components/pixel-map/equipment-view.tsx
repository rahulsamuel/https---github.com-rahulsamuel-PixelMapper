"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Plus,
  Trash2,
  Network,
  Cable,
  Zap,
  Shield,
  Layers,
  Download,
  FileSpreadsheet,
  FileImage,
  FileText,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { ProcessorEntry, CableRun, ProcessorType } from "@/contexts/pixel-map-context";

const PROCESSOR_TYPES: { value: ProcessorType; label: string; boxLabel: string; defaultPorts: number }[] = [
  { value: "Novastar", label: "Novastar (CVT)", boxLabel: "Novastar CVT Box", defaultPorts: 16 },
  { value: "Brompton", label: "Brompton (SX40)", boxLabel: "XD Box", defaultPorts: 10 },
  { value: "Helios", label: "Helios", boxLabel: "Helios Switch", defaultPorts: 12 },
];

export function EquipmentView() {
  const {
    screens,
    rasterGroups,
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

  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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
  const groupName = (id: string) => rasterGroups.find(g => g.id === id)?.name ?? "Ungrouped";

  const primaryDataPorts = dataPorts.filter(dp => !dp.isBackup);
  const backupDataPorts = dataPorts.filter(dp => dp.isBackup);

  // Group data ports by slice for visual distinction
  const sliceKeys = Array.from(new Set(dataPorts.map(dp => dp.sliceKey ?? "default")));
  const SLICE_COLORS = [
    { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
    { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-500" },
    { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
    { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500" },
    { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
    { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-500" },
  ];
  const sliceColor = (key: string) => {
    const idx = sliceKeys.indexOf(key);
    return SLICE_COLORS[idx % SLICE_COLORS.length] ?? SLICE_COLORS[0];
  };

  const handleAddProcessor = () => {
    const label = newProcLabel.trim() || `Processor ${processors.length + 1}`;
    addProcessor({ label, type: newProcType, screenIds: [], rasterGroupId: `manual-${Date.now()}`, isBackup: false });
    setNewProcLabel("");
    setShowAddProc(false);
  };

  const handleAddFiberBox = (processorId: string, isBackup: boolean) => {
    const proc = processors.find(p => p.id === processorId);
    if (!proc) return;
    const meta = PROCESSOR_TYPES.find(t => t.value === proc.type);
    const boxLabel = meta?.boxLabel ?? "Fiber Box";
    const existing = fiberBoxes.filter(b => b.processorId === processorId).length;
    addFiberBox({
      label: `${boxLabel} ${existing + 1}${isBackup ? " (Backup)" : ""}`,
      processorId,
      portCount: meta?.defaultPorts ?? 12,
      screenIds: [],
      isBackup,
    });
  };

  const groupedProcessors = useMemo(() => {
    const map = new Map<string, { groupId: string; sliceKey?: string; primary: ProcessorEntry | undefined; backup: ProcessorEntry | undefined }>();
    processors.forEach((p) => {
      const key = `${p.rasterGroupId}:${p.sliceKey ?? "default"}`;
      if (!map.has(key)) map.set(key, { groupId: p.rasterGroupId, sliceKey: p.sliceKey, primary: undefined, backup: undefined });
      const entry = map.get(key)!;
      if (p.isBackup) entry.backup = p;
      else entry.primary = p;
    });
    return map;
  }, [processors]);

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

  // ── Exports ──────────────────────────────────────────────────────────────

  const buildCsvContent = () => {
    const rows: string[][] = [];

    rows.push(["EQUIPMENT LIST"]);
    rows.push([]);

    rows.push(["PROCESSORS"]);
    rows.push(["Label", "Type", "Role", "Screens"]);
    processors.forEach(p => {
      rows.push([p.label, p.type, p.isBackup ? "Backup" : "Primary", p.screenIds.map(screenName).join("; ")]);
    });
    rows.push([]);

    rows.push(["PRIMARY DATA PORTS (CAT RUNS)"]);
    rows.push(["Port Label", "Backup Label", "Screen", "Tile Count"]);
    primaryDataPorts.forEach(dp => {
      rows.push([dp.label, dp.backupLabel || "", screenName(dp.screenId), String(dp.tileCount)]);
    });
    rows.push([]);

    rows.push(["BACKUP DATA PORTS"]);
    rows.push(["Port Label", "Screen", "Tile Count"]);
    backupDataPorts.forEach(dp => {
      rows.push([dp.label, screenName(dp.screenId), String(dp.tileCount)]);
    });
    rows.push([]);

    rows.push(["POWER PORTS"]);
    rows.push(["Port Label", "Screen", "Tile Count"]);
    powerPorts.forEach(pp => {
      rows.push([pp.label, screenName(pp.screenId), String(pp.tileCount)]);
    });
    rows.push([]);

    rows.push(["DATA CABLE RUNS"]);
    rows.push(["From", "To", "Length", "Unit"]);
    cables.filter(c => c.kind === "cat").forEach(c => {
      rows.push([c.fromLabel, c.toLabel, String(c.length), c.unit]);
    });
    rows.push([]);

    rows.push(["POWER CABLE RUNS"]);
    rows.push(["From", "To", "Length", "Unit"]);
    cables.filter(c => c.kind === "power").forEach(c => {
      rows.push([c.fromLabel, c.toLabel, String(c.length), c.unit]);
    });
    rows.push([]);

    rows.push(["FIBER CABLE RUNS"]);
    rows.push(["From", "To", "Length", "Unit"]);
    cables.filter(c => c.kind === "fiber").forEach(c => {
      rows.push([c.fromLabel, c.toLabel, String(c.length), c.unit]);
    });
    rows.push([]);

    rows.push(["CABLE TOTALS"]);
    rows.push(["Type", "Total (m)", "Total (ft)", "Runs"]);
    rows.push(["Cat5e/6 Data", totals.catTotalM.toFixed(1), totals.catTotalFt.toFixed(0), String(totals.catCount)]);
    rows.push(["Power", totals.powerTotalM.toFixed(1), totals.powerTotalFt.toFixed(0), String(totals.powerCount)]);
    rows.push(["Fiber", totals.fiberTotalM.toFixed(1), totals.fiberTotalFt.toFixed(0), String(totals.fiberCount)]);

    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const handleExportCsv = () => {
    const csv = buildCsvContent();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equipment-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "equipment-list.png";
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const ratio = img.width / img.height;
      let imgW = usableW;
      let imgH = imgW / ratio;
      let yOffset = margin;
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(dataUrl, "PNG", margin, yOffset, imgW, imgH);
      } else {
        // Tall content: slice across pages
        const pageImgH = (pageH - margin * 2) * (img.width / usableW);
        let srcY = 0;
        while (srcY < img.height) {
          const sliceH = Math.min(pageImgH, img.height - srcY);
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = sliceH;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, -srcY);
          const sliceUrl = canvas.toDataURL("image/png");
          const renderedH = sliceH * (usableW / img.width);
          if (srcY > 0) pdf.addPage();
          pdf.addImage(sliceUrl, "PNG", margin, margin, usableW, renderedH);
          srcY += sliceH;
        }
      }
      pdf.save("equipment-list.pdf");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderProcessorRow = (proc: ProcessorEntry) => {
    const boxes = fiberBoxes.filter(b => b.processorId === proc.id);
    return (
      <div key={proc.id} className={`rounded-lg border p-4 space-y-3 ${proc.isBackup ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-muted/20"}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {proc.isBackup && <Shield className="size-4 text-red-500" />}
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

        <div className="pl-4 space-y-2 border-l-2 border-border">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{proc.isBackup ? "Backup Fiber Boxes" : "Fiber Boxes"}</span>
            <Button size="sm" variant="outline" onClick={() => handleAddFiberBox(proc.id, proc.isBackup)}>
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
  };

  const renderCableRow = (cable: CableRun) => (
    <div key={cable.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20">
      <Input
        value={cable.fromLabel}
        onChange={(e) => updateCable(cable.id, { fromLabel: e.target.value })}
        className="w-32 text-sm"
        placeholder="From"
      />
      <span className="text-muted-foreground shrink-0">→</span>
      <Input
        value={cable.toLabel}
        onChange={(e) => updateCable(cable.id, { toLabel: e.target.value })}
        className="w-32 text-sm"
        placeholder="To"
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
      <Button variant="ghost" size="icon" onClick={() => removeCable(cable.id)} className="text-destructive ml-auto shrink-0">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Equipment List</h2>
          <p className="text-sm text-muted-foreground">Auto-populated from raster groups and wiring. Primary and backup processors grouped per raster group.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={regenerateGear}>
            <RefreshCw className="size-4 mr-2" /> Regenerate
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="size-4 mr-2" />
                {isExporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="size-4 mr-2" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPng}>
                <FileImage className="size-4 mr-2" /> Download Image (.png)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="size-4 mr-2" /> Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Everything below is captured for image/PDF export */}
      <div ref={exportRef} className="space-y-6 p-1">

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Processors", value: processors.length },
            { label: "Primary Data Ports", value: primaryDataPorts.length },
            { label: "Backup Data Ports", value: backupDataPorts.length },
            { label: "Power Ports", value: powerPorts.length },
            { label: "Fiber Boxes", value: fiberBoxes.length },
            { label: "Cable Runs", value: cables.length },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* Processors grouped by raster group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="size-5" /> Processors by Raster Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedProcessors.size === 0 && !showAddProc && (
              <p className="text-sm text-muted-foreground py-2">No processors. Add raster groups in the Raster Map tab or add one manually.</p>
            )}
            {Array.from(groupedProcessors.entries()).map(([processorGroupKey, { groupId, sliceKey, primary, backup }], index) => (
              <div key={processorGroupKey} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground border-b pb-1">
                  <Layers className="size-4" /> {groupName(groupId)}{sliceKey && sliceKey !== "default" ? ` (Slice ${sliceKey})` : ''}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 px-1">PRIMARY</span>
                    {primary && renderProcessorRow(primary)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 px-1">BACKUP</span>
                    {backup && renderProcessorRow(backup)}
                  </div>
                </div>
              </div>
            ))}

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

        {/* Data Ports (Cat Runs) — grouped by raster slice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Data Ports (Cat Runs)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sliceKeys.length === 0 && (
              <p className="text-sm text-muted-foreground py-1">No data ports. Set up wiring in the Wiring Diagram tab.</p>
            )}
            {sliceKeys.map((sliceKey) => {
              const sc = sliceColor(sliceKey);
              const slicePrimary = primaryDataPorts.filter(dp => (dp.sliceKey ?? "default") === sliceKey);
              const sliceBackup = backupDataPorts.filter(dp => (dp.sliceKey ?? "default") === sliceKey);
              const ownerGroup = slicePrimary[0]?.rasterGroupId ?? sliceBackup[0]?.rasterGroupId;
              const sliceLabel = sliceKey === "default" ? (ownerGroup ? groupName(ownerGroup) : "All Rasters") : (ownerGroup ? `${groupName(ownerGroup)} (Slice ${sliceKey})` : `Slice ${sliceKey}`);
              return (
                <div key={sliceKey} className={`rounded-lg border p-3 space-y-3 ${sc.border}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`size-2.5 rounded-full ${sc.dot} shrink-0`} />
                    <span className={sc.text}>{sliceLabel}</span>
                    <span className="text-muted-foreground text-xs font-normal">{slicePrimary.length} primary · {sliceBackup.length} backup</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Primary data ports for this slice */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                        <span className="size-2 rounded-full bg-green-500 shrink-0" /> Primary
                      </div>
                      {slicePrimary.length === 0 && <p className="text-xs text-muted-foreground py-0.5">No primary ports in this raster.</p>}
                      {slicePrimary.map((dp) => (
                        <div key={dp.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20 text-sm flex-wrap">
                          <span className={`font-mono font-medium px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{dp.label}</span>
                          <span className="text-muted-foreground">{screenName(dp.screenId)}</span>
                          <span className="text-muted-foreground text-xs">{dp.tileCount} tiles</span>
                        </div>
                      ))}
                    </div>

                    {/* Backup data ports for this slice */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                        <Shield className="size-3.5 shrink-0" /> Backup
                      </div>
                      {sliceBackup.length === 0 && <p className="text-xs text-muted-foreground py-0.5">No backup ports in this raster.</p>}
                      {sliceBackup.map((dp) => (
                        <div key={dp.id} className="flex items-center gap-2 rounded-md border p-2 bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-sm flex-wrap">
                          <Shield className="size-3.5 text-red-500 shrink-0" />
                          <span className={`font-mono font-medium px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{dp.label}</span>
                          <span className="text-muted-foreground">{screenName(dp.screenId)}</span>
                          <span className="text-muted-foreground text-xs">{dp.tileCount} tiles</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Power Ports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Power Ports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {powerPorts.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No power ports. Enable power wiring in the Wiring Diagram tab.</p>
            )}
            {powerPorts.map((pp) => (
              <div key={pp.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20 text-sm flex-wrap">
                <span className="font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{pp.label}</span>
                <span className="text-muted-foreground">{screenName(pp.screenId)}</span>
                <span className="text-muted-foreground text-xs">{pp.tileCount} tiles</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Cable Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Data Cable Runs (Cat5e/6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cables.filter(c => c.kind === "cat").length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No data cable runs defined yet.</p>
            )}
            {cables.filter(c => c.kind === "cat").map(renderCableRow)}
            <Button variant="outline" size="sm" onClick={() => addCable({ kind: "cat", fromLabel: "", toLabel: "", length: 10, unit: "m" })}>
              <Plus className="size-3 mr-1" /> Add Data Cable Run
            </Button>
          </CardContent>
        </Card>

        {/* Power Cable Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Power Cable Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cables.filter(c => c.kind === "power").length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No power cable runs defined yet. Click Regenerate to pull from the Wiring Diagram tab.</p>
            )}
            {cables.filter(c => c.kind === "power").map(renderCableRow)}
            <Button variant="outline" size="sm" onClick={() => addCable({ kind: "power", fromLabel: "", toLabel: "", length: 10, unit: "m" })}>
              <Plus className="size-3 mr-1" /> Add Power Cable Run
            </Button>
          </CardContent>
        </Card>

        {/* Fiber Cable Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="size-5" /> Fiber Cable Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cables.filter(c => c.kind === "fiber").length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No fiber cable runs defined yet.</p>
            )}
            {cables.filter(c => c.kind === "fiber").map(renderCableRow)}
            <Button variant="outline" size="sm" onClick={() => addCable({ kind: "fiber", fromLabel: "", toLabel: "", length: 100, unit: "m" })}>
              <Plus className="size-3 mr-1" /> Add Fiber Cable Run
            </Button>
          </CardContent>
        </Card>

        {/* Cable totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Cat5e/6 Data Total</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{totals.catTotalM.toFixed(1)}m</p>
              <p className="text-xs text-muted-foreground">{totals.catTotalFt.toFixed(0)}ft &mdash; {totals.catCount} runs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Power Cable Total</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{totals.powerTotalM.toFixed(1)}m</p>
              <p className="text-xs text-muted-foreground">{totals.powerTotalFt.toFixed(0)}ft &mdash; {totals.powerCount} runs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Fiber Total</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{totals.fiberTotalM.toFixed(1)}m</p>
              <p className="text-xs text-muted-foreground">{totals.fiberTotalFt.toFixed(0)}ft &mdash; {totals.fiberCount} runs</p>
            </CardContent>
          </Card>
        </div>

      </div>{/* /exportRef */}
    </div>
  );
}