
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import type { RasterMapConfig } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Layout, FileImage, FileDown, FileCode, Printer, Video, Music, ClipboardList, Cpu, Zap, Ruler, Weight, Monitor, Layers } from "lucide-react";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

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
  pixelPitchMm?: number | null;
  maxBrightnessNit?: number | null;
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
  [key: string]: any;
}

const MEDIA_SERVERS = [
  { value: 'disguise', label: 'Disguise' },
  { value: 'disguise-vx4', label: 'Disguise VX4+' },
  { value: 'disguise-vx1', label: 'Disguise VX1' },
  { value: 'resolume', label: 'Resolume' },
  { value: ' hippotizer', label: 'Hippotizer' },
  { value: 'dataton', label: 'Dataton WATCHOUT' },
  { value: 'arkaos', label: 'ArKaos' },
  { value: 'other', label: 'Other' },
];

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function formatNumber(num: number, digits = 2) {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function mmToFeetInches(mm: number): string {
  const totalInches = mm / 25.4;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const wholeInches = Math.floor(inches);
  const fracInches = Math.round((inches - wholeInches) * 16);
  let fracStr = '';
  if (fracInches === 0) fracStr = '';
  else if (fracInches === 16) { wholeInches + 1; fracStr = ''; }
  else {
    const gcd = greatestCommonDivisor(fracInches, 16);
    fracStr = ` ${fracInches / gcd}/${16 / gcd}`;
  }
  return `${feet}' ${wholeInches}${fracStr}"`;
}

export function DeliverablesView() {
  const {
    screens,
    currentScreen,
    projectNumber,
    versionNumber,
    projectNotes,
    rasterMapConfig,
    rasterMapConfigs,
    rasterGroups,
    uploadedMaps,
    addUploadedMap,
    removeUploadedMap,
    mediaServer,
    preferredCodec,
    audioFormat,
    imageFormat,
    products,
    projectName,
  } = usePixelMap();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [processors, setProcessors] = useState<Processor[]>([]);

  // Fetch processors client-side for data requirements calculations
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('processor_library').select('*').eq('is_active', true).order('manufacturer').order('model_name');
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

  // Read power-data settings from localStorage (saved by the Power Data tab)
  const powerData = useMemo(() => {
    const readLS = (key: string): any => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : undefined;
      } catch { return undefined; }
    };
    return {
      selectedProductId: readLS('power-data:selectedProductId'),
      selectedProcessorId: readLS('power-data:selectedProcessorId'),
      circuitVoltage: readLS('power-data:circuitVoltage') ?? '208',
      circuitAmperage: readLS('power-data:circuitAmperage') ?? '20',
      safetyMargin: readLS('power-data:safetyMargin') ?? '80',
      refreshRate: readLS('power-data:refreshRate') ?? '60',
      bitDepth: readLS('power-data:bitDepth') ?? '8',
    };
  }, []);

  // Compute per-screen deliverable data
  const screenData = useMemo(() => {
    return screens.map(screen => {
      const activeTileCount = screen.tiles.filter(t => !t.deleted).length;
      const resWidth = screen.dimensions.screenWidth * screen.dimensions.tileWidth;
      const resHeight = screen.dimensions.screenHeight * screen.dimensions.tileHeight;
      const totalPixels = resWidth * resHeight;
      const gcd = greatestCommonDivisor(resWidth, resHeight);
      const aspectRatio = `${resWidth / gcd}:${resHeight / gcd} (${formatNumber(resWidth / resHeight, 2)}:1)`;

      // Physical dimensions
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

      // Power consumption
      const screenAreaM2 = (widthMm / 1000) * (heightMm / 1000);
      const totalTilesPower = activeTileCount * wattsPerTile;
      const maxPowerPerM2 = product?.maxPowerWPerSqm != null ? product.maxPowerWPerSqm : (screenAreaM2 > 0 ? totalTilesPower / screenAreaM2 : 0);
      const avgPowerPerM2 = product?.avgPowerWPerSqm != null ? product.avgPowerWPerSqm : maxPowerPerM2 * 0.4;
      const totalMaxPower = screenAreaM2 > 0 ? maxPowerPerM2 * screenAreaM2 : totalTilesPower;
      const totalAvgPower = screenAreaM2 > 0 ? avgPowerPerM2 * screenAreaM2 : totalTilesPower * 0.4;

      // Data requirements
      const selectedProcessor = processors.find(p => p.id === powerData.selectedProcessorId);
      const pixelsPerTile = screen.dimensions.tileWidth * screen.dimensions.tileHeight;
      const baseHz = selectedProcessor?.baseRefreshRateHz ?? 60;
      const rateHz = parseFloat(powerData.refreshRate) || 60;
      const depth = parseFloat(powerData.bitDepth) || 8;
      const rawPxPerPort = selectedProcessor?.pixelsPerPort ?? 0;
      const pixelsPerPort = Math.floor(rawPxPerPort * (baseHz / rateHz) * (8 / depth));
      const dist = selectedProcessor?.distributionPerPort ?? 1;
      const tilesPerDataPort = pixelsPerTile > 0 && pixelsPerPort > 0 ? Math.floor(pixelsPerPort / pixelsPerTile) : 0;
      const tilesPerDistUnit = tilesPerDataPort * dist;
      const totalPortsNeeded = tilesPerDataPort > 0 ? Math.ceil(activeTileCount / tilesPerDataPort) : 0;
      const processorsNeeded = selectedProcessor && selectedProcessor.outputPortCount > 0
        ? Math.ceil(totalPortsNeeded / selectedProcessor.outputPortCount)
        : (totalPortsNeeded > 0 ? 1 : 0);

      // Power requirements
      const v = parseFloat(powerData.circuitVoltage) || 0;
      const a = parseFloat(powerData.circuitAmperage) || 0;
      const margin = (parseFloat(powerData.safetyMargin) || 80) / 100;
      const circuitWatts = v * a * margin;
      const tileWatts = wattsPerTile;
      const tilesPerCircuit = tileWatts > 0 ? Math.floor(circuitWatts / tileWatts) : 0;
      const circuitsNeeded = tilesPerCircuit > 0 ? Math.ceil(activeTileCount / tilesPerCircuit) : 0;

      // Current draw
      const phaseDivisor = 1; // simplified; could read from calculator tab
      const maxAmps = totalMaxPower / (v * phaseDivisor);
      const avgAmps = totalAvgPower / (v * phaseDivisor);

      return {
        screen,
        product,
        activeTileCount,
        resWidth,
        resHeight,
        totalPixels,
        aspectRatio,
        widthMm,
        heightMm,
        widthIn,
        heightIn,
        widthFt,
        heightFt,
        totalWeightKg,
        totalWeightLbs,
        maxPowerPerM2,
        avgPowerPerM2,
        totalMaxPower,
        totalAvgPower,
        maxAmps,
        avgAmps,
        selectedProcessor,
        pixelsPerPort,
        tilesPerDataPort,
        tilesPerDistUnit,
        totalPortsNeeded,
        processorsNeeded,
        tilesPerCircuit,
        circuitsNeeded,
        circuitWatts,
      };
    });
  }, [screens, products, processors, powerData]);

  // Aggregate totals across all screens
  const totals = useMemo(() => {
    return screenData.reduce((acc, sd) => {
      acc.totalPixels += sd.totalPixels;
      acc.totalTiles += sd.activeTileCount;
      acc.totalWeightKg += sd.totalWeightKg;
      acc.totalMaxPower += sd.totalMaxPower;
      acc.totalAvgPower += sd.totalAvgPower;
      acc.totalPortsNeeded += sd.totalPortsNeeded;
      acc.totalCircuitsNeeded += sd.circuitsNeeded;
      acc.totalProcessorsNeeded = Math.max(acc.totalProcessorsNeeded, sd.processorsNeeded);
      return acc;
    }, { totalPixels: 0, totalTiles: 0, totalWeightKg: 0, totalMaxPower: 0, totalAvgPower: 0, totalPortsNeeded: 0, totalCircuitsNeeded: 0, totalProcessorsNeeded: 0 });
  }, [screenData]);

  const safeFileName = useMemo(() => {
    const name = (projectName || currentScreen.name || 'Untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
    const num = (projectNumber || 'NA').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ver = (versionNumber || '1.0').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `CONTENT_DELIVERABLES_${name}_${num}_${ver}`;
  }, [projectName, currentScreen.name, projectNumber, versionNumber]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          addUploadedMap(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [addUploadedMap]);

  const handleDownloadPdf = useCallback(async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#0F172A',
        pixelRatio: 2,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${safeFileName}.pdf`);

      toast({ title: "PDF Exported", description: "Your content deliverables have been downloaded." });
    } catch (error) {
      console.error("PDF Export failed", error);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [safeFileName, toast]);

  const handleDownloadHtml = useCallback(() => {
    const htmlContent = buildHtmlReport({
      screenData,
      totals,
      projectName: projectName || currentScreen.name,
      projectNumber,
      versionNumber,
      projectNotes,
      rasterMapConfig,
      rasterMapConfigs,
      rasterGroups,
      uploadedMaps,
      mediaServer,
      preferredCodec,
      audioFormat,
      imageFormat,
      powerData,
    });

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.html`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "HTML Exported", description: "Standalone content deliverables downloaded." });
  }, [screenData, totals, projectName, currentScreen.name, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterMapConfigs, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, powerData, safeFileName, toast]);

  // Memoize the heavy preview content so it only re-renders when data actually changes
  const previewContent = useMemo(() => {
    const mediaServerLabel = MEDIA_SERVERS.find(m => m.value === mediaServer)?.label || mediaServer;

    return (
      <div className="max-w-[900px] mx-auto bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-12 py-10 text-white" style={{ background: '#0F172A' }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight">Content Deliverables</h1>
              <p className="text-sm text-slate-400 mt-2">{projectName || currentScreen.name}</p>
            </div>
            <div className="text-right">
              <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full" style={{ background: '#2563EB' }}>
                v{versionNumber || '1.0'}
              </span>
              <p className="text-sm text-slate-400 mt-3">Ref: {projectNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-12 space-y-10">
          {/* Project Details */}
          <Section icon={<ClipboardList className="size-4" />} title="Project Details">
            <DetailRow label="Project Name" value={projectName || currentScreen.name} />
            <DetailRow label="Project Number" value={projectNumber || 'Unassigned'} />
            <DetailRow label="Revision" value={versionNumber || '1.0'} />
            <DetailRow label="Total Screens" value={String(screens.length)} />
            <DetailRow label="Total Tiles" value={String(totals.totalTiles)} />
            <DetailRow label="Total Pixels" value={totals.totalPixels.toLocaleString()} />
          </Section>

          {/* Per-Screen Breakdown */}
          {screenData.map((sd, idx) => (
            <div key={sd.screen.id}>
              {/* Screen Resolution & Properties */}
              <Section icon={<Monitor className="size-4" />} title={`Screen ${idx + 1}: ${sd.screen.name} — Resolution & Properties`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Resolution" value={`${sd.resWidth.toLocaleString()} × ${sd.resHeight.toLocaleString()} px`} />
                  <SpecCard label="Tile Configuration" value={`${sd.screen.dimensions.screenWidth}×${sd.screen.dimensions.screenHeight} tiles (${sd.activeTileCount} total)`} />
                  <SpecCard label="Total Pixels" value={sd.totalPixels.toLocaleString()} />
                  <SpecCard label="Aspect Ratio" value={sd.aspectRatio} />
                </div>
              </Section>

              {/* Physical Dimensions */}
              <Section icon={<Ruler className="size-4" />} title={`Screen ${idx + 1}: Physical Dimensions`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Metric (Total)" value={`${formatNumber(sd.widthMm / 1000, 2)} × ${formatNumber(sd.heightMm / 1000, 2)} m`} />
                  <SpecCard label="Imperial (Total)" value={`${formatNumber(sd.widthFt, 2)}' × ${formatNumber(sd.heightFt, 2)}'`} />
                  <SpecCard label="Millimeters" value={`${formatNumber(sd.widthMm, 1)} × ${formatNumber(sd.heightMm, 1)} mm`} />
                  <SpecCard label="Inches" value={`${formatNumber(sd.widthIn, 1)}" × ${formatNumber(sd.heightIn, 1)}"`} />
                </div>
              </Section>

              {/* Total Weight */}
              <Section icon={<Weight className="size-4" />} title={`Screen ${idx + 1}: Total Weight`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Metric" value={`${formatNumber(sd.totalWeightKg, 1)} kg`} />
                  <SpecCard label="Imperial" value={`${formatNumber(sd.totalWeightLbs, 1)} lbs`} />
                </div>
              </Section>

              {/* Power Consumption */}
              <Section icon={<Zap className="size-4" />} title={`Screen ${idx + 1}: Power Consumption`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Power/m² (Max)" value={`${formatNumber(sd.maxPowerPerM2, 0)} W/m²`} />
                  <SpecCard label="Power/m² (Avg)" value={`${formatNumber(sd.avgPowerPerM2, 0)} W/m²`} />
                  <SpecCard label="Total Power (Max)" value={`${formatNumber(sd.totalMaxPower, 2)} W`} />
                  <SpecCard label="Total Power (Avg)" value={`${formatNumber(sd.totalAvgPower, 2)} W`} />
                  <SpecCard label="Current Draw (Max)" value={`${formatNumber(sd.maxAmps, 2)} A`} />
                  <SpecCard label="Current Draw (Avg)" value={`${formatNumber(sd.avgAmps, 2)} A`} />
                </div>
              </Section>

              {/* Data Requirements */}
              <Section icon={<Cpu className="size-4" />} title={`Screen ${idx + 1}: Data Requirements`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Total Panels" value={String(sd.activeTileCount)} />
                  <SpecCard label="Total Pixels" value={sd.totalPixels.toLocaleString()} />
                  <SpecCard label="Screen Resolution" value={`${sd.resWidth} × ${sd.resHeight} px`} />
                  <SpecCard label="Processors Required" value={String(sd.processorsNeeded)} />
                  <SpecCard label="Panels per Port" value={String(sd.tilesPerDataPort)} />
                  <SpecCard label="Total Ports Needed" value={String(sd.totalPortsNeeded)} />
                </div>
                {sd.selectedProcessor && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {sd.selectedProcessor.manufacturer} {sd.selectedProcessor.modelName} Specifications
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Max Outputs:</span> <span className="font-semibold text-slate-800">{sd.selectedProcessor.outputPortCount}</span></div>
                      <div><span className="text-slate-500">Pixels per Port:</span> <span className="font-semibold text-slate-800">{sd.pixelsPerPort.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Base Refresh:</span> <span className="font-semibold text-slate-800">{sd.selectedProcessor.baseRefreshRateHz} Hz</span></div>
                      {sd.selectedProcessor.distributionPerPort > 1 && (
                        <div><span className="text-slate-500">Distribution:</span> <span className="font-semibold text-slate-800">×{sd.selectedProcessor.distributionPerPort} {sd.selectedProcessor.distributionUnitName ?? ''}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </Section>

              {/* Power Requirements */}
              <Section icon={<Zap className="size-4" />} title={`Screen ${idx + 1}: Power Requirements (${powerData.circuitVoltage}V)`}>
                <div className="grid grid-cols-2 gap-4">
                  <SpecCard label="Panels per Circuit" value={String(sd.tilesPerCircuit)} />
                  <SpecCard label="Total Circuits Needed" value={String(sd.circuitsNeeded)} />
                  <SpecCard label="Circuit Rating" value={`${powerData.circuitVoltage}V · ${powerData.circuitAmperage}A`} />
                  <SpecCard label="Usable Capacity" value={`${Math.round(sd.circuitWatts)}W`} />
                </div>
              </Section>

              {idx < screenData.length - 1 && <div className="border-t border-slate-200 my-8" />}
            </div>
          ))}

          {/* Media Server & Playback Requirements */}
          <Section icon={<Video className="size-4" />} title="Media Server & Playback Requirements">
            <div className="grid grid-cols-2 gap-4">
              <SpecCard label="Total Required Resolution" value={rasterMapConfig ? `${rasterMapConfig.outputWidth} × ${rasterMapConfig.outputHeight} px` : 'Not generated'} />
              <SpecCard label="Number of Outputs (Rasters)" value={String(rasterGroups.length)} />
              <SpecCard label="Selected Media Server" value={mediaServerLabel} />
              <SpecCard label="Preferred Codec" value={preferredCodec} />
              <SpecCard label="Image Format" value={imageFormat} />
              <SpecCard label="Audio Format" value={audioFormat || 'No audio required'} />
            </div>
          </Section>

          {/* Content Specifications */}
          <Section icon={<Layout className="size-4" />} title="Content Specifications">
            {rasterMapConfig ? (
              <div className="grid grid-cols-2 gap-4">
                <SpecCard label="Canvas Resolution" value={`${rasterMapConfig.totalWidth} × ${rasterMapConfig.totalHeight} px`} />
                <SpecCard label="Content Area" value={`${rasterMapConfig.contentWidth} × ${rasterMapConfig.contentHeight} px`} />
                <SpecCard label="Canvas Count" value={`${rasterMapConfig.slices.length} Canvases`} />
                <SpecCard label="Export Preset" value={`${safeFileName}.png`} small />
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                No pixel map generated. Switch to the Raster Map tab to define output resolution.
              </div>
            )}
          </Section>

          {/* Delivery Instructions */}
          {projectNotes && (
            <Section icon={<ClipboardList className="size-4" />} title="Delivery Instructions">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {projectNotes}
              </div>
            </Section>
          )}

          {/* Generated Pixel Map */}
          {rasterMapConfig?.previewImage && (
            <Section icon={<Layers className="size-4" />} title="Generated Pixel Map">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-black">
                <img src={rasterMapConfig.previewImage} alt="Generated Pixel Map" className="w-full block" />
              </div>
            </Section>
          )}

          {/* Reference Maps */}
          <Section icon={<FileImage className="size-4" />} title="Reference Maps" action={
            <Button size="sm" variant="outline" className="no-print h-7" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="size-3.5 mr-1.5" /> Upload
            </Button>
          }>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            {uploadedMaps.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {uploadedMaps.map((map, idx) => (
                  <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-900">
                    <img src={map} alt={`Reference ${idx + 1}`} className="w-full block" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      onClick={() => removeUploadedMap(idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                Upload external pixel maps or reference images for the content team.
              </div>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="px-12 py-6 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Generated by PixelMapper · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    );
  }, [screenData, totals, screens.length, projectName, currentScreen.name, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterMapConfigs, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, powerData, safeFileName, handleFileUpload, removeUploadedMap]);

  return (
    <div className="w-[1000px] space-y-6 pb-20">
      <div className="flex justify-end gap-3 mb-2 no-print">
        <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
          <FileCode className="size-4 mr-2" /> Export HTML
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isExporting}>
          <FileDown className="size-4 mr-2" /> {isExporting ? 'Generating...' : 'Download PDF'}
        </Button>
        <Button variant="default" size="sm" onClick={() => window.print()}>
          <Printer className="size-4 mr-2" /> Print
        </Button>
      </div>

      <div ref={contentRef} className="rounded-2xl overflow-hidden" style={{ background: '#0F172A' }}>
        {previewContent}
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────

function Section({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: '#2563EB' }}>{icon}</span>
        <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
          {title}
        </h3>
        <div className="flex-1 h-px bg-slate-200" />
        {action}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-48 text-sm text-slate-500 font-medium shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-semibold">{value}</span>
    </div>
  );
}

function SpecCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{label}</p>
      <p className={`font-bold text-slate-800 ${small ? 'text-xs break-all' : 'text-base'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  );
}

// ─── HTML Report Builder ────────────────────────────

function buildHtmlReport(opts: {
  screenData: any[];
  totals: any;
  projectName: string;
  projectNumber: string;
  versionNumber: string;
  projectNotes: string;
  rasterMapConfig: RasterMapConfig | null;
  rasterMapConfigs: Record<string, RasterMapConfig>;
  rasterGroups: any[];
  uploadedMaps: string[];
  mediaServer: string;
  preferredCodec: string;
  audioFormat: string;
  imageFormat: string;
  powerData: any;
}): string {
  const { screenData, totals, projectName, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, powerData } = opts;

  const screenSections = screenData.map((sd: any, idx: number) => `
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: ${sd.screen.name} — Resolution & Properties</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Resolution</div><div class="spec-value mono">${sd.resWidth.toLocaleString()} × ${sd.resHeight.toLocaleString()} px</div></div>
        <div class="spec-card"><div class="spec-label">Tile Configuration</div><div class="spec-value mono">${sd.screen.dimensions.screenWidth}×${sd.screen.dimensions.screenHeight} (${sd.activeTileCount} total)</div></div>
        <div class="spec-card"><div class="spec-label">Total Pixels</div><div class="spec-value mono">${sd.totalPixels.toLocaleString()}</div></div>
        <div class="spec-card"><div class="spec-label">Aspect Ratio</div><div class="spec-value">${sd.aspectRatio}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: Physical Dimensions</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Metric (Total)</div><div class="spec-value mono">${(sd.widthMm / 1000).toFixed(2)} × ${(sd.heightMm / 1000).toFixed(2)} m</div></div>
        <div class="spec-card"><div class="spec-label">Imperial (Total)</div><div class="spec-value mono">${sd.widthFt.toFixed(2)}' × ${sd.heightFt.toFixed(2)}'</div></div>
        <div class="spec-card"><div class="spec-label">Millimeters</div><div class="spec-value mono">${sd.widthMm.toFixed(1)} × ${sd.heightMm.toFixed(1)} mm</div></div>
        <div class="spec-card"><div class="spec-label">Inches</div><div class="spec-value mono">${sd.widthIn.toFixed(1)}" × ${sd.heightIn.toFixed(1)}"</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: Total Weight</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Metric</div><div class="spec-value mono">${sd.totalWeightKg.toFixed(1)} kg</div></div>
        <div class="spec-card"><div class="spec-label">Imperial</div><div class="spec-value mono">${sd.totalWeightLbs.toFixed(1)} lbs</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: Power Consumption</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Power/m² (Max)</div><div class="spec-value mono">${sd.maxPowerPerM2.toFixed(0)} W/m²</div></div>
        <div class="spec-card"><div class="spec-label">Power/m² (Avg)</div><div class="spec-value mono">${sd.avgPowerPerM2.toFixed(0)} W/m²</div></div>
        <div class="spec-card"><div class="spec-label">Total Power (Max)</div><div class="spec-value mono">${sd.totalMaxPower.toFixed(2)} W</div></div>
        <div class="spec-card"><div class="spec-label">Total Power (Avg)</div><div class="spec-value mono">${sd.totalAvgPower.toFixed(2)} W</div></div>
        <div class="spec-card"><div class="spec-label">Current Draw (Max)</div><div class="spec-value mono">${sd.maxAmps.toFixed(2)} A</div></div>
        <div class="spec-card"><div class="spec-label">Current Draw (Avg)</div><div class="spec-value mono">${sd.avgAmps.toFixed(2)} A</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: Data Requirements</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Total Panels</div><div class="spec-value mono">${sd.activeTileCount}</div></div>
        <div class="spec-card"><div class="spec-label">Total Pixels</div><div class="spec-value mono">${sd.totalPixels.toLocaleString()}</div></div>
        <div class="spec-card"><div class="spec-label">Screen Resolution</div><div class="spec-value mono">${sd.resWidth} × ${sd.resHeight} px</div></div>
        <div class="spec-card"><div class="spec-label">Processors Required</div><div class="spec-value mono">${sd.processorsNeeded}</div></div>
        <div class="spec-card"><div class="spec-label">Panels per Port</div><div class="spec-value mono">${sd.tilesPerDataPort}</div></div>
        <div class="spec-card"><div class="spec-label">Total Ports Needed</div><div class="spec-value mono">${sd.totalPortsNeeded}</div></div>
      </div>
      ${sd.selectedProcessor ? `
      <div class="processor-spec">
        <p class="proc-title">${sd.selectedProcessor.manufacturer} ${sd.selectedProcessor.modelName} Specifications</p>
        <div class="proc-grid">
          <div><span class="proc-label">Max Outputs:</span> <span class="proc-val">${sd.selectedProcessor.outputPortCount}</span></div>
          <div><span class="proc-label">Pixels per Port:</span> <span class="proc-val">${sd.pixelsPerPort.toLocaleString()}</span></div>
          <div><span class="proc-label">Base Refresh:</span> <span class="proc-val">${sd.selectedProcessor.baseRefreshRateHz} Hz</span></div>
          ${sd.selectedProcessor.distributionPerPort > 1 ? `<div><span class="proc-label">Distribution:</span> <span class="proc-val">×${sd.selectedProcessor.distributionPerPort} ${sd.selectedProcessor.distributionUnitName ?? ''}</span></div>` : ''}
        </div>
      </div>` : ''}
    </div>
    <div class="section">
      <div class="section-label">Screen ${idx + 1}: Power Requirements (${powerData.circuitVoltage}V)</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Panels per Circuit</div><div class="spec-value mono">${sd.tilesPerCircuit}</div></div>
        <div class="spec-card"><div class="spec-label">Total Circuits Needed</div><div class="spec-value mono">${sd.circuitsNeeded}</div></div>
        <div class="spec-card"><div class="spec-label">Circuit Rating</div><div class="spec-value mono">${powerData.circuitVoltage}V · ${powerData.circuitAmperage}A</div></div>
        <div class="spec-card"><div class="spec-label">Usable Capacity</div><div class="spec-value mono">${Math.round(sd.circuitWatts)}W</div></div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Deliverables - ${projectName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --slate-900: #0F172A; --slate-800: #1E293B; --slate-700: #334155;
    --slate-600: #475569; --slate-500: #64748B; --slate-400: #94A3B8;
    --slate-300: #CBD5E1; --slate-200: #E2E8F0; --slate-100: #F1F5F9;
    --slate-50: #F8FAFC; --blue-600: #2563EB; --blue-500: #3B82F6;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--slate-900); font-family: 'Inter', sans-serif; color: var(--slate-700); padding: 48px 24px; display: flex; justify-content: center; -webkit-font-smoothing: antialiased; }
  .report { width: 100%; max-width: 900px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
  .report-header { background: var(--slate-900); color: white; padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
  .report-header h1 { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  .report-header .subtitle { font-size: 14px; color: var(--slate-400); margin-top: 8px; }
  .report-header .version-badge { display: inline-block; background: var(--blue-600); color: white; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 999px; }
  .report-header .ref { font-size: 13px; color: var(--slate-400); margin-top: 12px; }
  .report-body { padding: 48px; }
  .section { margin-bottom: 32px; }
  .section:last-child { margin-bottom: 0; }
  .section-label { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--blue-600); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--slate-200); }
  .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid var(--slate-100); }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { width: 200px; font-size: 13px; color: var(--slate-500); font-weight: 500; flex-shrink: 0; }
  .detail-value { font-size: 14px; color: var(--slate-800); font-weight: 600; }
  .spec-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .spec-card { background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; padding: 20px; }
  .spec-card .spec-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate-500); font-weight: 600; margin-bottom: 8px; }
  .spec-card .spec-value { font-size: 16px; font-weight: 700; color: var(--slate-800); font-family: 'Space Grotesk', sans-serif; }
  .spec-card .spec-value.mono { font-family: 'Inter', sans-serif; font-variant-numeric: tabular-nums; }
  .processor-spec { margin-top: 16px; padding: 16px 20px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; }
  .proc-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate-500); margin-bottom: 12px; }
  .proc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 14px; }
  .proc-label { color: var(--slate-500); }
  .proc-val { font-weight: 600; color: var(--slate-800); }
  .notes-box { background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; padding: 20px 24px; font-size: 14px; line-height: 1.7; color: var(--slate-600); white-space: pre-wrap; }
  .image-block { border: 1px solid var(--slate-200); border-radius: 10px; overflow: hidden; background: var(--slate-900); }
  .image-block img { width: 100%; display: block; }
  .image-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .empty-state { padding: 40px; text-align: center; color: var(--slate-400); font-size: 14px; background: var(--slate-50); border: 1px dashed var(--slate-300); border-radius: 10px; }
  .footer { padding: 24px 48px; background: var(--slate-50); border-top: 1px solid var(--slate-200); text-align: center; font-size: 12px; color: var(--slate-400); font-weight: 500; }
</style>
</head>
<body>
<div class="report">
  <div class="report-header">
    <div>
      <h1>Content Deliverables</h1>
      <div class="subtitle">${projectName}</div>
    </div>
    <div style="text-align:right;">
      <span class="version-badge">v${versionNumber || '1.0'}</span>
      <div class="ref">Ref: ${projectNumber || 'N/A'}</div>
    </div>
  </div>
  <div class="report-body">
    <div class="section">
      <div class="section-label">Project Details</div>
      <div class="detail-row"><div class="detail-label">Project Name</div><div class="detail-value">${projectName}</div></div>
      <div class="detail-row"><div class="detail-label">Project Number</div><div class="detail-value">${projectNumber || 'Unassigned'}</div></div>
      <div class="detail-row"><div class="detail-label">Revision</div><div class="detail-value">${versionNumber || '1.0'}</div></div>
      <div class="detail-row"><div class="detail-label">Total Screens</div><div class="detail-value">${screenData.length}</div></div>
      <div class="detail-row"><div class="detail-label">Total Tiles</div><div class="detail-value">${totals.totalTiles}</div></div>
      <div class="detail-row"><div class="detail-label">Total Pixels</div><div class="detail-value">${totals.totalPixels.toLocaleString()}</div></div>
    </div>
    ${screenSections}
    <div class="section">
      <div class="section-label">Media Server & Playback Requirements</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Total Required Resolution</div><div class="spec-value mono">${rasterMapConfig ? `${rasterMapConfig.outputWidth} × ${rasterMapConfig.outputHeight} px` : 'Not generated'}</div></div>
        <div class="spec-card"><div class="spec-label">Number of Outputs (Rasters)</div><div class="spec-value mono">${rasterGroups.length}</div></div>
        <div class="spec-card"><div class="spec-label">Selected Media Server</div><div class="spec-value">${mediaServer}</div></div>
        <div class="spec-card"><div class="spec-label">Preferred Codec</div><div class="spec-value">${preferredCodec}</div></div>
        <div class="spec-card"><div class="spec-label">Image Format</div><div class="spec-value">${imageFormat}</div></div>
        <div class="spec-card"><div class="spec-label">Audio Format</div><div class="spec-value">${audioFormat || 'No audio required'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Content Specifications</div>
      ${rasterMapConfig ? `
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-label">Canvas Resolution</div><div class="spec-value mono">${rasterMapConfig.totalWidth} × ${rasterMapConfig.totalHeight} px</div></div>
        <div class="spec-card"><div class="spec-label">Content Area</div><div class="spec-value mono">${rasterMapConfig.contentWidth} × ${rasterMapConfig.contentHeight} px</div></div>
        <div class="spec-card"><div class="spec-label">Canvas Count</div><div class="spec-value mono">${rasterMapConfig.slices.length} Canvases</div></div>
        <div class="spec-card"><div class="spec-label">Export Preset</div><div class="spec-value mono" style="font-size:12px;word-break:break-all">CONTENT_DELIVERABLES.png</div></div>
      </div>` : '<div class="empty-state">No pixel map generated. Switch to the Raster Map tab to define output resolution.</div>'}
    </div>
    ${projectNotes ? `
    <div class="section">
      <div class="section-label">Delivery Instructions</div>
      <div class="notes-box">${projectNotes}</div>
    </div>` : ''}
    ${rasterMapConfig?.previewImage ? `
    <div class="section">
      <div class="section-label">Generated Pixel Map</div>
      <div class="image-block"><img src="${rasterMapConfig.previewImage}" alt="Generated Pixel Map" /></div>
    </div>` : ''}
    ${uploadedMaps.length > 0 ? `
    <div class="section">
      <div class="section-label">Reference Maps</div>
      <div class="image-grid">
        ${uploadedMaps.map((map, i) => `<div class="image-block"><img src="${map}" alt="Reference ${i+1}" /></div>`).join('')}
      </div>
    </div>` : ''}
  </div>
  <div class="footer">Generated by PixelMapper · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>
</body>
</html>`;
}

