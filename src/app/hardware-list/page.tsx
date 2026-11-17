'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedProjectPicker } from '@/components/calculator/saved-project-picker';
import { useSavedPixelMapSelection } from '@/hooks/use-saved-pixel-map-selection';
import { loadLedProducts } from '@/lib/led-products-client';
import type { LedProduct } from '@/services/supabase';
import { getScreenProductId } from '@/lib/calculator-screens';
import { checkSaveTarget } from '@/lib/project-selection-guard';
import { ProjectMismatchDialog } from '@/components/projects/project-mismatch-dialog';
import { useSaveActivity } from '@/contexts/save-activity-context';
import {
  calculateHardware,
  aggregateHardware,
  hardwareListText,
  hardwareListCsv,
  getScreenMetrics,
  HARDWARE_ITEM_LABELS,
  DEFAULT_HARDWARE_CONFIG,
  type ScreenHardwareConfig,
  type HardwareItem,
  type HardwareItemId,
} from '@/lib/hardware-list';
import {
  loadHardwareListSave,
  saveHardwareListSave,
} from '@/lib/hardware-list-saves';
import {
  Copy, FileSpreadsheet, FileDown, AlertTriangle, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScreenRow {
  screenId: string;
  name: string;
  config: ScreenHardwareConfig;
  totalTiles: number;
  screenWidth: number;
  screenHeight: number;
  screenWeightKg: number | null;
  widthM: number | null;
  heightM: number | null;
  productId: string | null;
  hasSize: boolean;
  items: HardwareItem[];
}

const MOUNTING_LABELS: Record<ScreenHardwareConfig['mountingType'], string> = {
  flown: 'Flown',
  'ground-stack': 'Ground Stack',
  floor: 'Floor',
};
const RIGGING_LABELS: Record<ScreenHardwareConfig['riggingBarType'], string> = {
  mixed: 'Mixed',
  double: 'Double Only',
  single: 'Single Only',
};

function configSnapshot(config: ScreenHardwareConfig): string {
  return JSON.stringify([config.mountingType, config.riggingBarType, config.cornerBlocks, config.sandbagWeight, config.adjustments]);
}

function toSlug(name: string): string {
  return name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'hardware-list';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HardwareListPage() {
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const {
    signedIn, summaries, listLoading, listError, activeProject, projectError,
    activeScreenId, selectProject, selectScreen, refreshActiveProject, tabIdentifiers,
  } = useSavedPixelMapSelection();
  const { toast } = useToast();
  const { isSaving: saving, trackSave } = useSaveActivity();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loadedConfigs, setLoadedConfigs] = useState<Record<string, ScreenHardwareConfig>>({});
  const configsLoadedRef = useRef<string | null>(null);

  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    let stale = false;
    loadLedProducts().then(({ data }) => {
      if (stale) return;
      if (data.length) setProducts(data);
      setProductsLoading(false);
    });
    return () => { stale = true; };
  }, []);

  // Build rows for every screen in the active project, merging loaded configs.
  const screens: ScreenRow[] = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.projectData.screens.map((screen) => {
      const productId = getScreenProductId(screen);
      const product = products.find(p => p.id === productId);
      const config = loadedConfigs[screen.id] ?? DEFAULT_HARDWARE_CONFIG;
      const metrics = getScreenMetrics(screen, product?.tileWeightKg ?? null);
      return {
        screenId: screen.id,
        name: screen.name,
        config,
        totalTiles: metrics.totalTiles,
        screenWidth: metrics.screenWidth,
        screenHeight: metrics.screenHeight,
        screenWeightKg: metrics.screenWeightKg,
        widthM: metrics.widthM,
        heightM: metrics.heightM,
        productId,
        hasSize: metrics.screenWidth > 0 && metrics.screenHeight > 0,
        items: calculateHardware(config, metrics),
      };
    });
  }, [activeProject, loadedConfigs, products]);

  const activeScreenRow = screens.find(s => s.screenId === activeScreenId) ?? screens[0] ?? null;

  const currentKey = activeScreenRow ? configSnapshot(activeScreenRow.config) : null;

  const hasUnsavedChanges = activeScreenRow !== null && savedKey !== currentKey;

  const handleSelectProject = async (projectId: string | null) => {
    setSavedKey(null);
    setSaveError(null);
    configsLoadedRef.current = null;
    setLoadedConfigs({});
    await selectProject(projectId);
  };

  // Load saved hardware configs when the active project changes.
  useEffect(() => {
    if (!activeProject || configsLoadedRef.current === activeProject.id) return;
    configsLoadedRef.current = activeProject.id;
    let stale = false;
    loadHardwareListSave(activeProject.id).then(({ data, error }) => {
      if (stale) return;
      if (error) {
        setSaveError(error);
        return;
      }
      if (data) {
        const map: Record<string, ScreenHardwareConfig> = {};
        for (const s of data.screens) map[s.screenId] = s.config;
        setLoadedConfigs(map);
        setSavedKey(null);
      }
    });
    return () => { stale = true; };
  }, [activeProject]);

  const updateConfig = (screenId: string, patch: Partial<ScreenHardwareConfig>) => {
    setLoadedConfigs(prev => ({ ...prev, [screenId]: { ...(prev[screenId] ?? DEFAULT_HARDWARE_CONFIG), ...patch } }));
  };

  const updateAdjustment = (screenId: string, itemId: HardwareItemId, raw: string) => {
    const current = loadedConfigs[screenId] ?? DEFAULT_HARDWARE_CONFIG;
    const adjustments = { ...current.adjustments };
    if (raw === '' || Number(raw) === 0) delete adjustments[itemId];
    else adjustments[itemId] = Number(raw) || 0;
    updateConfig(screenId, { adjustments });
  };

  const handleSave = () => trackSave(async () => {
    if (!activeProject) return;
    const check = await checkSaveTarget(activeProject.id, 'hardware_list', tabIdentifiers.hardware_list ?? null);
    if (check === 'mismatch') {
      setMismatchOpen(true);
      return;
    }
    if (check === 'error') {
      setSaveError('Could not verify this project. Please try again.');
      return;
    }
    setSaveError(null);
    const { success, error } = await saveHardwareListSave(
      activeProject.id,
      { screens: screens.map(s => ({ screenId: s.screenId, config: s.config })) }
    );
    if (!success) {
      setSaveError(error ?? 'Could not save to the project.');
      return;
    }
    await refreshActiveProject();
    if (activeScreenRow) setSavedKey(configSnapshot(activeScreenRow.config));
  });

  const aggregate = useMemo(() => aggregateHardware(screens.map(s => ({ config: s.config, items: s.items }))), [screens]);
  const totalWeightKg = useMemo(
    () => screens.reduce((sum, s) => s.screenWeightKg !== null ? sum + s.screenWeightKg : sum, 0),
    [screens]
  );
  const weightUnknown = screens.some(s => s.hasSize && s.screenWeightKg === null);

  const perScreenForExport = screens.map(s => ({ name: s.name, items: s.items }));
  const projectName = activeProject?.projectName?.trim() || 'Untitled Project';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hardwareListText(projectName, aggregate, perScreenForExport));
      toast({ title: 'Copied', description: 'Hardware list copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not access the clipboard.', variant: 'destructive' });
    }
  };

  const handleExportCsv = () => {
    const csv = hardwareListCsv(projectName, aggregate, perScreenForExport);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${toSlug(projectName)}-hardware-list.csv`);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const M = 14;
      const W = 210 - M * 2;
      let y = 20;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
      pdf.text(`Hardware List — ${projectName}`, M, y);
      y += 8;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, M, y);
      y += 10;

      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('Total hardware (all screens)', M, y);
      y += 6;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      for (const item of aggregate) {
        pdf.text(item.label, M + 4, y);
        pdf.text(String(item.quantity), 210 - M - 4, y, { align: 'right' });
        y += 5.5;
      }
      y += 4;

      for (const screen of perScreenForExport) {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
        pdf.text(screen.name, M, y);
        y += 5.5;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        if (screen.items.length === 0) {
          pdf.text('(no hardware — configure the screen first)', M + 4, y);
          y += 5.5;
        }
        for (const item of screen.items) {
          pdf.text(item.label, M + 4, y);
          pdf.text(String(item.quantity), 210 - M - 4, y, { align: 'right' });
          y += 5.5;
        }
        y += 3;
      }

      if (y > 250) { pdf.addPage(); y = 20; }
      y += 4;
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8);
      pdf.text(
        'Quantities are planning estimates only. Verify all support hardware with the manufacturer or a qualified engineer.',
        M, y, { maxWidth: W }
      );
      pdf.save(`${toSlug(projectName)}-hardware-list.pdf`);
    } catch {
      toast({ title: 'Export failed', description: 'Could not generate the PDF.', variant: 'destructive' });
    } finally {
      setExportingPdf(false);
    }
  };

  const canExport = aggregate.length > 0;

  return (
    <div className="h-[calc(100svh-3.5rem)] flex overflow-hidden">
      <ProjectMismatchDialog
        open={mismatchOpen}
        onBackToList={() => { setMismatchOpen(false); handleSelectProject(null); }}
        onClose={() => setMismatchOpen(false)}
      />
      {/* Left sidebar */}
      <div className="w-80 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
          <h2 className="font-semibold text-sm">Hardware Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Per-screen support hardware settings.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <SavedProjectPicker
              signedIn={signedIn}
              projects={summaries}
              projectsLoading={listLoading}
              projectsError={listError ?? projectError}
              activeProject={activeProject}
              activeScreenId={activeScreenId}
              saveAvailable={activeScreenRow !== null}
              hasUnsavedChanges={hasUnsavedChanges}
              saving={saving}
              saveError={saveError}
              onSelectProject={handleSelectProject}
              onSelectScreen={selectScreen}
              onSave={handleSave}
            />

            {screens.length === 0 && activeProject && (
              <p className="text-xs text-muted-foreground">
                This project has no screens yet. Add screens in the Pixel Map first.
              </p>
            )}

            {screens.map((screen, index) => (
              <div
                key={screen.screenId}
                className={`rounded-md border p-3 space-y-3 ${activeScreenRow?.screenId === screen.screenId ? 'border-primary/50' : ''}`}
              >
                <button
                  type="button"
                  className="text-left w-full font-medium text-sm hover:text-primary transition-colors"
                  onClick={() => selectScreen(screen.screenId)}
                >
                  {index + 1}. {screen.name}
                </button>

                <div className="space-y-1.5">
                  <Label className="text-xs">Mounting Type</Label>
                  <Select
                    value={screen.config.mountingType}
                    onValueChange={v => updateConfig(screen.screenId, { mountingType: v as ScreenHardwareConfig['mountingType'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flown">Flown</SelectItem>
                      <SelectItem value="ground-stack">Ground Stack</SelectItem>
                      <SelectItem value="floor">Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Rigging Bar Type</Label>
                  <Select
                    value={screen.config.riggingBarType}
                    onValueChange={v => updateConfig(screen.screenId, { riggingBarType: v as ScreenHardwareConfig['riggingBarType'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="double">Double Only</SelectItem>
                      <SelectItem value="single">Single Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Corner Blocks</Label>
                  <Switch
                    checked={screen.config.cornerBlocks}
                    onCheckedChange={v => updateConfig(screen.screenId, { cornerBlocks: v })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Sandbag Weight</Label>
                  <Select
                    value={screen.config.sandbagWeight}
                    onValueChange={v => updateConfig(screen.screenId, { sandbagWeight: v as ScreenHardwareConfig['sandbagWeight'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 lb</SelectItem>
                      <SelectItem value="35">35 lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {productsLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </>
          ) : !activeProject ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Select a saved project to build its hardware list.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Project summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground">{projectName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{screens.length}</p>
                      <p>Screens</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {screens.reduce((sum, s) => sum + s.totalTiles, 0)}
                      </p>
                      <p>Total tiles</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {weightUnknown ? '~' : ''}{totalWeightKg > 0 ? `${Math.round(totalWeightKg)} kg` : '—'}
                      </p>
                      <p>Total screen weight</p>
                    </div>
                  </div>
                  {weightUnknown && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                      Some screens use a product without a known tile weight, so the total weight is partial.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cumulative manifest */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground">Total Hardware Required</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={handleCopy} disabled={!canExport}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={handleExportCsv} disabled={!canExport}>
                      <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={handleExportPdf} disabled={!canExport || exportingPdf}>
                      {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {aggregate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hardware yet. Choose a project with configured screens, or adjust the settings on the left.
                    </p>
                  ) : (
                    <div className="rounded-md border bg-muted/30 overflow-hidden">
                      {aggregate.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <span className="text-xs font-semibold tabular-nums">{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Per-screen breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground">Screen Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {screens.map((screen, i) => (
                    <div key={screen.screenId} className="rounded-md border overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{i + 1}. {screen.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {screen.hasSize
                              ? `${screen.screenWidth} × ${screen.screenHeight} tiles · ${MOUNTING_LABELS[screen.config.mountingType]} · ${RIGGING_LABELS[screen.config.riggingBarType]} bars${screen.widthM ? ` · ${screen.widthM.toFixed(1)} × ${screen.heightM?.toFixed(1)} m` : ''}`
                              : 'Screen size not set — finish setup in the Pixel Map'}
                          </p>
                        </div>
                        {screen.screenWeightKg !== null && (
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">{screen.screenWeightKg} kg</span>
                        )}
                      </div>
                      {screen.items.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No hardware quantities for this screen.</p>
                      ) : (
                        <div>
                          {screen.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 last:border-0">
                              <span className="text-xs text-muted-foreground">{item.label}</span>
                              <span className="text-xs font-semibold tabular-nums">{item.quantity}</span>
                            </div>
                          ))}
                          <div className="px-3 py-2 flex items-center justify-end gap-2">
                            <span className="text-[10px] text-muted-foreground">Adjust:</span>
                            {(Object.keys(HARDWARE_ITEM_LABELS) as HardwareItemId[])
                              .filter(id => screen.items.some(it => it.id === id))
                              .map(id => (
                                <span key={id} className="flex items-center gap-1">
                                  <label className="text-[10px] text-muted-foreground">{HARDWARE_ITEM_LABELS[id]}</label>
                                  <Input
                                    type="number"
                                    className="h-6 w-14 text-xs"
                                    value={screen.config.adjustments[id] ?? ''}
                                    placeholder="0"
                                    onChange={e => updateAdjustment(screen.screenId, id, e.target.value)}
                                  />
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground">
                    Quantities are planning estimates based on screen size and the selected mounting configuration.
                    Adjust each quantity above if your hardware system requires it, and always verify support
                    hardware with the manufacturer or a qualified engineer.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}