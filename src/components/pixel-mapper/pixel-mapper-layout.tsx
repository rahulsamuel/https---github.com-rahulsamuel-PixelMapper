
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
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import { LabelControls } from "./label-controls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaOutputControls } from "./media-output-controls";


export function PixelMapperLayout() {
  const { dimensions, handleDownloadPng, zoom, setZoom, onOffMode, setOnOffMode } = usePixelMapper();

  const totalWidth = dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = dimensions.screenHeight * dimensions.tileHeight;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <h1 className="text-2xl font-bold font-headline text-primary-foreground">PixelMapper</h1>
        </SidebarHeader>
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="flex-grow">
            <div className="flex flex-col gap-4 p-4">
              <DimensionControls />
              <AppearanceControls />
              <LabelControls />
              <EditTools />
              <PixelMapperActions />
              <MediaOutputControls />
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs defaultValue="grid" className="flex flex-col h-full w-full">
          <div className="p-4 border-b flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="grid">LED Grid</TabsTrigger>
              <TabsTrigger value="wiring">Wiring Diagram</TabsTrigger>
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
              <Button size="sm" onClick={() => handleDownloadPng('pixel-map.png')}>
                <Download className="mr-2" />
                Download
              </Button>
            </div>
          </div>
          <TabsContent value="grid" className="flex-grow">
            <LedGrid />
          </TabsContent>
          <TabsContent value="wiring" className="flex-grow">
            <WiringDiagram />
          </TabsContent>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}
