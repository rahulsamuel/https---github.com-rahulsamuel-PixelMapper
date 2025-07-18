
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DimensionControls } from "../pixel-mapper/dimension-controls";
import { AppearanceControls } from "../pixel-mapper/appearance-controls";
import { PixelMapActions } from "../pixel-mapper/pixel-mapper-actions";
import { LedGrid } from "./led-grid";
import { WiringDiagram } from "./wiring-diagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EditTools } from "../pixel-mapper/edit-tools";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, LayoutGrid, Wand2, FileOutput, Package, RotateCcw, Trash2, GitBranch, Eraser, Expand, Palette, RefreshCw, Cpu } from "lucide-react";
import { LabelControls } from "../pixel-mapper/label-controls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaOutputControls } from "../pixel-mapper/media-output-controls";
import { RasterMapPreview } from "./raster-map-preview";
import { WiringControls } from "../pixel-mapper/wiring-controls";
import { PowerControls } from "../pixel-mapper/power-controls";
import { ColorToolControls } from "../pixel-mapper/color-tool-controls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DownloadsControls } from "../pixel-mapper/downloads-controls";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";


export function PixelMapLayout() {
  const { dimensions, zoom, setZoom, onOffMode, setOnOffMode, activeBounds, deletedCount, coloredCount, restoreDeletedTiles, resetAllColors, activeTool, rasterMapConfig, activeTab, setActiveTab, topHalfTile, bottomHalfTile, effectiveScreenHeight, isWiringMirrored, setIsWiringMirrored, wiringData, showDataLabels, showPowerLabels } = usePixelMap();
  const [activeAccordion, setActiveAccordion] = useState("grid-setup");
  const viewportRef = useRef<HTMLDivElement>(null);

  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : 0;
  
  const totalHeight = useMemo(() => {
    if (!activeBounds) return 0;
    
    let height = 0;
    const uniqueY = new Set<number>();
    
    const activeTiles = activeBounds 
      ? Array.from({ length: (activeBounds.maxY - activeBounds.minY + 1) }, (_, i) => i + activeBounds.minY)
      : [];
      
    activeTiles.forEach(y => uniqueY.add(y));

    uniqueY.forEach(y => {
      const isTopHalfRow = topHalfTile && y === 0;
      const isBottomHalfRow = bottomHalfTile && y === effectiveScreenHeight - 1;

      if (isTopHalfRow || isBottomHalfRow) {
        height += dimensions.tileHeight / 2;
      } else {
        height += dimensions.tileHeight;
      }
    });

    return height;
  }, [activeBounds, dimensions.tileHeight, topHalfTile, bottomHalfTile, effectiveScreenHeight]);


  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  
  const handleFitToScreen = () => {
    if (!viewportRef.current) return;
  
    const viewportWidth = viewportRef.current.clientWidth;
    const viewportHeight = viewportRef.current.clientHeight;
  
    let contentWidth = 0;
    let contentHeight = 0;
  
    switch (activeTab) {
      case 'grid':
        contentWidth = dimensions.screenWidth * dimensions.tileWidth;
        contentHeight = (dimensions.screenHeight * dimensions.tileHeight) + 
                       (topHalfTile ? dimensions.tileHeight / 2 : 0) + 
                       (bottomHalfTile ? dimensions.tileHeight / 2 : 0);
        break;
      case 'wiring':
        contentWidth = dimensions.screenWidth * dimensions.tileWidth;
        contentHeight = (dimensions.screenHeight * dimensions.tileHeight) + 
                       (topHalfTile ? dimensions.tileHeight / 2 : 0) + 
                       (bottomHalfTile ? dimensions.tileHeight / 2 : 0);
        break;
      case 'raster':
        if (rasterMapConfig) {
          contentWidth = rasterMapConfig.totalWidth;
          contentHeight = rasterMapConfig.totalHeight;
        }
        break;
    }
  
    if (contentWidth <= 0 || contentHeight <= 0) {
      setZoom(1);
      return;
    }
  
    const padding = 32;
    const scaleX = (viewportWidth - padding) / contentWidth;
    const scaleY = (viewportHeight - padding) / contentHeight;
  
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    switch (activeTab) {
      case 'grid':
        setActiveAccordion('grid-setup');
        break;
      case 'wiring':
        setActiveAccordion('wiring');
        break;
      case 'raster':
        setActiveAccordion('export');
        break;
    }
  }, [activeTab]);

  const dataPortsCount = wiringData.filter(d => d.dataLabel).length;
  const powerPortsCount = wiringData.filter(d => d.powerPortLabel).length;
  let portCount = 0;
  let portLabelText = '';

  if (showDataLabels) {
    portCount = dataPortsCount;
    portLabelText = 'Data Ports';
  } else if (showPowerLabels) {
    portCount = powerPortsCount;
    portLabelText = 'Power Ports';
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-primary-foreground">PixelMap</h1>
          </Link>
        </SidebarHeader>
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="flex-grow">
            <Accordion
              type="single"
              collapsible
              value={activeAccordion}
              onValueChange={setActiveAccordion}
              className="p-4 flex flex-col gap-2"
            >
              <AccordionItem value="project" className="border-none">
                <AccordionSectionTrigger icon={<Package className="size-5" />} title="Project" />
                <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                  <div>
                    <div className="mb-4">
                      <h3 className="font-semibold">Project Files</h3>
                      <p className="text-sm text-muted-foreground">Save your work or load a previous project.</p>
                    </div>
                    <PixelMapActions />
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4">
                      <h3 className="font-semibold">Downloads</h3>
                      <p className="text-sm text-muted-foreground">Download generated grid images, raster maps and wiring diagrams.</p>
                    </div>
                    <DownloadsControls />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {activeTab === 'grid' && (
                <AccordionItem value="grid-setup" className="border-none">
                  <AccordionSectionTrigger icon={<LayoutGrid className="size-5" />} title="Grid Setup" />
                  <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold">Dimensions</h3>
                        <p className="text-sm text-muted-foreground">Define the size of your LED tiles and the overall screen grid.</p>
                      </div>
                      <DimensionControls />
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold">Appearance</h3>
                        <p className="text-sm text-muted-foreground">Customize the look of the LED tiles.</p>
                      </div>
                      <AppearanceControls />
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold">Labeling</h3>
                        <p className="text-sm text-muted-foreground">Customize the labels on the LED tiles.</p>
                      </div>
                      <LabelControls />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {activeTab === 'wiring' && (
                <AccordionItem value="wiring" className="border-none">
                  <AccordionSectionTrigger icon={<GitBranch className="size-5" />} title="Wiring" />
                  <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                     <div>
                      <div className="mb-4">
                        <h3 className="font-semibold">Data Wiring</h3>
                        <p className="text-sm text-muted-foreground">Define data wiring patterns and port settings.</p>
                      </div>
                      <WiringControls />
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold">Power Wiring</h3>
                        <p className="text-sm text-muted-foreground">Define how many tiles are on each power circuit.</p>
                      </div>
                      <PowerControls />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {activeTab === 'grid' && (
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
              )}

              {activeTab === 'raster' && (
                <AccordionItem value="export" className="border-none">
                  <AccordionSectionTrigger icon={<FileOutput className="size-5" />} title="Media Output" />
                  <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                    <p className="text-sm text-muted-foreground pb-4">Create raster maps for media servers.</p>
                    <MediaOutputControls />
                  </AccordionContent>
                </AccordionItem>
              )}

            </Accordion>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-screen w-full">
          <div className="sticky top-0 flex-shrink-0 bg-background p-4 border-b flex items-center justify-between z-20">
            <TabsList>
              <TabsTrigger value="grid">LED Grid</TabsTrigger>
              <TabsTrigger value="wiring">Wiring Diagram</TabsTrigger>
              <TabsTrigger value="raster">Raster Map Preview</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Resolution: <span className="font-mono">{totalWidth}px</span> x <span className="font-mono">{Math.round(totalHeight)}px</span>
              </div>
              {activeTab === 'wiring' && portCount > 0 && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <span className="text-sm font-medium text-muted-foreground">
                    ({portCount} {portLabelText})
                  </span>
                </>
              )}
               <div className="flex items-center space-x-2">
                <Switch id="on-off-switch" checked={onOffMode} onCheckedChange={setOnOffMode} />
                <Label htmlFor="on-off-switch">ON/OFF</Label>
              </div>
              {activeTab === 'wiring' && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center space-x-2">
                    <Switch id="mirror-switch" checked={isWiringMirrored} onCheckedChange={setIsWiringMirrored} />
                    <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
                  </div>
                </>
              )}
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
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
            </div>
          </div>
          <div className="flex-grow overflow-auto bg-muted/20" ref={viewportRef}>
              <TabsContent value="grid" className="mt-0 h-full w-full">
                <div style={{ width: dimensions.screenWidth * dimensions.tileWidth * zoom, height: totalHeight * zoom }}>
                  <LedGrid />
                </div>
              </TabsContent>
              <TabsContent value="wiring" className="mt-0 h-full w-full">
                <div style={{ width: dimensions.screenWidth * dimensions.tileWidth * zoom, height: totalHeight * zoom }}>
                  <WiringDiagram />
                </div>
              </TabsContent>
              <TabsContent value="raster" className="mt-0 h-full w-full">
                 <div style={{ width: (rasterMapConfig?.totalWidth ?? 0) * zoom, height: (rasterMapConfig?.totalHeight ?? 0) * zoom }}>
                  <RasterMapPreview />
                </div>
              </TabsContent>
          </div>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}
