
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import type { RasterMapConfig, Screen, ActiveBounds } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileDown, FileCode, Printer, Monitor, Video, Music, Image, Layers, Cpu, Download } from "lucide-react";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface LedProduct {
  id: string;
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  tileWidthMm?: number | null;
  tileHeightMm?: number | null;
  [key: string]: any;
}

interface ScreenProductInfo {
  key: string;
  manufacturer: string;
  productName: string;
  dimensions: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function DeliverablesView() {
  const {
    screens,
    currentScreen,
    projectNumber,
    versionNumber,
    projectNotes,
    projectName,
    mediaServer,
    preferredCodec,
    videoContainer,
    frameRate,
    audioEmbedded,
    samplingRate,
    audioBitRate,
    imageFormat,
    products,
    rasterMapConfigs,
    createScreenContentCanvas,
    includeTextOverlaysInDownload,
  } = usePixelMap();

  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pixelMapImages, setPixelMapImages] = useState<Record<string, string>>({});

  const safeFileName = useMemo(() => {
    const name = (projectName || currentScreen.name || 'Untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
    const num = (projectNumber || 'NA').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ver = (versionNumber || '1.0').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `CONTENT_DELIVERABLES_${name}_${num}_${ver}`;
  }, [projectName, currentScreen.name, projectNumber, versionNumber]);

  // Generate per-screen pixel map previews using the canvas renderer
  useEffect(() => {
    const generatePreviews = () => {
      const images: Record<string, string> = {};
      for (const screen of screens) {
        const rasterConfig = rasterMapConfigs?.[screen.rasterGroupId ?? 'raster-1'];
        const arrangement = rasterConfig?.screenArrangement?.find(a => a.screenId === screen.id);
        const bounds = arrangement?.activeBounds ?? null;
        const canvas = createScreenContentCanvas?.(screen, bounds, includeTextOverlaysInDownload);
        if (canvas) {
          images[screen.id] = canvas.toDataURL('image/png');
        }
      }
      setPixelMapImages(images);
    };
    generatePreviews();
  }, [screens, rasterMapConfigs, createScreenContentCanvas, includeTextOverlaysInDownload]);

  const screenData = useMemo(() => {
    return screens.map((screen, idx) => {
      const activeTileCount = screen.tiles.filter(t => !t.deleted).length;
      const effectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
      const hasSections = screen.sections.length > 0;
      const resWidth = hasSections
        ? screen.sections.reduce((total, section) => total + section.columnCount * section.tileWidthPx, 0)
        : screen.dimensions.screenWidth * screen.dimensions.tileWidth;
      const resHeight = hasSections
        ? (screen.sections[0]?.tileHeightPx ?? screen.dimensions.tileHeight) * effectiveHeight
        : screen.dimensions.screenHeight * screen.dimensions.tileHeight;
      const totalPixels = resWidth * resHeight;
      const g = gcd(resWidth, resHeight);
      const aspectRatio = `${resWidth / g}:${resHeight / g}`;
      const sectionProducts = hasSections
        ? screen.sections.map(section => ({ section, product: products.find((p: LedProduct) => p.id === section.productId) }))
        : [{ section: null, product: products.find((p: LedProduct) => p.id === screen.selectedProductId) }];
      const ledProducts = sectionProducts.reduce<ScreenProductInfo[]>((result, entry) => {
        if (!entry.product) return result;
        const widthMm = entry.section?.tileWidthMm ?? entry.product.tileWidthMm;
        const heightMm = entry.section?.tileHeightMm ?? entry.product.tileHeightMm;
        const sizeLabel = widthMm && heightMm ? ` (${Math.round(widthMm)}x${Math.round(heightMm)})` : '';
        const key = `${entry.product.id}:${widthMm ?? ''}:${heightMm ?? ''}`;
        if (result.some(item => item.key === key)) return result;
        result.push({
          key,
          manufacturer: entry.product.manufacturer,
          productName: `${entry.product.productName}${sizeLabel}`,
          dimensions: `${entry.product.tileWidthPx} × ${entry.product.tileHeightPx} px`,
        });
        return result;
      }, []);
      const ledProductDimensions = ledProducts.map(product => product.dimensions).join(' / ') || 'N/A';
      const ledManufacturer = Array.from(new Set(ledProducts.map(product => product.manufacturer))).join(' / ') || 'N/A';
      const ledProductName = ledProducts.map(product => product.productName).join(' / ') || 'N/A';
      const screenRes = `${resWidth.toLocaleString()} × ${resHeight.toLocaleString()} px`;
      const containerExtension = videoContainer.trim().toLowerCase().replace(/^\./, '') || 'mp4';
      const contentFileName = `${(projectName || screen.name || 'screen').replace(/[^a-zA-Z0-9_-]/g, '_')}_${idx + 1}_${(projectNumber || 'NA').replace(/[^a-zA-Z0-9_-]/g, '_')}.${containerExtension}`;
      const safeScreenName = (screen.name || 'screen').replace(/[^a-zA-Z0-9_-]/g, '_');
      const pixelMapFileName = `PIXEL_MAP_${safeScreenName}_${resWidth}x${resHeight}.png`;
      const previewImage = pixelMapImages[screen.id];

      return {
        screen, idx, activeTileCount, resWidth, resHeight, totalPixels, aspectRatio,
        ledProductDimensions, ledManufacturer, ledProductName,
        screenRes, contentFileName, pixelMapFileName, previewImage,
      };
    });
  }, [screens, products, projectNumber, projectName, pixelMapImages]);

  // Get raster output dimensions for "Total Required Resolution"
  const totalRequiredResolution = useMemo(() => {
    const config = rasterMapConfigs?.[currentScreen.rasterGroupId ?? 'raster-1'];
    if (config && config.outputWidth && config.outputHeight) {
      return `${config.outputWidth.toLocaleString()} × ${config.outputHeight.toLocaleString()} px`;
    }
    return 'N/A';
  }, [rasterMapConfigs, currentScreen.rasterGroupId]);

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
      projectName: projectName || currentScreen.name,
      projectNumber,
      versionNumber,
      projectNotes,
      mediaServer,
      preferredCodec,
      videoContainer,
      frameRate,
      audioEmbedded,
      samplingRate,
      audioBitRate,
      imageFormat,
      totalRequiredResolution,
      screenData,
    });
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "HTML Exported", description: "Standalone content deliverables downloaded." });
  }, [projectName, currentScreen.name, projectNumber, versionNumber, projectNotes, mediaServer, preferredCodec, videoContainer, frameRate, audioEmbedded, samplingRate, audioBitRate, imageFormat, totalRequiredResolution, screenData, safeFileName, toast]);

  const handleDownloadPixelMap = useCallback((sd: typeof screenData[number]) => {
    if (!sd.previewImage) return;
    const link = document.createElement('a');
    link.href = sd.previewImage;
    link.download = sd.pixelMapFileName;
    link.click();
    toast({ title: "Pixel Map Downloaded", description: `${sd.screen.name} pixel map saved as PNG.` });
  }, [toast]);

  return (
    <div className="w-[1000px] space-y-6 pb-20" style={{ background: '#E2E8F0' }}>
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

      <div ref={contentRef} className="rounded-2xl overflow-hidden" style={{ background: '#CBD5E1' }}>
        <div className="max-w-[900px] mx-auto bg-white rounded-2xl overflow-hidden">
          {/* ─── Header with embedded project info ─── */}
          <div className="px-12 py-10 text-white" style={{ background: '#0F172A' }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Content Deliverables</h1>
                <p className="text-sm text-slate-400 mt-2">{projectName || currentScreen.name}</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full" style={{ background: '#2563EB' }}>
                  v{versionNumber || '1.0'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-700">
              <HeaderField label="Project Number" value={projectNumber || 'Unassigned'} />
              <HeaderField label="Revision" value={`v${versionNumber || '1.0'}`} />
              <HeaderField label="Total Screens" value={String(screens.length)} />
            </div>
          </div>

          {/* ─── Body ─── */}
          <div className="p-12 space-y-10">
            {/* Section 1: LED Screen Configuration */}
            <ReportSection icon={<Monitor className="size-4" />} title="LED Screen Configuration">
              {screenData.map((sd) => (
                <div key={sd.screen.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2">
                    {/* Left: Pixel map preview */}
                    <div className="bg-slate-900 flex items-center justify-center p-6 min-h-[200px]">
                      {sd.previewImage ? (
                        <img src={sd.previewImage} alt={`Pixel map ${sd.screen.name}`} className="max-w-full max-h-[250px] object-contain" />
                      ) : (
                        <div className="text-slate-500 text-sm text-center">
                          <Layers className="size-8 mx-auto mb-2 opacity-50" />
                          No pixel map generated
                        </div>
                      )}
                    </div>
                    {/* Right: Screen info */}
                    <div className="p-6 space-y-3">
                      <h4 className="font-headline text-sm font-bold text-slate-800 mb-3">{sd.screen.name}</h4>
                      <DataRow label="Screen Resolution" value={sd.screenRes} />
                      <DataRow label="Aspect Ratio" value={sd.aspectRatio} />
                      <DataRow label="Total Pixels" value={sd.totalPixels.toLocaleString()} />
                      <DataRow label="Total Panels" value={String(sd.activeTileCount)} />
                    </div>
                  </div>
                </div>
              ))}
            </ReportSection>

            {/* Section 2: Media Server & Playback Requirements */}
            <ReportSection icon={<Video className="size-4" />} title="Media Server & Playback Requirements">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <SpecCard label="Selected Media Server" value={mediaServer || 'None'} />
                <SpecCard label="Media Server Output Resolution" value={totalRequiredResolution} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Video */}
                <div className="border border-slate-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="size-4" style={{ color: '#2563EB' }} />
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>Video</h5>
                  </div>
                  <DataRow label="Frame Rate" value={`${frameRate} fps`} />
                  <DataRow label="Preferred Codec" value={preferredCodec} />
                  <DataRow label="Container" value={videoContainer} />
                </div>

                {/* Audio */}
                <div className="border border-slate-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="size-4" style={{ color: '#2563EB' }} />
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>Audio</h5>
                  </div>
                  <DataRow label="Delivery" value={audioEmbedded ? 'Embedded' : 'Separate'} />
                  <DataRow label="Sampling Rate" value={samplingRate} />
                  <DataRow label="Bit Rate" value={audioBitRate} />
                </div>

                {/* Image */}
                <div className="border border-slate-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="size-4" style={{ color: '#2563EB' }} />
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>Image</h5>
                  </div>
                  <DataRow label="File Format" value={imageFormat} />
                </div>
              </div>
            </ReportSection>

            {/* Section 3: Pixel Map Generator */}
            <ReportSection icon={<Cpu className="size-4" />} title="Pixel Map Generator">
              {screenData.map((sd) => (
                <div key={sd.screen.id} className="border border-slate-200 rounded-lg overflow-hidden mb-4 last:mb-0">
                  <div className="grid grid-cols-2">
                    {/* Left: Pixel map preview (clickable to download) */}
                    <div className="bg-slate-900 flex flex-col items-center justify-center p-6 min-h-[200px] relative group">
                      {sd.previewImage ? (
                        <>
                          <img src={sd.previewImage} alt={`Pixel map ${sd.screen.name}`} className="max-w-full max-h-[250px] object-contain" />
                          <button
                            onClick={() => handleDownloadPixelMap(sd)}
                            className="no-print mt-3 flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700 transition-colors"
                          >
                            <Download className="size-3" /> Download PNG
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-500 text-sm text-center">
                          <Layers className="size-8 mx-auto mb-2 opacity-50" />
                          No preview available
                        </div>
                      )}
                    </div>
                    {/* Right: Screen info */}
                    <div className="p-6 space-y-3">
                      <h4 className="font-headline text-sm font-bold text-slate-800 mb-3">{sd.screen.name}</h4>
                      <DataRow label="Screen Resolution" value={sd.screenRes} />
                      <DataRow label="LED Manufacturer" value={sd.ledManufacturer} />
                      <DataRow label="LED Product" value={sd.ledProductName} />
                      <DataRow label="LED Product Dimensions" value={sd.ledProductDimensions} />
                      <DataRow label="Aspect Ratio" value={sd.aspectRatio} />
                      <DataRow label="Content File Name" value={sd.contentFileName} small />
                    </div>
                  </div>
                </div>
              ))}
            </ReportSection>

            {/* Delivery Instructions */}
            {projectNotes && (
              <ReportSection icon={<FileCode className="size-4" />} title="Delivery Instructions">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {projectNotes}
                </div>
              </ReportSection>
            )}
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Generated by <a href="https://www.MapMyLED.com" className="font-semibold" style={{ color: '#2563EB' }}>www.MapMyLED.com</a> · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ReportSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: '#2563EB' }}>{icon}</span>
        <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
          {title}
        </h3>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs py-1">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold text-slate-800 text-right ${small ? 'text-[10px] break-all' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{label}</p>
      <p className="font-bold text-slate-800 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  );
}

// ─── HTML Report Builder ────────────────────────────

function buildHtmlReport(opts: {
  projectName: string;
  projectNumber: string;
  versionNumber: string;
  projectNotes: string;
  mediaServer: string;
  preferredCodec: string;
  videoContainer: string;
  frameRate: string;
  audioEmbedded: boolean;
  samplingRate: string;
  audioBitRate: string;
  imageFormat: string;
  totalRequiredResolution: string;
  screenData: any[];
}): string {
  const { projectName, projectNumber, versionNumber, projectNotes, mediaServer, preferredCodec, videoContainer, frameRate, audioEmbedded, samplingRate, audioBitRate, imageFormat, totalRequiredResolution, screenData } = opts;

  const screenConfigHtml = screenData.map(sd => `
    <div class="screen-card">
      <div class="screen-grid">
        <div class="preview-block">${sd.previewImage ? `<img src="${sd.previewImage}" alt="${sd.screen.name}" />` : '<div class="empty-preview">No pixel map generated</div>'}</div>
        <div class="screen-info">
          <h4>${sd.screen.name}</h4>
          <div class="detail-row"><span>Screen Resolution</span><strong>${sd.screenRes}</strong></div>
          <div class="detail-row"><span>Aspect Ratio</span><strong>${sd.aspectRatio}</strong></div>
          <div class="detail-row"><span>Total Pixels</span><strong>${sd.totalPixels.toLocaleString()}</strong></div>
          <div class="detail-row"><span>Total Panels</span><strong>${sd.activeTileCount}</strong></div>
        </div>
      </div>
    </div>`).join('');

  const pixelMapHtml = screenData.map((sd, i) => `
    <div class="screen-card">
      <div class="screen-grid">
        <div class="preview-block">${sd.previewImage ? `<a href="${sd.previewImage}" download="${sd.pixelMapFileName}" class="pixel-map-download" title="Click to download pixel map"><img src="${sd.previewImage}" alt="${sd.screen.name}" /><span class="download-badge"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PNG</span></a>` : '<div class="empty-preview">No preview available</div>'}</div>
        <div class="screen-info">
          <h4>${sd.screen.name}</h4>
          <div class="detail-row"><span>Screen Resolution</span><strong>${sd.screenRes}</strong></div>
          <div class="detail-row"><span>LED Manufacturer</span><strong>${sd.ledManufacturer}</strong></div>
          <div class="detail-row"><span>LED Product</span><strong>${sd.ledProductName}</strong></div>
          <div class="detail-row"><span>LED Product Dimensions</span><strong>${sd.ledProductDimensions}</strong></div>
          <div class="detail-row"><span>Aspect Ratio</span><strong>${sd.aspectRatio}</strong></div>
          <div class="detail-row"><span>Content File Name</span><strong class="mono small">${sd.contentFileName}</strong></div>
        </div>
      </div>
    </div>`).join('');

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
  body { background: #CBD5E1; font-family: 'Inter', sans-serif; color: var(--slate-700); padding: 48px 24px; display: flex; justify-content: center; -webkit-font-smoothing: antialiased; }
  .report { width: 100%; max-width: 900px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
  .report-header { background: var(--slate-900); color: white; padding: 40px 48px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .header-top h1 { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  .header-top .subtitle { font-size: 14px; color: var(--slate-400); margin-top: 8px; }
  .version-badge { display: inline-block; background: var(--blue-600); color: white; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 999px; }
  .header-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding-top: 24px; border-top: 1px solid var(--slate-700); }
  .header-field .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate-500); font-weight: 600; margin-bottom: 4px; }
  .header-field .value { font-size: 14px; font-weight: 600; color: white; }
  .report-body { padding: 48px; }
  .section { margin-bottom: 32px; }
  .section:last-child { margin-bottom: 0; }
  .section-label { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--blue-600); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--slate-200); }
  .screen-card { border: 1px solid var(--slate-200); border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
  .screen-card:last-child { margin-bottom: 0; }
  .screen-grid { display: grid; grid-template-columns: 1fr 1fr; }
  .preview-block { background: var(--slate-900); display: flex; align-items: center; justify-content: center; padding: 24px; min-height: 200px; }
  .preview-block img { max-width: 100%; max-height: 250px; object-fit: contain; }
  .empty-preview { color: var(--slate-500); font-size: 14px; text-align: center; }
  .screen-info { padding: 24px; }
  .screen-info h4 { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: var(--slate-800); margin-bottom: 12px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 4px 0; }
  .detail-row span { color: var(--slate-500); }
  .detail-row strong { color: var(--slate-800); font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
  .detail-row strong.mono { font-family: 'Inter', sans-serif; }
  .detail-row strong.small { font-size: 10px; word-break: break-all; }
  .spec-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
  .spec-card { background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; padding: 20px; }
  .spec-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate-500); font-weight: 600; margin-bottom: 8px; }
  .spec-card .value { font-size: 14px; font-weight: 700; color: var(--slate-800); font-variant-numeric: tabular-nums; }
  .subcard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .subcard { border: 1px solid var(--slate-200); border-radius: 10px; padding: 20px; }
  .subcard h5 { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--blue-600); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
  .notes-box { background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; padding: 20px 24px; font-size: 14px; line-height: 1.7; color: var(--slate-600); white-space: pre-wrap; }
  .footer { padding: 24px 48px; background: var(--slate-50); border-top: 1px solid var(--slate-200); text-align: center; font-size: 12px; color: var(--slate-400); font-weight: 500; }
  .footer a { color: var(--blue-600); text-decoration: none; font-weight: 600; }
  .pixel-map-download { display: flex; flex-direction: column; align-items: center; text-decoration: none; position: relative; }
  .pixel-map-download img { transition: opacity 0.2s; }
  .pixel-map-download:hover img { opacity: 0.7; }
  .download-badge { display: flex; align-items: center; gap: 6px; margin-top: 10px; background: var(--blue-600); color: white; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; opacity: 0; transition: opacity 0.2s; }
  .pixel-map-download:hover .download-badge { opacity: 1; }
</style>
</head>
<body>
<div class="report">
  <div class="report-header">
    <div class="header-top">
      <div>
        <h1>Content Deliverables</h1>
        <div class="subtitle">${projectName}</div>
      </div>
      <div style="text-align:right;">
        <span class="version-badge">v${versionNumber || '1.0'}</span>
      </div>
    </div>
    <div class="header-grid">
      <div class="header-field"><div class="label">Project Number</div><div class="value">${projectNumber || 'Unassigned'}</div></div>
      <div class="header-field"><div class="label">Revision</div><div class="value">v${versionNumber || '1.0'}</div></div>
      <div class="header-field"><div class="label">Total Screens</div><div class="value">${screenData.length}</div></div>
    </div>
  </div>
  <div class="report-body">
    <div class="section">
      <div class="section-label">LED Screen Configuration</div>
      ${screenConfigHtml}
    </div>
    <div class="section">
      <div class="section-label">Media Server &amp; Playback Requirements</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="label">Selected Media Server</div><div class="value">${mediaServer}</div></div>
        <div class="spec-card"><div class="label">Media Server Output Resolution</div><div class="value">${totalRequiredResolution}</div></div>
      </div>
      <div class="subcard-grid">
        <div class="subcard">
          <h5>Video</h5>
          <div class="detail-row"><span>Frame Rate</span><strong>${frameRate} fps</strong></div>
          <div class="detail-row"><span>Preferred Codec</span><strong>${preferredCodec}</strong></div>
          <div class="detail-row"><span>Container</span><strong>${videoContainer}</strong></div>
        </div>
        <div class="subcard">
          <h5>Audio</h5>
          <div class="detail-row"><span>Delivery</span><strong>${audioEmbedded ? 'Embedded' : 'Separate'}</strong></div>
          <div class="detail-row"><span>Sampling Rate</span><strong>${samplingRate}</strong></div>
          <div class="detail-row"><span>Bit Rate</span><strong>${audioBitRate}</strong></div>
        </div>
        <div class="subcard">
          <h5>Image</h5>
          <div class="detail-row"><span>File Format</span><strong>${imageFormat}</strong></div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-label">Pixel Map Generator</div>
      ${pixelMapHtml}
    </div>
    ${projectNotes ? `
    <div class="section">
      <div class="section-label">Delivery Instructions</div>
      <div class="notes-box">${projectNotes}</div>
    </div>` : ''}
  </div>
  <div class="footer">Generated by <a href="https://www.MapMyLED.com">www.MapMyLED.com</a> · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>
</body>
</html>`;
}
