
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Layout, FileImage, ClipboardList } from "lucide-react";
import { useRef } from "react";

export function DeliverablesView() {
  const { 
    currentScreen, 
    projectNumber, 
    versionNumber, 
    projectNotes,
    rasterMapConfig,
    uploadedMaps,
    addUploadedMap,
    removeUploadedMap
  } = usePixelMap();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="w-[1000px] space-y-8 pb-20">
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="size-5" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Project Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Project Name:</span> <span className="font-semibold">{currentScreen.name}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Project #:</span> <span className="font-semibold">{projectNumber || "Unassigned"}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Revision:</span> <span className="font-semibold">{versionNumber || "1.0"}</span></p>
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
            </div>
          </div>

          {projectNotes && (
            <>
              <Separator className="my-8" />
              <div className="space-y-4">
                <h3 className="font-bold uppercase tracking-wider text-sm text-primary">Notes / Delivery Instructions</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {projectNotes}
                </p>
              </div>
            </>
          )}
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
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
                    className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
  );
}
