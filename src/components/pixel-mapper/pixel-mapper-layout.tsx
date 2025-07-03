
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DimensionControls } from "./dimension-controls";
import { AppearanceControls } from "./appearance-controls";
import { PixelMapperActions } from "./pixel-mapper-actions";
import { LedGrid } from "./led-grid";
import { WiringDiagram } from "./wiring-diagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EditTools } from "./edit-tools";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, LayoutGrid, Wand2, FileOutput, Package, RotateCcw, Trash2, GitBranch, Eraser, Expand, Palette } from "lucide-react";
import { LabelControls } from "./label-controls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaOutputControls } from "./media-output-controls";
import { RasterMapPreview } from "./raster-map-preview";
import { WiringControls } from "./wiring-controls";
import { PowerControls } from "./power-controls";
import { ColorToolControls } from "./color-tool-controls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DownloadsControls } from "./downloads-controls";
import { useState, useRef } from "react";


export function PixelMapperLayout() {
  const { dimensions, zoom, setZoom, onOffMode, setOnOffMode, activeBounds, deletedCount, coloredCount, restoreDeletedTiles, resetAllColors, activeTool, rasterMapConfig } = usePixelMapper();
  const [activeTab, setActiveTab] = useState("grid");
  const gridViewportRef = useRef<HTMLDivElement>(null);
  const wiringViewportRef = useRef<HTMLDivElement>(null);
  const rasterViewportRef = useRef<HTMLDivElement>(null);

  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : 0;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : 0;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  
  const handleFitToScreen = () => {
    let gridWidth = 0;
    let gridHeight = 0;
    let viewportEl: HTMLDivElement | null = null;

    switch (activeTab) {
      case 'grid':
        gridWidth = dimensions.screenWidth * dimensions.tileWidth;
        gridHeight = dimensions.screenHeight * dimensions.tileHeight;
        viewportEl = gridViewportRef.current;
        break;
      case 'wiring':
        gridWidth = dimensions.screenWidth * dimensions.tileWidth;
        gridHeight = dimensions.screenHeight * dimensions.tileHeight;
        viewportEl = wiringViewportRef.current;
        break;
      case 'raster':
        if (rasterMapConfig) {
          gridWidth = rasterMapConfig.totalWidth;
          gridHeight = rasterMapConfig.totalHeight;
        }
        viewportEl = rasterViewportRef.current;
        break;
    }

    if (!viewportEl || gridWidth <= 0 || gridHeight <= 0) {
      setZoom(1); // Fallback
      return;
    }

    const { clientWidth: viewportWidth, clientHeight: viewportHeight } = viewportEl;
    const padding = 64; // Add some padding around the content

    const scaleX = (viewportWidth - padding) / gridWidth;
    const scaleY = (viewportHeight - padding) / gridHeight;

    const newZoom = Math.min(scaleX, scaleY);
    setZoom(newZoom > 0 ? newZoom : 1);
  };
  
  const AccordionSectionTrigger = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <AccordionTrigger className="bg-card hover:bg-muted/50 px-4 py-3 rounded-lg text-base font-semibold border data-[state=closed]:shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <span>{title}</span>
      </div>
    </AccordionTrigger>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <h1 className="text-2xl font-bold font-headline text-primary-foreground">PixelMapper</h1>
        </SidebarHeader>
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="flex-grow">
            <Accordion type="single" collapsible defaultValue="grid-setup" className="p-4 flex flex-col gap-2">
              <AccordionItem value="project" className="border-none">
                <AccordionSectionTrigger icon={<Package className="size-5" />} title="Project" />
                <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                  <div>
                    <h3 className="font-semibold mb-2">Project Files</h3>
                    <p className="text-sm text-muted-foreground pb-4">Save your work or load a previous project.</p>
                    <PixelMapperActions />
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Downloads</h3>
                    <p className="text-sm text-muted-foreground pb-4">Download generated grid images, raster maps and wiring diagrams.</p>
                    <DownloadsControls />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="grid-setup" className="border-none">
                <AccordionSectionTrigger icon={<LayoutGrid className="size-5" />} title="Grid Setup" />
                <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                  <div>
                    <h3 className="font-semibold mb-2">Dimensions</h3>
                    <p className="text-sm text-muted-foreground pb-4">Define the size of your LED tiles and the overall screen grid.</p>
                    <DimensionControls />
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Appearance</h3>
                    <p className="text-sm text-muted-foreground pb-4">Customize the look of the LED tiles.</p>
                    <AppearanceControls />
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Labeling</h3>
                    <p className="text-sm text-muted-foreground pb-4">Customize the labels on the LED tiles.</p>
                    <LabelControls />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="wiring" className="border-none">
                <AccordionSectionTrigger icon={<GitBranch className="size-5" />} title="Wiring" />
                <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                   <div>
                    <h3 className="font-semibold mb-2">Data Wiring</h3>
                    <p className="text-sm text-muted-foreground pb-4">Define data wiring patterns and port settings.</p>
                    <WiringControls />
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Power Wiring</h3>
                    <p className="text-sm text-muted-foreground pb-4">Define how many tiles are on each power circuit.</p>
                    <PowerControls />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="editing" className="border-none">
                <AccordionSectionTrigger icon={<Wand2 className="size-5" />} title="Editing Tools" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Select a tool to apply to the grid or restore deleted tiles.</p>
                  <div className="space-y-4 pt-4">
                    <EditTools />
                    {activeTool === 'color' && <ColorToolControls />}
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Trash2 className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Deleted Tiles</span>
                      </div>
                      <span className="font-mono text-lg font-bold">{deletedCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Palette className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Colored Tiles</span>
                      </div>
                      <span className="font-mono text-lg font-bold">{coloredCount}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <Button onClick={resetAllColors} variant="outline" className="w-full">
                          <Eraser className="mr-2" />
                          Reset Colors
                      </Button>
                      <Button onClick={restoreDeletedTiles} variant="outline" className="w-full">
                          <RotateCcw className="mr-2" />
                          Restore Deleted
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="export" className="border-none">
                <AccordionSectionTrigger icon={<FileOutput className="size-5" />} title="Media Output" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Create raster maps for media servers.</p>
                  <MediaOutputControls />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs defaultValue="grid" className="flex flex-col h-full w-full" onValueChange={setActiveTab}>
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            <TabsList>
              <TabsTrigger value="grid">LED Grid</TabsTrigger>
              <TabsTrigger value="wiring">Wiring Diagram</TabsTrigger>
              <TabsTrigger value="raster">Raster Map Preview</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Resolution: <span className="font-mono">{totalWidth}px</span> x <span className="font-mono">{totalHeight}px</span>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="on-off-switch" checked={onOffMode} onCheckedChange={setOnOffMode} />
                <Label htmlFor="on-off-switch">ON/OFF</Label>
              </div>
            </div>
          </div>
          <TabsContent value="grid" className="flex-grow overflow-auto" ref={gridViewportRef}>
            <LedGrid />
          </TabsContent>
          <TabsContent value="wiring" className="flex-grow flex flex-col" ref={wiringViewportRef}>
            <WiringDiagram />
          </TabsContent>
          <TabsContent value="raster" className="flex-grow overflow-auto" ref={rasterViewportRef}>
            <RasterMapPreview />
          </TabsContent>
        </Tabs>
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-lg border bg-background/80 p-1 shadow-md backdrop-blur-sm">
          <Button onClick={handleZoomOut} variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom Out">
            <ZoomOut />
          </Button>
          <div className="w-14 text-center font-mono text-sm" title="Current Zoom">
            {Math.round(zoom * 100)}%
          </div>
          <Button onClick={handleZoomIn} variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom In">
            <ZoomIn />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button onClick={handleFitToScreen} variant="ghost" size="icon" className="h-8 w-8" aria-label="Fit to Screen">
            <Expand />
          </Button>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
