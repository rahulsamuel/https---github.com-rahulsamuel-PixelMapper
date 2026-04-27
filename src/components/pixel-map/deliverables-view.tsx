
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Layout, FileImage, ClipboardList, FileDown, FileCode, Printer, Video, Music } from "lucide-react";
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
        backgroundColor: '#ffffff',
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
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deliverables Summary - ${currentScreen.name}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { background: #273a5e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .section { margin-bottom: 40px; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
          .section-title { font-weight: bold; color: #273a5e; text-transform: uppercase; margin-bottom: 15px; border-bottom: 2px solid #273a5e; display: inline-block; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .image-container { margin-top: 10px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
          img { max-width: 100%; display: block; }
          .badge { background: #eee; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
          pre { white-space: pre-wrap; font-family: inherit; }
          .tech-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .tech-item { padding: 8px; background: #f9f9f9; border-radius: 4px; }
          .tech-label { font-size: 10px; color: #666; text-transform: uppercase; }
          .tech-value { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Content Deliverable Summary</h1>
            <p>${currentScreen.name}</p>
          </div>
          <div style="text-align: right">
            <span class="badge">v${versionNumber}</span>
            <p>Ref: ${projectNumber || 'N/A'}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Project Details</div>
          <p><strong>Project Name:</strong> ${currentScreen.name}</p>
          <p><strong>Project #:</strong> ${projectNumber || 'N/A'}</p>
          <p><strong>Revision:</strong> ${versionNumber}</p>
        </div>

        <div class="section">
          <div class="section-title">Technical Specifications</div>
          <div class="tech-grid">
            <div class="tech-item"><div class="tech-label">Media Server</div><div class="tech-value">${mediaServer}</div></div>
            <div class="tech-item"><div class="tech-label">Codec</div><div class="tech-value">${preferredCodec}</div></div>
            <div class="tech-item"><div class="tech-label">Image Format</div><div class="tech-value">${imageFormat}</div></div>
            <div class="tech-item"><div class="tech-label">Audio Format</div><div class="tech-value">${audioFormat}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Mapping Specifications</div>
          ${rasterMapConfig ? `
            <p><strong>Canvas:</strong> ${rasterMapConfig.totalWidth} x ${rasterMapConfig.totalHeight} px</p>
            <p><strong>Content Area:</strong> ${rasterMapConfig.contentWidth} x ${rasterMapConfig.contentHeight} px</p>
            <p><strong>Export Preset:</strong> ${rasterMapConfig.resolutionType.toUpperCase()}</p>
          ` : '<p>No raster map generated.</p>'}
        </div>

        ${projectNotes ? `
          <div class="section">
            <div class="section-title">Notes / Delivery Instructions</div>
            <pre>${projectNotes}</pre>
          </div>
        ` : ''}

        ${rasterMapConfig?.previewImage ? `
          <div class="section">
            <div class="section-title">Raster Map Preview</div>
            <div class="image-container">
              <img src="${rasterMapConfig.previewImage}" alt="Raster Map" />
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Reference Maps</div>
          <div class="grid">
            ${uploadedMaps.map((map, i) => `
              <div class="image-container">
                <img src="${map}" alt="Reference ${i+1}" />
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

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
    <div className="w-[1000px] space-y-8 pb-20">
      <div className="flex justify-end gap-3 mb-4 no-print">
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

      <div ref={contentRef} className="space-y-8 bg-background p-1 rounded-xl">
        <Card className="shadow-xl">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-headline font-bold">Content Deliverable Summary</CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-2">
                  Project Documentation & Delivery Package
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-lg px-4 py-1">v{versionNumber || "1.0"}</Badge>
                <p className="text-sm mt-2 opacity-80">Ref: {projectNumber || "N/A"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <ClipboardList className="size-5" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Project Details</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-muted-foreground">Project Name:</span> <span className="font-semibold">{currentScreen.name}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Project #:</span> <span className="font-semibold">{projectNumber || "Unassigned"}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Revision:</span> <span className="font-semibold">{versionNumber || "1.0"}</span></p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <Video className="size-5" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Playback Specs</h3>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Server / System</p>
                      <p className="text-sm font-semibold">{mediaServer}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Preferred Codec</p>
                      <p className="text-sm font-semibold">{preferredCodec}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Image Format</p>
                      <p className="text-sm font-semibold">{imageFormat}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold text-primary flex items-center gap-1">
                        <Music className="size-3" /> Audio Requirements
                      </p>
                      <p className="text-xs font-medium italic">{audioFormat || "No audio required"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Layout className="size-5" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">Content Specifications</h3>
                </div>
                {rasterMapConfig ? (
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Canvas Resolution</p>
                      <p className="text-lg font-mono font-bold">{rasterMapConfig.totalWidth} x {rasterMapConfig.totalHeight} px</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Content Area</p>
                      <p className="text-lg font-mono font-bold">{rasterMapConfig.contentWidth} x {rasterMapConfig.contentHeight} px</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Slice Count</p>
                      <p className="text-lg font-mono font-bold">{rasterMapConfig.slices.length} Slices</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Export Preset</p>
                      <p className="text-lg font-mono font-bold uppercase">{rasterMapConfig.resolutionType}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
                    No raster map generated yet. Switch to the Raster Map tab to define output resolution.
                  </div>
                )}

                {projectNotes && (
                  <div className="mt-6">
                    <Separator className="my-4" />
                    <h3 className="font-bold uppercase tracking-wider text-sm text-primary mb-2">Delivery Instructions</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {projectNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="size-5 text-primary" /> Generated Raster Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rasterMapConfig?.previewImage ? (
                <div className="relative group overflow-hidden rounded-lg border bg-black aspect-video flex items-center justify-center">
                  <img 
                    src={rasterMapConfig.previewImage} 
                    alt="Current Raster Map" 
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
                    <p className="text-white text-xs font-mono">Current Map: {rasterMapConfig.outputWidth}x{rasterMapConfig.outputHeight}</p>
                  </div>
                </div>
              ) : (
                <div className="h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm text-center px-8">
                  Generate a raster map to see the deliverable preview here.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileImage className="size-5 text-primary" /> Reference Maps
              </CardTitle>
              <Button size="sm" variant="outline" className="no-print" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="size-4 mr-2" /> Upload
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {uploadedMaps.map((map, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-lg border bg-muted overflow-hidden">
                    <img src={map} alt={`Uploaded reference ${idx}`} className="w-full h-full object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      onClick={() => removeUploadedMap(idx)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                {uploadedMaps.length === 0 && (
                  <div className="col-span-2 h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm text-center px-8">
                    Upload external pixel maps or reference images for the content team.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
