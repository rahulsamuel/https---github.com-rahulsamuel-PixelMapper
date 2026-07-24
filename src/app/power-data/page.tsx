'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getProducts } from '@/app/calculator/actions';
import { getProcessorsAction } from './actions';
import type { Processor } from '@/services/supabase';

interface LedProduct {
  id: string;
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  wattsPerTile: number;
  maxPowerWPerSqm: number | null;
  [key: string]: unknown;
}

const REFRESH_RATES = ['23.98','24','25','29.97','30','48','50','59.94','60','72','75','90','100','120','144'];

export default function PowerDataPage() {
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProcessorId, setSelectedProcessorId] = useState<string>('');
  const [circuitVoltage, setCircuitVoltage] = useState('208');
  const [circuitAmperage, setCircuitAmperage] = useState('20');
  const [safetyMargin, setSafetyMargin] = useState('80');
  const [refreshRate, setRefreshRate] = useState('60');

  useEffect(() => {
    getProducts().then(({ data }) => {
      if (data?.length) {
        setProducts(data as LedProduct[]);
        setSelectedProductId(data[0].id);
      }
    });
    getProcessorsAction().then(({ data }) => {
      if (data?.length) {
        setProcessors(data as Processor[]);
        setSelectedProcessorId(data[0].id);
      }
    });
  }, []);

  const manufacturers = useMemo(() => [...new Set(products.map(p => p.manufacturer))], [products]);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
  const selectedProcessor = useMemo(() => processors.find(p => p.id === selectedProcessorId), [processors, selectedProcessorId]);

  const selectedManufacturer = selectedProduct?.manufacturer ?? '';
  const availableProducts = useMemo(() => products.filter(p => p.manufacturer === selectedManufacturer), [products, selectedManufacturer]);

  const processorManufacturers = useMemo(() => [...new Set(processors.map(p => p.manufacturer))], [processors]);
  const selectedProcessorManufacturer = selectedProcessor?.manufacturer ?? '';
  const availableProcessors = useMemo(() => processors.filter(p => p.manufacturer === selectedProcessorManufacturer), [processors, selectedProcessorManufacturer]);

  const handleManufacturerChange = (val: string) => {
    const first = products.find(p => p.manufacturer === val);
    if (first) setSelectedProductId(first.id);
  };

  const handleProcessorManufacturerChange = (val: string) => {
    const first = processors.find(p => p.manufacturer === val);
    if (first) setSelectedProcessorId(first.id);
  };

  const { maxTilesPerPowerCircuit, maxTilesPerDataPort, circuitWatts, tileWatts, pixelsPerPort, pixelsPerTile } = useMemo(() => {
    // Power
    const v = parseFloat(circuitVoltage) || 0;
    const a = parseFloat(circuitAmperage) || 0;
    const margin = parseFloat(safetyMargin) / 100 || 0;
    const circuitWatts = v * a * margin;
    const tileWatts = Number(selectedProduct?.wattsPerTile ?? 0);
    const maxTilesPerPowerCircuit = tileWatts > 0 ? Math.floor(circuitWatts / tileWatts) : 0;

    // Data
    const pixelsPerTile = (Number(selectedProduct?.tileWidthPx) || 0) * (Number(selectedProduct?.tileHeightPx) || 0);
    const baseHz = selectedProcessor?.baseRefreshRateHz ?? 60;
    const rateHz = parseFloat(refreshRate) || 60;
    const rawPxPerPort = selectedProcessor?.pixelsPerPort ?? 0;
    // Scale capacity if refresh rate exceeds base
    const pixelsPerPort = rateHz > baseHz ? Math.floor(rawPxPerPort * (baseHz / rateHz)) : rawPxPerPort;
    const maxTilesPerDataPort = pixelsPerTile > 0 && pixelsPerPort > 0 ? Math.floor(pixelsPerPort / pixelsPerTile) : 0;

    return { maxTilesPerPowerCircuit, maxTilesPerDataPort, circuitWatts, tileWatts, pixelsPerPort, pixelsPerTile };
  }, [selectedProduct, selectedProcessor, circuitVoltage, circuitAmperage, safetyMargin, refreshRate]);

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

            {/* LED Product */}
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">LED Product</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manufacturer</Label>
                  <Select value={selectedManufacturer} onValueChange={handleManufacturerChange}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={!selectedManufacturer}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.productName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedProduct && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {Number(selectedProduct.tileWidthPx)}×{Number(selectedProduct.tileHeightPx)} px · {tileWatts}W/tile
                </p>
              )}
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manufacturer</Label>
                  <Select value={selectedProcessorManufacturer} onValueChange={handleProcessorManufacturerChange}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {processorManufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Processor</Label>
                  <Select value={selectedProcessorId} onValueChange={setSelectedProcessorId} disabled={!selectedProcessorManufacturer}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {availableProcessors.map(p => <SelectItem key={p.id} value={p.id}>{p.modelName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Refresh Rate (Hz)</Label>
                  <Select value={refreshRate} onValueChange={setRefreshRate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REFRESH_RATES.map(r => <SelectItem key={r} value={r}>{r} Hz</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedProcessor && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {selectedProcessor.outputPortCount} ports · {pixelsPerPort.toLocaleString()} px/port @ {refreshRate}Hz
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">

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
              <CardTitle className="text-base text-muted-foreground">Max Tiles per Data Port</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
