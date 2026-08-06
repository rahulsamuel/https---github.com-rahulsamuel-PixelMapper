
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import type { RasterMapConfig } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Layout, FileImage, FileDown, FileCode, Printer, Video, ClipboardList, Layers } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

export function DeliverablesView() {
  const {
    screens,
    currentScreen,
    projectNumber,
    versionNumber,
    projectNotes,
    rasterMapConfig,
    rasterGroups,
    uploadedMaps,
    addUploadedMap,
    removeUploadedMap,
    mediaServer,
    preferredCodec,
    audioFormat,
    imageFormat,
    projectName,
  } = usePixelMap();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      projectName: projectName || currentScreen.name,
      projectNumber,
      versionNumber,
      projectNotes,
      rasterMapConfig,
      rasterGroups,
      uploadedMaps,
      mediaServer,
      preferredCodec,
      audioFormat,
      imageFormat,
      screens,
    });

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.html`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "HTML Exported", description: "Standalone content deliverables downloaded." });
  }, [projectName, currentScreen.name, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, screens, safeFileName, toast]);

  // Memoize the heavy preview content so it only re-renders when data actually changes
  const previewContent = useMemo(() => {
    const mediaServerLabel = mediaServer || 'None';

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
          </Section>

          {/* Media Server & Playback Requirements */}
          <Section icon={<Video className="size-4" />} title="Media Server & Playback Requirements">
            <div className="grid grid-cols-2 gap-4">
              <SpecCard label="Total Required Resolution" value={rasterMapConfig ? `${rasterMapConfig.outputWidth} × ${rasterMapConfig.outputHeight} px` : 'Not generated'} />
              <SpecCard label="Number of Outputs (Rasters)" value={String(rasterGroups.length)} />
              <SpecCard label="Selected Media Server" value={mediaServerLabel} />
              <SpecCard label="Preferred Codec" value={preferredCodec || 'None'} />
              <SpecCard label="Image Format" value={imageFormat || 'None'} />
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
  }, [screens.length, projectName, currentScreen.name, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, safeFileName, handleFileUpload, removeUploadedMap]);

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
  projectName: string;
  projectNumber: string;
  versionNumber: string;
  projectNotes: string;
  rasterMapConfig: RasterMapConfig | null;
  rasterGroups: any[];
  uploadedMaps: string[];
  mediaServer: string;
  preferredCodec: string;
  audioFormat: string;
  imageFormat: string;
  screens: any[];
}): string {
  const { projectName, projectNumber, versionNumber, projectNotes, rasterMapConfig, rasterGroups, uploadedMaps, mediaServer, preferredCodec, audioFormat, imageFormat, screens } = opts;

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
      <div class="detail-row"><div class="detail-label">Total Screens</div><div class="detail-value">${screens.length}</div></div>
    </div>
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
