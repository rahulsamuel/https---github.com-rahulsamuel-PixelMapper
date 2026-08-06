
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Monitor, Ruler, Weight, Zap, Cpu, Video, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface LedProduct {
  id: string;
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  tileWidthMm?: number | null;
  tileHeightMm?: number | null;
  tileWeightKg?: number | null;
  wattsPerTile?: number;
  maxPowerWPerSqm?: number | null;
  avgPowerWPerSqm?: number | null;
  [key: string]: any;
}

interface Processor {
  id: string;
  manufacturer: string;
  modelName: string;
  outputPortCount: number;
  pixelsPerPort: number;
  baseRefreshRateHz: number;
  totalPixelCapacity: number;
  distributionPerPort: number;
  distributionUnitName: string | null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function DeliverablesControls() {
  const { screens, currentScreen, products, mediaServer, preferredCodec, audioFormat, imageFormat, rasterMapConfig, rasterGroups } = usePixelMap();
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [expandedScreen, setExpandedScreen] = useState<string | null>(currentScreen?.id ?? null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('processor_library').select('*').eq('is_active', true);
      if (!error && data) {
        setProcessors(data.map((row: any) => ({
          id: row.id,
          manufacturer: row.manufacturer,
          modelName: row.model_name,
          outputPortCount: Number(row.output_port_count),
          pixelsPerPort: Number(row.pixels_per_port),
          baseRefreshRateHz: Number(row.base_refresh_rate_hz),
          totalPixelCapacity: Number(row.total_pixel_capacity),
          distributionPerPort: Number(row.distribution_per_port ?? 1),
          distributionUnitName: row.distribution_unit_name,
        })));
      }
    })();
  }, []);

  const powerData = useMemo(() => {
    const readLS = (key: string): any => {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
    };
    return {
      selectedProcessorId: readLS('power-data:selectedProcessorId'),
      circuitVoltage: readLS('power-data:circuitVoltage') ?? '208',
      circuitAmperage: readLS('power-data:circuitAmperage') ?? '20',
      safetyMargin: readLS('power-data:safetyMargin') ?? '80',
      refreshRate: readLS('power-data:refreshRate') ?? '60',
      bitDepth: readLS('power-data:bitDepth') ?? '8',
    };
  }, []);

  const screenData = useMemo(() => {
    return screens.map(screen => {
      const activeTileCount = screen.tiles.filter(t => !t.deleted).length;
      const resWidth = screen.dimensions.screenWidth * screen.dimensions.tileWidth;
      const resHeight = screen.dimensions.screenHeight * screen.dimensions.tileHeight;
      const totalPixels = resWidth * resHeight;
      const g = gcd(resWidth, resHeight);
      const aspectRatio = `${resWidth / g}:${resHeight / g} (${fmt(resWidth / resHeight, 2)}:1)`;

      const product = products.find((p: LedProduct) => p.id === screen.selectedProductId);
      const tileWidthMm = product?.tileWidthMm ?? 500;
      const tileHeightMm = product?.tileHeightMm ?? 500;
      const tileWeightKg = product?.tileWeightKg ?? 0;
      const wattsPerTile = product?.wattsPerTile ?? 0;

      const widthMm = screen.dimensions.screenWidth * tileWidthMm;
      const heightMm = screen.dimensions.screenHeight * tileHeightMm;
      const widthIn = widthMm / 25.4;
      const heightIn = heightMm / 25.4;
      const widthFt = widthIn / 12;
      const heightFt = heightIn / 12;
      const totalWeightKg = activeTileCount * tileWeightKg;
      const totalWeightLbs = totalWeightKg * 2.20462;

      const screenAreaM2 = (widthMm / 1000) * (heightMm / 1000);
      const totalTilesPower = activeTileCount * wattsPerTile;
      const maxPowerPerM2 = product?.maxPowerWPerSqm != null ? product.maxPowerWPerSqm : (screenAreaM2 > 0 ? totalTilesPower / screenAreaM2 : 0);
      const avgPowerPerM2 = product?.avgPowerWPerSqm != null ? product.avgPowerWPerSqm : maxPowerPerM2 * 0.4;
      const totalMaxPower = screenAreaM2 > 0 ? maxPowerPerM2 * screenAreaM2 : totalTilesPower;
      const totalAvgPower = screenAreaM2 > 0 ? avgPowerPerM2 * screenAreaM2 : totalTilesPower * 0.4;

      const selectedProcessor = processors.find(p => p.id === powerData.selectedProcessorId);
      const pixelsPerTile = screen.dimensions.tileWidth * screen.dimensions.tileHeight;
      const baseHz = selectedProcessor?.baseRefreshRateHz ?? 60;
      const rateHz = parseFloat(powerData.refreshRate) || 60;
      const depth = parseFloat(powerData.bitDepth) || 8;
      const rawPxPerPort = selectedProcessor?.pixelsPerPort ?? 0;
      const pixelsPerPort = Math.floor(rawPxPerPort * (baseHz / rateHz) * (8 / depth));
      const dist = selectedProcessor?.distributionPerPort ?? 1;
      const tilesPerDataPort = pixelsPerTile > 0 && pixelsPerPort > 0 ? Math.floor(pixelsPerPort / pixelsPerTile) : 0;
      const totalPortsNeeded = tilesPerDataPort > 0 ? Math.ceil(activeTileCount / tilesPerDataPort) : 0;
      const processorsNeeded = selectedProcessor && selectedProcessor.outputPortCount > 0
        ? Math.ceil(totalPortsNeeded / selectedProcessor.outputPortCount)
        : (totalPortsNeeded > 0 ? 1 : 0);

      const v = parseFloat(powerData.circuitVoltage) || 0;
      const a = parseFloat(powerData.circuitAmperage) || 0;
      const margin = (parseFloat(powerData.safetyMargin) || 80) / 100;
      const circuitWatts = v * a * margin;
      const tilesPerCircuit = wattsPerTile > 0 ? Math.floor(circuitWatts / wattsPerTile) : 0;
      const circuitsNeeded = tilesPerCircuit > 0 ? Math.ceil(activeTileCount / tilesPerCircuit) : 0;

      const maxAmps = totalMaxPower / v;
      const avgAmps = totalAvgPower / v;

      return {
        screen, product, activeTileCount, resWidth, resHeight, totalPixels, aspectRatio,
        widthMm, heightMm, widthIn, heightIn, widthFt, heightFt,
        totalWeightKg, totalWeightLbs,
        maxPowerPerM2, avgPowerPerM2, totalMaxPower, totalAvgPower, maxAmps, avgAmps,
        selectedProcessor, pixelsPerPort, tilesPerDataPort, totalPortsNeeded, processorsNeeded,
        tilesPerCircuit, circuitsNeeded, circuitWatts,
      };
    });
  }, [screens, products, processors, powerData]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Computed specifications for each screen. These values are driven by your LED Grid, Power &amp; Data, and Media Output settings.
      </p>

      {screenData.map((sd, idx) => {
        const isOpen = expandedScreen === sd.screen.id;
        return (
          <div key={sd.screen.id} className="rounded-lg border overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
              onClick={() => setExpandedScreen(isOpen ? null : sd.screen.id)}
            >
              <span className="text-sm font-semibold truncate">
                Screen {idx + 1}: {sd.screen.name}
              </span>
              {isOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
            </button>

            {isOpen && (
              <div className="p-3 space-y-4">
                {/* Screen Resolution & Properties */}
                <SubSection icon={<Monitor className="size-3.5" />} title="Resolution & Properties">
                  <DataRow label="Resolution" value={`${sd.resWidth.toLocaleString()} × ${sd.resHeight.toLocaleString()} px`} />
                  <DataRow label="Tile Config" value={`${sd.screen.dimensions.screenWidth}×${sd.screen.dimensions.screenHeight} (${sd.activeTileCount} total)`} />
                  <DataRow label="Total Pixels" value={sd.totalPixels.toLocaleString()} />
                  <DataRow label="Aspect Ratio" value={sd.aspectRatio} />
                </SubSection>

                {/* Physical Dimensions */}
                <SubSection icon={<Ruler className="size-3.5" />} title="Physical Dimensions">
                  <DataRow label="Metric" value={`${fmt(sd.widthMm / 1000, 2)} × ${fmt(sd.heightMm / 1000, 2)} m`} />
                  <DataRow label="Imperial" value={`${fmt(sd.widthFt, 2)}' × ${fmt(sd.heightFt, 2)}'`} />
                  <DataRow label="Millimeters" value={`${fmt(sd.widthMm, 1)} × ${fmt(sd.heightMm, 1)} mm`} />
                  <DataRow label="Inches" value={`${fmt(sd.widthIn, 1)}" × ${fmt(sd.heightIn, 1)}"`} />
                </SubSection>

                {/* Total Weight */}
                <SubSection icon={<Weight className="size-3.5" />} title="Total Weight">
                  <DataRow label="Metric" value={`${fmt(sd.totalWeightKg, 1)} kg`} />
                  <DataRow label="Imperial" value={`${fmt(sd.totalWeightLbs, 1)} lbs`} />
                </SubSection>

                {/* Power Consumption */}
                <SubSection icon={<Zap className="size-3.5" />} title="Power Consumption">
                  <DataRow label="Power/m² (Max)" value={`${fmt(sd.maxPowerPerM2, 0)} W/m²`} />
                  <DataRow label="Power/m² (Avg)" value={`${fmt(sd.avgPowerPerM2, 0)} W/m²`} />
                  <DataRow label="Total Power (Max)" value={`${fmt(sd.totalMaxPower, 2)} W`} />
                  <DataRow label="Total Power (Avg)" value={`${fmt(sd.totalAvgPower, 2)} W`} />
                  <DataRow label="Current (Max)" value={`${fmt(sd.maxAmps, 2)} A`} />
                  <DataRow label="Current (Avg)" value={`${fmt(sd.avgAmps, 2)} A`} />
                </SubSection>

                {/* Data Requirements */}
                <SubSection icon={<Cpu className="size-3.5" />} title="Data Requirements">
                  <DataRow label="Total Panels" value={String(sd.activeTileCount)} />
                  <DataRow label="Total Pixels" value={sd.totalPixels.toLocaleString()} />
                  <DataRow label="Screen Resolution" value={`${sd.resWidth} × ${sd.resHeight} px`} />
                  <DataRow label="Processors Required" value={String(sd.processorsNeeded)} />
                  <DataRow label="Panels per Port" value={String(sd.tilesPerDataPort)} />
                  <DataRow label="Total Ports Needed" value={String(sd.totalPortsNeeded)} />
                  {sd.selectedProcessor && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sd.selectedProcessor.manufacturer} {sd.selectedProcessor.modelName}
                      </p>
                      <DataRow label="Max Outputs" value={String(sd.selectedProcessor.outputPortCount)} />
                      <DataRow label="Pixels per Port" value={sd.pixelsPerPort.toLocaleString()} />
                      <DataRow label="Base Refresh" value={`${sd.selectedProcessor.baseRefreshRateHz} Hz`} />
                      {sd.selectedProcessor.distributionPerPort > 1 && (
                        <DataRow label="Distribution" value={`×${sd.selectedProcessor.distributionPerPort} ${sd.selectedProcessor.distributionUnitName ?? ''}`} />
                      )}
                    </div>
                  )}
                </SubSection>

                {/* Power Requirements */}
                <SubSection icon={<Zap className="size-3.5" />} title={`Power Requirements (${powerData.circuitVoltage}V)`}>
                  <DataRow label="Panels per Circuit" value={String(sd.tilesPerCircuit)} />
                  <DataRow label="Circuits Needed" value={String(sd.circuitsNeeded)} />
                  <DataRow label="Circuit Rating" value={`${powerData.circuitVoltage}V · ${powerData.circuitAmperage}A`} />
                  <DataRow label="Usable Capacity" value={`${Math.round(sd.circuitWatts)}W`} />
                </SubSection>
              </div>
            )}
          </div>
        );
      })}

      <Separator />

      {/* Media Server & Playback */}
      <SubSection icon={<Video className="size-3.5" />} title="Media Server & Playback">
        <DataRow label="Total Required Resolution" value={rasterMapConfig ? `${rasterMapConfig.outputWidth} × ${rasterMapConfig.outputHeight} px` : 'Not generated'} />
        <DataRow label="Number of Outputs" value={String(rasterGroups.length)} />
        <DataRow label="Selected Media Server" value={mediaServer || 'None'} />
        <DataRow label="Preferred Codec" value={preferredCodec || 'None'} />
        <DataRow label="Image Format" value={imageFormat || 'None'} />
        <DataRow label="Audio Format" value={audioFormat || 'No audio required'} />
      </SubSection>
    </div>
  );
}

function SubSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-primary">{icon}</span>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-right">{value}</span>
    </div>
  );
}
