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

export function PixelMapperLayout() {
  const { appState } = usePixelMapper();

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
              <PixelMapperActions />
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs defaultValue="grid" className="flex flex-col h-full w-full">
          <div className="p-4 border-b">
            <TabsList>
              <TabsTrigger value="grid">LED Grid</TabsTrigger>
              <TabsTrigger value="wiring">Wiring Diagram</TabsTrigger>
            </TabsList>
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
