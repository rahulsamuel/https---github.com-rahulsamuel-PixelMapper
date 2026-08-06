
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Layout, FileImage, FileDown, FileCode, Printer, Video, Music, ClipboardList } from "lucide-react";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

export function DeliverablesView() {
  const { 
    currentScreen, 
    projectNumber, 
    versionNumber, 
    projectNotes,
    rasterMapConfig,
    uploadedMaps,
    addUploadedMap,
    removeUploadedMap,
    mediaServer,
    preferredCodec,
    audioFormat,
    imageFormat
  } = usePixelMap();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleDownloadPdf = async () => {
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
      pdf.save(`deliverables-${projectNumber || 'summary'}-v${versionNumber}.pdf`);
      
      toast({ title: "PDF Exported", description: "Your deliverable summary has been downloaded." });
    } catch (error) {
      console.error("PDF Export failed", error);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Project Deliverables - ${currentScreen.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --slate-900: #0F172A;
    --slate-800: #1E293B;
    --slate-700: #334155;
    --slate-600: #475569;
    --slate-500: #64748B;
    --slate-400: #94A3B8;
    --slate-300: #CBD5E1;
    --slate-200: #E2E8F0;
    --slate-100: #F1F5F9;
    --slate-50: #F8FAFC;
    --blue-700: #1D4ED8;
    --blue-600: #2563EB;
    --blue-500: #3B82F6;
    --blue-50: #EFF6FF;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--slate-900);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--slate-700);
    padding: 48px 24px;
    display: flex;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }
  .report {
    width: 100%;
    max-width: 900px;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
  }
  .report-header {
    background: var(--slate-900);
    color: white;
    padding: 40px 48px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .report-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .report-header .subtitle {
    font-size: 14px;
    color: var(--slate-400);
    margin-top: 8px;
    font-weight: 400;
  }
  .report-header .meta {
    text-align: right;
  }
  .report-header .version-badge {
    display: inline-block;
    background: var(--blue-600);
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 16px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }
  .report-header .ref {
    font-size: 13px;
    color: var(--slate-400);
    margin-top: 12px;
    font-family: 'Inter', sans-serif;
  }
  .report-body { padding: 48px; }
  .section { margin-bottom: 40px; }
  .section:last-child { margin-bottom: 0; }
  .section-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--blue-600);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--slate-200);
  }
  .detail-row {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid var(--slate-100);
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-label {
    width: 200px;
    font-size: 13px;
    color: var(--slate-500);
    font-weight: 500;
    flex-shrink: 0;
  }
  .detail-value {
    font-size: 14px;
    color: var(--slate-800);
    font-weight: 600;
  }
  .spec-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .spec-card {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    padding: 20px;
  }
  .spec-card .spec-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--slate-500);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .spec-card .spec-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--slate-800);
    font-family: 'Space Grotesk', sans-serif;
  }
  .spec-card .spec-value.mono {
    font-family: 'Inter', sans-serif;
    font-variant-numeric: tabular-nums;
  }
  .notes-box {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    padding: 20px 24px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--slate-600);
    white-space: pre-wrap;
  }
  .image-block {
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    overflow: hidden;
    background: var(--slate-900);
  }
  .image-block img {
    width: 100%;
    display: block;
  }
  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .empty-state {
    padding: 40px;
    text-align: center;
    color: var(--slate-400);
    font-size: 14px;
    background: var(--slate-50);
    border: 1px dashed var(--slate-300);
    border-radius: 10px;
  }
  .footer {
    padding: 24px 48px;
    background: var(--slate-50);
    border-top: 1px solid var(--slate-200);
    text-align: center;
    font-size: 12px;
    color: var(--slate-400);
    font-weight: 500;
  }
</style>
</head>
<body>
<div class="report">
  <div class="report-header">
    <div>
      <h1>Project Deliverables</h1>
      <div class="subtitle">${currentScreen.name}</div>
    </div>
    <div class="meta">
      <span class="version-badge">v${versionNumber || '1.0'}</span>
      <div class="ref">Ref: ${projectNumber || 'N/A'}</div>
    </div>
  </div>

  <div class="report-body">
    <div class="section">
      <div class="section-label">Project Details</div>
      <div class="detail-row">
        <div class="detail-label">Project Name</div>
        <div class="detail-value">${currentScreen.name}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Project Number</div>
        <div class="detail-value">${projectNumber || 'Unassigned'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Revision</div>
        <div class="detail-value">${versionNumber || '1.0'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Playback Specifications</div>
      <div class="spec-grid">
        <div class="spec-card">
          <div class="spec-label">Media Server</div>
          <div class="spec-value">${mediaServer}</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Preferred Codec</div>
          <div class="spec-value">${preferredCodec}</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Image Format</div>
          <div class="spec-value">${imageFormat}</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Audio Format</div>
          <div class="spec-value">${audioFormat || 'No audio required'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Content Specifications</div>
      ${rasterMapConfig ? `
      <div class="spec-grid">
        <div class="spec-card">
          <div class="spec-label">Canvas Resolution</div>
          <div class="spec-value mono">${rasterMapConfig.totalWidth} × ${rasterMapConfig.totalHeight} px</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Content Area</div>
          <div class="spec-value mono">${rasterMapConfig.contentWidth} × ${rasterMapConfig.contentHeight} px</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Canvas Count</div>
          <div class="spec-value mono">${rasterMapConfig.slices.length} Canvases</div>
        </div>
        <div class="spec-card">
          <div class="spec-label">Export Preset</div>
          <div class="spec-value mono" style="font-size:12px;word-break:break-all">RASTER_MAP_${(currentScreen.name || 'Screen').replace(/[^a-zA-Z0-9_-]/g, '_')}_${rasterMapConfig.outputWidth}x${rasterMapConfig.outputHeight}.png</div>
        </div>
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
      <div class="image-block">
        <img src="${rasterMapConfig.previewImage}" alt="Generated Pixel Map" />
      </div>
    </div>` : ''}

    ${uploadedMaps.length > 0 ? `
    <div class="section">
      <div class="section-label">Reference Maps</div>
      <div class="image-grid">
        ${uploadedMaps.map((map, i) => `<div class="image-block"><img src="${map}" alt="Reference ${i+1}" /></div>`).join('')}
      </div>
    </div>` : ''}
  </div>

  <div class="footer">
    Generated by PixelMapper · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deliverables-${projectNumber || 'summary'}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "HTML Exported", description: "Standalone project summary downloaded." });
  };

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

      <div ref={contentRef} className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0F172A' }}>
        <div className="max-w-[900px] mx-auto bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-12 py-10 text-white" style={{ background: '#0F172A' }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Project Deliverables</h1>
                <p className="text-sm text-slate-400 mt-2">{currentScreen.name}</p>
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
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="size-4" style={{ color: '#2563EB' }} />
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                  Project Details
                </h3>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div>
                <div className="flex py-2.5 border-b border-slate-100">
                  <span className="w-48 text-sm text-slate-500 font-medium shrink-0">Project Name</span>
                  <span className="text-sm text-slate-800 font-semibold">{currentScreen.name}</span>
                </div>
                <div className="flex py-2.5 border-b border-slate-100">
                  <span className="w-48 text-sm text-slate-500 font-medium shrink-0">Project Number</span>
                  <span className="text-sm text-slate-800 font-semibold">{projectNumber || 'Unassigned'}</span>
                </div>
                <div className="flex py-2.5">
                  <span className="w-48 text-sm text-slate-500 font-medium shrink-0">Revision</span>
                  <span className="text-sm text-slate-800 font-semibold">{versionNumber || '1.0'}</span>
                </div>
              </div>
            </div>

            {/* Playback Specs */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Video className="size-4" style={{ color: '#2563EB' }} />
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                  Playback Specifications
                </h3>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Media Server</p>
                  <p className="text-base font-headline font-bold text-slate-800">{mediaServer}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Preferred Codec</p>
                  <p className="text-base font-headline font-bold text-slate-800">{preferredCodec}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Image Format</p>
                  <p className="text-base font-headline font-bold text-slate-800">{imageFormat}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1">
                    <Music className="size-3" /> Audio Format
                  </p>
                  <p className="text-base font-headline font-bold text-slate-800">{audioFormat || 'No audio required'}</p>
                </div>
              </div>
            </div>

            {/* Content Specs */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layout className="size-4" style={{ color: '#2563EB' }} />
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                  Content Specifications
                </h3>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {rasterMapConfig ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Canvas Resolution</p>
                    <p className="text-base font-bold text-slate-800 tabular-nums">{rasterMapConfig.totalWidth} × {rasterMapConfig.totalHeight} px</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Content Area</p>
                    <p className="text-base font-bold text-slate-800 tabular-nums">{rasterMapConfig.contentWidth} × {rasterMapConfig.contentHeight} px</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Canvas Count</p>
                    <p className="text-base font-bold text-slate-800 tabular-nums">{rasterMapConfig.slices.length} Canvases</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Export Preset</p>
                    <p className="text-xs font-bold text-slate-800 break-all" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      RASTER_MAP_{(currentScreen.name || 'Screen').replace(/[^a-zA-Z0-9_-]/g, '_')}_{rasterMapConfig.outputWidth}x{rasterMapConfig.outputHeight}.png
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                  No pixel map generated. Switch to the Raster Map tab to define output resolution.
                </div>
              )}
            </div>

            {/* Delivery Instructions */}
            {projectNotes && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="size-4" style={{ color: '#2563EB' }} />
                  <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                    Delivery Instructions
                  </h3>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {projectNotes}
                </div>
              </div>
            )}

            {/* Generated Pixel Map */}
            {rasterMapConfig?.previewImage && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="size-4" style={{ color: '#2563EB' }} />
                  <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                    Generated Pixel Map
                  </h3>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-black">
                  <img src={rasterMapConfig.previewImage} alt="Generated Pixel Map" className="w-full block" />
                </div>
              </div>
            )}

            {/* Reference Maps */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileImage className="size-4" style={{ color: '#2563EB' }} />
                <h3 className="font-headline text-xs font-semibold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                  Reference Maps
                </h3>
                <div className="flex-1 h-px bg-slate-200" />
                <Button size="sm" variant="outline" className="no-print h-7" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="size-3.5 mr-1.5" /> Upload
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
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
            </div>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Generated by PixelMapper · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
