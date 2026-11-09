'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getProcessorsAction } from './actions';
import { loadLedProducts } from '@/lib/led-products-client';
import type { Processor } from '@/services/supabase';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { LedProductCombobox } from '@/components/ui/led-product-combobox';
import { getCachedProcessors, setCachedProcessors } from '@/lib/data-cache';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedProjectPicker } from '@/components/calculator/saved-project-picker';
import { useSavedProjects } from '@/hooks/use-saved-projects';
import { getScreenProductId } from '@/lib/calculator-screens';
import {
  loadPowerDataSettings,
  powerDataSnapshot,
  savePowerDataSettings,
  type PowerDataSettings,
} from '@/lib/project-tab-saves';

interface LedProduct {
  id: string;
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  wattsPerTile: number;
  maxPowerWPerSqm: number | null;
  pixelPitchMm?: number | null;
  tileWidthMm?: number | null;
  tileHeightMm?: number | null;
  tileWeightKg?: number | null;
  maxBrightnessNit?: number | null;
  [key: string]: unknown;
}

function ProductInfoPanel({ product }: { product: LedProduct }) {
  const rows: { label: string; value: string }[] = [];
  if (product.pixelPitchMm) rows.push({ label: 'Pixel Pitch', value: `${product.pixelPitchMm}mm` });
  rows.push({ label: 'Resolution', value: `${product.tileWidthPx}\u00d7${product.tileHeightPx}` });
  if (product.tileWidthMm && product.tileHeightMm)
    rows.push({ label: 'Physical Size', value: `${product.tileWidthMm}\u00d7${product.tileHeightMm}mm` });
  if (product.tileWeightKg) rows.push({ label: 'Weight', value: `${product.tileWeightKg}kg` });
  if (product.maxBrightnessNit) rows.push({ label: 'Brightness', value: `${product.maxBrightnessNit} nit` });
  if (product.wattsPerTile) rows.push({ label: 'Power / Tile', value: `${product.wattsPerTile}W` });
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md border bg-muted/30 overflow-hidden mt-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 last:border-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

const REFRESH_RATES = ['23.98','24','25','29.97','30','48','50','59.94','60','72','75','90','100','120','144'];
const BIT_DEPTHS = ['8', '10', '12'];

export default function PowerDataPage() {
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = usePersistentState<string>('power-data:selectedProductId', '');
  const [selectedProcessorId, setSelectedProcessorId] = usePersistentState<string>('power-data:selectedProcessorId', '');
  const [circuitVoltage, setCircuitVoltage] = usePersistentState('power-data:circuitVoltage', '208');
  const [circuitAmperage, setCircuitAmperage] = usePersistentState('power-data:circuitAmperage', '20');
  const [safetyMargin, setSafetyMargin] = usePersistentState('power-data:safetyMargin', '80');
  const [refreshRate, setRefreshRate] = usePersistentState('power-data:refreshRate', '60');
  const [bitDepth, setBitDepth] = usePersistentState('power-data:bitDepth', '8');

  useEffect(() => {
    const cachedProcessors = getCachedProcessors();

    if (cachedProcessors) {
      setProcessors(cachedProcessors);
      setSelectedProcessorId(prev => prev && cachedProcessors.some(p => p.id === prev) ? prev : cachedProcessors[0].id);
    }

    const p1 = loadLedProducts().then(({ data, error }) => {
      if (error) {
        console.error('Failed to fetch LED products:', error);
        return;
      }
      if (data.length) {
        setProducts(data);
        setSelectedProductId(prev => prev && data.some(p => p.id === prev) ? prev : data[0].id);
      }
    });
    let p2: Promise<void> | null = null;
    if (!cachedProcessors) {
      p2 = getProcessorsAction().then(({ data }) => {
        if (data?.length) {
          setProcessors(data as Processor[]);
          setCachedProcessors('default', data as Processor[]);
          setSelectedProcessorId(prev => prev && data.some(p => p.id === prev) ? prev : data[0].id);
        }
      });
    }

    Promise.all([p1, p2]).finally(() => setLoading(false));
  }, []);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
  const selectedProcessor = useMemo(() => processors.find(p => p.id === selectedProcessorId), [processors, selectedProcessorId]);

  const { signedIn, projects, loading: projectsLoading, error: projectsError } = useSavedProjects();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [screenNotice, setScreenNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestedScreenRef = useRef<string | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const activeScreen = activeProject?.projectData.screens.find(s => s.id === activeScreenId) ?? null;
  const currentSettings: PowerDataSettings = {
    productId: selectedProductId,
    processorId: selectedProcessorId,
    circuitVoltage,
    circuitAmperage,
    safetyMargin,
    refreshRate,
    bitDepth,
  };
  const hasUnsavedChanges = activeScreen !== null && savedSnapshot !== powerDataSnapshot(currentSettings);

  const applySettings = (s: PowerDataSettings) => {
    setSelectedProductId(s.productId);
    setSelectedProcessorId(s.processorId);
    setCircuitVoltage(s.circuitVoltage);
    setCircuitAmperage(s.circuitAmperage);
    setSafetyMargin(s.safetyMargin);
    setRefreshRate(s.refreshRate);
    setBitDepth(s.bitDepth);
  };

  const loadScreen = async (projectId: string, screenId: string) => {
    requestedScreenRef.current = screenId;
    setActiveScreenId(screenId);
    setSaveError(null);
    setScreenNotice(null);
    const { data, error } = await loadPowerDataSettings(projectId, screenId);
    if (requestedScreenRef.current !== screenId) return;
    if (error) {
      setSaveError(error);
      return;
    }
    const screen = projects.find(p => p.id === projectId)?.projectData.screens.find(s => s.id === screenId);
    const screenProductId = screen ? getScreenProductId(screen) : null;
    const withScreenProduct = (s: PowerDataSettings): PowerDataSettings => ({ ...s, productId: screenProductId ?? s.productId });
    if (data) {
      const settings = withScreenProduct(data);
      applySettings(settings);
      setSavedSnapshot(powerDataSnapshot(settings));
    } else {
      const settings = withScreenProduct(currentSettings);
      if (screenProductId) setSelectedProductId(screenProductId);
      setSavedSnapshot(powerDataSnapshot(settings));
      setScreenNotice('This screen has no saved power settings yet. Save to keep these settings with it.');
    }
  };

  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    setActiveScreenId(null);
    setSavedSnapshot(null);
    setScreenNotice(null);
    setSaveError(null);
    const firstScreen = projects.find(p => p.id === projectId)?.projectData.screens[0];
    if (projectId && firstScreen) loadScreen(projectId, firstScreen.id);
  };

  const handleSave = async () => {
    if (!activeProject || !activeScreen) return;
    setSaving(true);
    setSaveError(null);
    const { success, error } = await savePowerDataSettings(activeProject.id, activeScreen.id, currentSettings);
    setSaving(false);
    if (!success) {
      setSaveError(error ?? 'Could not save to the project.');
      return;
    }
    setSavedSnapshot(powerDataSnapshot(currentSettings));
    setScreenNotice(null);
  };

  const debouncedAmperage = useDebouncedValue(circuitAmperage, 50);
  const debouncedSafetyMargin = useDebouncedValue(safetyMargin, 50);

  const {
    maxTilesPerPowerCircuit, maxTilesPerDataPort, maxTilesPerDistUnit, maxTilesPerTrunk,
    circuitWatts, tileWatts, pixelsPerPort, pixelsPerTile, hasDistribution,
  } = useMemo(() => {
    // Power
    const v = parseFloat(circuitVoltage) || 0;
    const a = parseFloat(debouncedAmperage) || 0;
    const margin = parseFloat(debouncedSafetyMargin) / 100 || 0;
    const circuitWatts = v * a * margin;
    const tileWatts = Number(selectedProduct?.wattsPerTile ?? 0);
    const maxTilesPerPowerCircuit = tileWatts > 0 ? Math.floor(circuitWatts / tileWatts) : 0;

    // Data — pixels_per_port represents the per-1G-output-port capacity (per data cable)
    const pixelsPerTile = (Number(selectedProduct?.tileWidthPx) || 0) * (Number(selectedProduct?.tileHeightPx) || 0);
    const baseHz = selectedProcessor?.baseRefreshRateHz ?? 60;
    const rateHz = parseFloat(refreshRate) || 60;
    const rawPxPerPort = selectedProcessor?.pixelsPerPort ?? 0;
    // Capacity scales inversely with refresh rate relative to the base rate:
    // lower rates get proportionally more pixels, higher rates get fewer.
    // Capacity also scales inversely with color bit depth (8-bit is the reference):
    // 10-bit = 8/10 of capacity, 12-bit = 8/12 of capacity.
    const depth = parseFloat(bitDepth) || 8;
    const pixelsPerPort = Math.floor(rawPxPerPort * (baseHz / rateHz) * (8 / depth));
    // Tiles per 1G data port (one physical cable to a tile group)
    const maxTilesPerDataPort = pixelsPerTile > 0 && pixelsPerPort > 0 ? Math.floor(pixelsPerPort / pixelsPerTile) : 0;

    // Distribution: e.g. Tessera XD unit has 10 × 1G sub-ports fed by 1 × 10G trunk
    const dist = selectedProcessor?.distributionPerPort ?? 1;
    const hasDistribution = dist > 1;
    // Tiles per distribution unit (e.g. per XD box) = tiles_per_port × sub-ports per unit
    const maxTilesPerDistUnit = maxTilesPerDataPort * dist;
    // Tiles per processor output trunk port (the 10G connector on the processor)
    const maxTilesPerTrunk = maxTilesPerDistUnit;

    return {
      maxTilesPerPowerCircuit, maxTilesPerDataPort, maxTilesPerDistUnit, maxTilesPerTrunk,
      circuitWatts, tileWatts, pixelsPerPort, pixelsPerTile, hasDistribution,
    };
  }, [selectedProduct, selectedProcessor, circuitVoltage, debouncedAmperage, debouncedSafetyMargin, refreshRate, bitDepth]);

  return (
    <div className="h-[calc(100svh-3.5rem)] flex overflow-hidden">
      {/* Left sidebar */}
      <div className="w-80 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
          <h2 className="font-semibold text-sm">Input Parameters</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configure power circuit and data port settings.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            <SavedProjectPicker
              signedIn={signedIn}
              projects={projects}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              activeProject={activeProject}
              activeScreenId={activeScreenId}
              saveAvailable={activeScreen !== null}
              screenNotice={screenNotice}
              hasUnsavedChanges={hasUnsavedChanges}
              saving={saving}
              saveError={saveError}
              onSelectProject={handleSelectProject}
              onSelectScreen={(screenId) => activeProject && loadScreen(activeProject.id, screenId)}
              onSave={handleSave}
            />

            {/* LED Product */}
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">LED Product</h3>
              <LedProductCombobox
                products={products}
                value={selectedProductId}
                onChange={setSelectedProductId}
              />
              {selectedProduct && <ProductInfoPanel product={selectedProduct} />}
            </div>

            <Separator />

            {/* Power Circuit */}
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Power Circuit</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Voltage</Label>
                  <Select value={circuitVoltage} onValueChange={setCircuitVoltage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="110">110V</SelectItem>
                      <SelectItem value="120">120V</SelectItem>
                      <SelectItem value="208">208V</SelectItem>
                      <SelectItem value="230">230V</SelectItem>
                      <SelectItem value="240">240V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amperage (A)</Label>
                  <Input type="number" value={circuitAmperage} onChange={e => setCircuitAmperage(e.target.value)} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Safety Margin (%)</Label>
                  <Input type="number" value={safetyMargin} onChange={e => setSafetyMargin(e.target.value)} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Usable circuit capacity: {Math.round(circuitWatts)}W
              </p>
            </div>

            <Separator />

            {/* Processor / Data */}
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Data Port</h3>
              <div className="space-y-1.5">
                <Label className="text-xs">Processor</Label>
                <LedProductCombobox
                  products={processors.map(p => ({ id: p.id, manufacturer: p.manufacturer, productName: p.modelName }))}
                  value={selectedProcessorId}
                  onChange={setSelectedProcessorId}
                  placeholder="Search processors…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Refresh Rate (Hz)</Label>
                <Select value={refreshRate} onValueChange={setRefreshRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REFRESH_RATES.map(r => <SelectItem key={r} value={r}>{r} Hz</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color Bit Depth</Label>
                <Select value={bitDepth} onValueChange={setBitDepth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BIT_DEPTHS.map(b => <SelectItem key={b} value={b}>{b}-bit</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedProcessor && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {selectedProcessor.outputPortCount} ports · {pixelsPerPort.toLocaleString()} px/1G port @ {refreshRate}Hz · {bitDepth}-bit
                  {hasDistribution && ` · ×${selectedProcessor.distributionPerPort} ${selectedProcessor.distributionUnitName ?? ''}`}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {loading ? (
            <>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </>
          ) : (
            <>
          {/* Power result */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">Max Tiles per Power Circuit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-7xl font-bold tracking-tight tabular-nums">{maxTilesPerPowerCircuit}</p>
              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{circuitVoltage}V · {circuitAmperage}A</p>
                  <p>Circuit rating</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{safetyMargin}%</p>
                  <p>Safety margin</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{tileWatts}W</p>
                  <p>Watts per tile</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data result */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">
                Max Tiles per Data Port{hasDistribution ? ` (per 1G cable)` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasDistribution ? (
                <>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Per 1G Data Port</p>
                      <p className="text-5xl font-bold tracking-tight tabular-nums">{maxTilesPerDataPort}</p>
                    </div>
                    <div className="text-2xl text-muted-foreground font-light">× {selectedProcessor?.distributionPerPort}</div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Per {selectedProcessor?.distributionUnitName ?? 'Distribution Box'}</p>
                      <p className="text-5xl font-bold tracking-tight tabular-nums text-primary">{maxTilesPerDistUnit}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{pixelsPerPort.toLocaleString()} px</p>
                      <p>Pixels per 1G port</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{(pixelsPerPort * (selectedProcessor?.distributionPerPort ?? 1)).toLocaleString()} px</p>
                      <p>Pixels per {selectedProcessor?.distributionUnitName ?? 'distribution unit'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-7xl font-bold tracking-tight tabular-nums">{maxTilesPerDataPort}</p>
                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{selectedProcessor ? `${selectedProcessor.manufacturer} ${selectedProcessor.modelName}` : '—'}</p>
                      <p>Processor</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{pixelsPerPort.toLocaleString()}</p>
                      <p>Pixels per port</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{pixelsPerTile.toLocaleString()}</p>
                      <p>Pixels per tile</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
