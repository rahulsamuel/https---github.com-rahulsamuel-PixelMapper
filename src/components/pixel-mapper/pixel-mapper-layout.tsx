
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
import { ZoomIn, ZoomOut, Grid3x3, Paintbrush, Type, Wand2, Calculator, FileOutput, Package, RotateCcw, Trash2 } from "lucide-react";
import { LabelControls } from "./label-controls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaOutputControls } from "./media-output-controls";
import { OutputCalculator } from "./output-calculator";
import { RasterMapPreview } from "./raster-map-preview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export function PixelMapperLayout() {
  const { dimensions, zoom, setZoom, onOffMode, setOnOffMode, activeBounds, deletedCount, restoreAll } = usePixelMapper();

  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : 0;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : 0;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  
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
            <Accordion type="multiple" defaultValue={['dimensions']} className="p-4 flex flex-col gap-2">
              <AccordionItem value="project" className="border-none">
                <AccordionSectionTrigger icon={<Package className="size-5" />} title="Project" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Save your work or load a previous project.</p>
                  <PixelMapperActions />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dimensions" className="border-none">
                <AccordionSectionTrigger icon={<Grid3x3 className="size-5" />} title="Dimensions" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Define the size of your LED tiles and the overall screen grid.</p>
                  <DimensionControls />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="appearance" className="border-none">
                <AccordionSectionTrigger icon={<Paintbrush className="size-5" />} title="Appearance" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Customize the look of the LED tiles.</p>
                  <AppearanceControls />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="labeling" className="border-none">
                <AccordionSectionTrigger icon={<Type className="size-5" />} title="Labeling" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Customize the labels on the LED tiles.</p>
                  <LabelControls />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tools" className="border-none">
                <AccordionSectionTrigger icon={<Wand2 className="size-5" />} title="Edit & Restore" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground pb-4">Select a tool to apply to the grid or restore deleted tiles.</p>
                  <div className="space-y-4 pt-4">
                    <EditTools />
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Trash2 className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Deleted Tiles</span>
                      </div>
                      <span className="font-mono text-lg font-bold">{deletedCount}</span>
                    </div>
                    <Button onClick={restoreAll} variant="outline" className="w-full">
                        <RotateCcw className="mr-2" />
                        Restore All
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="output" className="border-none">
                <AccordionSectionTrigger icon={<FileOutput className="size-5" />} title="Media Output" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <MediaOutputControls />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="calculator" className="border-none">
                <AccordionSectionTrigger icon={<Calculator className="size-5" />} title="Output Calculator" />
                <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                  <OutputCalculator />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs defaultValue="grid" className="flex flex-col h-full w-full">
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
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button onClick={handleZoomOut} variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomOut />
                </Button>
                <span className="w-12 text-center font-mono text-sm">{Math.round(zoom * 100)}%</span>
                <Button onClick={handleZoomIn} variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomIn />
                </Button>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="on-off-switch" checked={onOffMode} onCheckedChange={setOnOffMode} />
                <Label htmlFor="on-off-switch">ON/OFF</Label>
              </div>
            </div>
          </div>
          <TabsContent value="grid" className="flex-grow overflow-auto">
            <LedGrid />
          </TabsContent>
          <TabsContent value="wiring" className="flex-grow">
            <WiringDiagram />
          </TabsContent>
          <TabsContent value="raster" className="flex-grow">
            <RasterMapPreview />
          </TabsContent>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}
