
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
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
import { ZoomIn, ZoomOut, LayoutGrid, Wand2, FileOutput, Package, RotateCcw, Trash2, GitBranch, Eraser, Expand, Palette, RefreshCw, Cpu, User, LogOut, Settings, Home, ScreenShare, Plus, MoreHorizontal, Pencil, Trash, Copy, CaseSensitive, FileText, Info } from "lucide-react";
import { LabelControls } from "../pixel-mapper/label-controls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaOutputControls } from "../pixel-mapper/media-output-controls";
import { RasterMapPreview } from "./raster-map-preview";
import { WiringControls } from "../pixel-mapper/wiring-controls";
import { PowerControls } from "../pixel-mapper/power-controls";
import { ColorToolControls } from "../pixel-mapper/color-tool-controls";
import { ManualPowerWiringModal } from "../pixel-mapper/manual-power-wiring-modal";
import { ManualDataWiringModal } from "../pixel-mapper/manual-data-wiring-modal";
import { DeliverablesView } from "./deliverables-view";
import { ProjectDetailsControls } from "../pixel-mapper/project-details-controls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { DownloadsControls } from "../pixel-mapper/downloads-controls";
import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";


export function PixelMapLayout() {
  const { 
    screens,
    currentScreen,
    currentScreenId,
    setCurrentScreenId,
    addNewScreen,
    renameScreen,
    deleteScreen,
    duplicateScreen,
    zoom, setZoom, activeBounds, deletedCount, coloredCount, restoreDeletedTiles, resetAllColors, activeTool, rasterMapConfig, activeTab, setActiveTab, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile, effectiveScreenHeight, effectiveScreenWidth, isWiringMirrored, setIsWiringMirrored, wiringData, showDataLabels, showPowerLabels,
    isManualPowerModalOpen, setIsManualPowerModalOpen, selectedTileForPower, applyManualPowerWiring,
    isManualDataModalOpen, setIsManualDataModalOpen, selectedTileForData, applyManualDataWiring
   } = usePixelMap();
  const viewportRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState<string | null>(null);

  const dimensions = currentScreen.dimensions;
  
  const handleRename = (screenId: string) => {
    if (renameValue.trim()) {
      renameScreen(screenId, renameValue.trim());
      setIsRenaming(null);
      setRenameValue("");
    }
  }

  const totalWidth = useMemo(() => {
    if (!activeBounds || !currentScreen) return 0;
    
    let width = 0;
    for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
      const isLeftHalf = currentScreen.leftHalfTile && x === 0;
      const isRightHalf = currentScreen.rightHalfTile && x === effectiveScreenWidth - 1;
      width += (isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }
    return width;
  }, [activeBounds, dimensions.tileWidth, effectiveScreenWidth, currentScreen]);
  
  const totalHeight = useMemo(() => {
    if (!activeBounds || !currentScreen) return 0;
    
    let height = 0;
    for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
      const isTopHalfRow = currentScreen.topHalfTile && y === 0;
      const isBottomHalfRow = currentScreen.bottomHalfTile && y === effectiveScreenHeight - 1;
      height += (isTopHalfRow || isBottomHalfRow) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }

    return height;
  }, [activeBounds, dimensions.tileHeight, effectiveScreenHeight, currentScreen]);


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
      case 'wiring':
        contentWidth = fullGridWidth;
        contentHeight = fullGridHeight;
        break;
      case 'raster':
        if (rasterMapConfig) {
          contentWidth = rasterMapConfig.totalWidth;
          contentHeight = rasterMapConfig.totalHeight;
        }
        break;
      case 'deliverables':
        contentWidth = 1000;
        contentHeight = 800;
        break;
    }
  
    if (contentWidth <= 0 || contentHeight <= 0) {
      setZoom(1, true);
      return;
    }
  
    const padding = 64;
    const scaleX = (viewportWidth - padding) / contentWidth;
    const scaleY = (viewportHeight - padding) / contentHeight;
  
    const newZoom = Math.min(scaleX, scaleY);
    setZoom(newZoom > 0 ? newZoom : 1, true);
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

  const dataPortsCount = wiringData ? wiringData.filter(d => d.dataLabel).length : 0;
  const powerPortsCount = wiringData ? wiringData.filter(d => d.powerPortLabel).length : 0;
  let portCount = 0;
  let portLabelText = '';

  if (showDataLabels) {
    portCount = dataPortsCount;
    portLabelText = 'Data Ports';
  } else if (showPowerLabels) {
    portCount = powerPortsCount;
    portLabelText = 'Power Ports';
  }
  
  const fullGridHeight = useMemo(() => {
    if (!currentScreen) return 0;
    let height = 0;
    for (let i = 0; i < effectiveScreenHeight; i++) {
        const isTopHalfRow = currentScreen.topHalfTile && i === 0;
        const isBottomHalfRow = currentScreen.bottomHalfTile && i === effectiveScreenHeight - 1;
        height += (isTopHalfRow || isBottomHalfRow) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }
    return height;
  }, [effectiveScreenHeight, dimensions.tileHeight, currentScreen]);

  const fullGridWidth = useMemo(() => {
    if (!currentScreen) return 0;
    let width = 0;
    for (let i = 0; i < effectiveScreenWidth; i++) {
        const isLeftHalf = currentScreen.leftHalfTile && i === 0;
        const isRightHalf = currentScreen.rightHalfTile && i === effectiveScreenWidth - 1;
        width += (isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }
    return width;
  }, [effectiveScreenWidth, dimensions.tileWidth, currentScreen]);

  return (
    <SidebarProvider>
      <ManualPowerWiringModal
        isOpen={isManualPowerModalOpen}
        onClose={() => setIsManualPowerModalOpen(false)}
        onSubmit={(data) => {
          if (selectedTileForPower !== null) {
            applyManualPowerWiring({ startTileId: selectedTileForPower, ...data });
          }
        }}
      />
      <ManualDataWiringModal
        isOpen={isManualDataModalOpen}
        onClose={() => setIsManualDataModalOpen(false)}
        onSubmit={(data) => {
          if (selectedTileForData !== null) {
            applyManualDataWiring({ startTileId: selectedTileForData, ...data });
          }
        }}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (screenToDelete) {
                deleteScreen(screenToDelete);
                setScreenToDelete(null);
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pixel Map</h2>
          </div>
        </SidebarHeader>
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="flex-grow">
            <Accordion
              type="multiple"
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

              <AccordionItem value="screens" className="border-none">
                <AccordionSectionTrigger icon={<ScreenShare className="size-5" />} title="Screens" />
                <AccordionContent className="bg-background border rounded-b-lg -mt-2 space-y-6 p-4">
                  <div className="space-y-2">
                    {screens.map(screen => (
                      <div key={screen.id} className="flex items-center justify-between rounded-md border p-2 bg-muted/20">
                        {isRenaming === screen.id ? (
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRename(screen.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(screen.id)}
                            className="h-8"
                          />
                        ) : (
                          <Button
                            variant={screen.id === currentScreenId ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-grow justify-start"
                            onClick={() => setCurrentScreenId(screen.id)}
                          >
                            {screen.name}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setIsRenaming(screen.id); setRenameValue(screen.name); }}>
                              <Pencil className="mr-2 size-4" /> Rename
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => duplicateScreen(screen.id)}>
                              <Copy className="mr-2 size-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setScreenToDelete(screen.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                  <Button onClick={addNewScreen} variant="outline" className="w-full">
                    <Plus className="mr-2" />
                    Add New Screen
                  </Button>
                </AccordionContent>
              </AccordionItem>
              
              {activeTab === 'grid' && (
                <>
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
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="labeling" className="border-none">
                    <AccordionSectionTrigger icon={<CaseSensitive className="size-5" />} title="Labeling" />
                     <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                       <p className="text-sm text-muted-foreground pb-4">Customize the labels on the LED tiles.</p>
                       <LabelControls />
                     </AccordionContent>
                  </AccordionItem>
                </>
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
              
              {(activeTab === 'grid' || activeTab === 'wiring') && (
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

              {activeTab === 'deliverables' && (
                <AccordionItem value="project-details" className="border-none">
                  <AccordionSectionTrigger icon={<Info className="size-5" />} title="Project Info" />
                  <AccordionContent className="p-4 bg-background border rounded-b-lg -mt-2">
                    <ProjectDetailsControls />
                  </AccordionContent>
                </AccordionItem>
              )}

            </Accordion>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-screen w-full">
           <header className="sticky top-0 z-10 flex-shrink-0 bg-background p-2 border-b">
            <div className="flex items-center justify-between flex-nowrap gap-4 w-full">
               <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Res: <span className="font-mono">{Math.round(totalWidth)}px</span> x <span className="font-mono">{Math.round(totalHeight)}px</span>
                  </div>
                  {activeTab === 'wiring' && portCount > 0 && (
                    <>
                      <Separator orientation="vertical" className="h-6" />
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        ({portCount} {portLabelText})
                      </span>
                    </>
                  )}
                </div>
               </div>
              
               <div className="flex-1 flex justify-center">
                <TabsList>
                  <TabsTrigger value="grid">LED Grid</TabsTrigger>
                  <TabsTrigger value="wiring">Wiring Diagram</TabsTrigger>
                  <TabsTrigger value="raster">Raster Map</TabsTrigger>
                  <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                </TabsList>
               </div>

               <div className="flex items-center gap-2">
                 {activeTab === 'wiring' && (
                   <div className="flex items-center space-x-2">
                     <Switch id="mirror-switch" checked={isWiringMirrored} onCheckedChange={setIsWiringMirrored} />
                     <Label htmlFor="mirror-switch" className="flex items-center gap-2 whitespace-nowrap"><RefreshCw className="size-4" /> Mirror</Label>
                   </div>
                 )}
                 <Separator orientation="vertical" className="h-6 mx-1" />
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
                 </div>
                 <Separator orientation="vertical" className="h-6 mx-1" />
                 <Button onClick={handleFitToScreen} variant="ghost" size="icon" className="h-8 w-8" aria-label="Fit to Screen">
                   <Expand />
                 </Button>
               </div>
             </div>
           </header>
          <ScrollArea className="h-full w-full bg-muted/20" viewportRef={viewportRef}>
              <TabsContent value="grid" className="mt-0 p-8 inline-block min-w-full">
                <div className="inline-block" style={{ width: fullGridWidth * zoom, height: fullGridHeight * zoom }}>
                  <LedGrid />
                </div>
              </TabsContent>
              <TabsContent value="wiring" className="mt-0 p-8 inline-block min-w-full">
                <div className="inline-block" style={{ width: fullGridWidth * zoom, height: fullGridHeight * zoom }}>
                  <WiringDiagram />
                </div>
              </TabsContent>
              <TabsContent value="raster" className="mt-0 p-8 inline-block min-w-full">
                 <div className="inline-block" style={{ width: (rasterMapConfig?.totalWidth ?? 0) * zoom, height: (rasterMapConfig?.totalHeight ?? 0) * zoom }}>
                  <RasterMapPreview />
                </div>
              </TabsContent>
              <TabsContent value="deliverables" className="mt-0 p-8 flex justify-center min-w-full">
                 <div style={{ width: 1000 * zoom, minHeight: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                  <DeliverablesView />
                </div>
              </TabsContent>
          </ScrollArea>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}
