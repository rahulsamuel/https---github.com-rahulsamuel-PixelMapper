
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Type, ImagePlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";

export function DownloadsControls() {
    const {
        handleDownloadPng,
    isPngDownloading,
    handleDownloadWiringDiagram,
    handleDownloadCompositeWiringDiagram,
    downloadRasterSlices,
    handleDownloadFullRaster,
    rasterMapConfig,
    activeBounds,
    activeTab,
    screens,
    currentScreen,
    includeTextOverlaysInDownload,
    setIncludeTextOverlaysInDownload,
    wallLayoutLegend,
    setWallLayoutLegend,
    handleDownloadWallLayout,
    isWallLayoutDownloading,
} = usePixelMap();

    const isGridEmpty = !activeBounds;
    const isGridTab = activeTab === 'grid';
    const isWiringTab = activeTab === 'wiring';
    const isRasterTab = activeTab === 'raster';
    const hasMultipleScreens = screens.length > 1;

    const pngDownloadDisabled = isGridEmpty || !isGridTab;
    const wiringDownloadDisabled = isGridEmpty || !isWiringTab;
    const compositeWiringDownloadDisabled = isGridEmpty || !rasterMapConfig || !hasMultipleScreens;
    const slicesDownloadDisabled = !rasterMapConfig || rasterMapConfig.slices.length === 0;
    const fullRasterDownloadDisabled = !rasterMapConfig || !isRasterTab;

    let pngTooltip;
    if (isGridEmpty) {
        pngTooltip = "Cannot download an empty grid.";
    } else if (!isGridTab) {
        pngTooltip = "Switch to the Grid tab to download.";
    }

    let wiringTooltip;
    if (isGridEmpty) {
        wiringTooltip = "Cannot download an empty grid.";
    } else if (!isWiringTab) {
        wiringTooltip = "Switch to the Wiring Diagram tab to download.";
    }

    let compositeWiringTooltip;
    if (isGridEmpty) {
        compositeWiringTooltip = "Cannot download an empty grid.";
    } else if (!rasterMapConfig) {
        compositeWiringTooltip = "Generate a raster map first to set screen positions.";
    } else if (!hasMultipleScreens) {
        compositeWiringTooltip = "This download is for projects with multiple screens.";
    }

    let fullRasterTooltip;
    if (!rasterMapConfig) {
        fullRasterTooltip = "Generate a raster map first.";
    } else if (!isRasterTab) {
        fullRasterTooltip = "Switch to the Raster Map Preview tab to download.";
    }

    let slicesDownloadTooltip;
    if (!rasterMapConfig || rasterMapConfig.slices.length === 0) {
        slicesDownloadTooltip = "Generate a raster map with slices first.";
    }

    // Collect unique colors present in the current screen for the legend editor
    const legendColors = useMemo(() => {
        const screenEffW = currentScreen.dimensions.screenWidth + (currentScreen.leftHalfTile ? 1 : 0) + (currentScreen.rightHalfTile ? 1 : 0);
        const colors: { color: string; label: string }[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < currentScreen.tiles.length; i++) {
            const tile = currentScreen.tiles[i];
            if (tile.deleted) continue;
            let bg = (i % screenEffW + Math.floor(i / screenEffW)) % 2 === 0 ? currentScreen.tileColor : currentScreen.tileColorTwo;
            if (currentScreen.onOffMode) bg = '#FFFFFF';
            else if (tile.color) bg = tile.color;
            if (!seen.has(bg)) {
                seen.add(bg);
                const existing = wallLayoutLegend.find(e => e.color === bg);
                colors.push({ color: bg, label: existing?.label ?? '' });
            }
        }
        return colors;
    }, [currentScreen, wallLayoutLegend]);

    const updateLegendLabel = (color: string, label: string) => {
        setWallLayoutLegend(prev => {
            const existing = prev.find(e => e.color === color);
            if (existing) {
                return prev.map(e => e.color === color ? { ...e, label } : e);
            }
            return [...prev, { color, label }];
        });
    };

    return (
        <TooltipProvider>
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-1 border rounded-md bg-muted/30">
                    <Label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Type className="h-3.5 w-3.5" />
                        Include text overlays
                    </Label>
                    <Switch
                        checked={includeTextOverlaysInDownload}
                        onCheckedChange={setIncludeTextOverlaysInDownload}
                    />
                </div>
                {pngDownloadDisabled ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Download className="mr-2" />
                                    Download Grid as PNG
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{pngTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={() => handleDownloadPng()} disabled={isPngDownloading} variant="outline" className="w-full justify-start">
                        {isPngDownloading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2" />
                        )}
                        {isPngDownloading ? "Generating PNG..." : "Download Grid as PNG"}
                    </Button>
                )}
                
                {wiringDownloadDisabled ? (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Download className="mr-2" />
                                    Download Wiring Diagram
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{wiringTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={handleDownloadWiringDiagram} variant="outline" className="w-full justify-start">
                        <Download className="mr-2" />
                        Download Wiring Diagram
                    </Button>
                )}
                
                {compositeWiringDownloadDisabled ? (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Download className="mr-2" />
                                    Download Composite Wiring
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{compositeWiringTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={handleDownloadCompositeWiringDiagram} variant="outline" className="w-full justify-start">
                        <Download className="mr-2" />
                        Download Composite Wiring
                    </Button>
                )}

                {slicesDownloadDisabled ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Download className="mr-2" />
                                    Download Raster Slices
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{slicesDownloadTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={downloadRasterSlices} variant="outline" className="w-full justify-start">
                        <Download className="mr-2" />
                        Download Raster Slices
                    </Button>
                )}

                {fullRasterDownloadDisabled ? (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Download className="mr-2" />
                                    Download Full Raster Map
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{fullRasterTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={handleDownloadFullRaster} variant="outline" className="w-full justify-start">
                        <Download className="mr-2" />
                        Download Full Raster Map
                    </Button>
                )}

                <Separator className="my-3" />
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Wall Layout Export</Label>
                    <p className="text-xs text-muted-foreground">Exports the exact pixel map with tile-count dimensions and a color legend.</p>

                    {legendColors.length > 0 && (
                        <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
                            <Label className="text-xs font-medium text-muted-foreground">Legend Labels</Label>
                            {legendColors.map(({ color, label }) => (
                                <div key={color} className="flex items-center gap-2">
                                    <div
                                        className="h-5 w-5 shrink-0 rounded border border-black/20"
                                        style={{ backgroundColor: color }}
                                    />
                                    <Input
                                        type="text"
                                        value={label}
                                        onChange={(e) => updateLegendLabel(color, e.target.value)}
                                        placeholder={color}
                                        className="h-7 flex-1 text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {isGridEmpty ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                        <ImagePlus className="mr-2" />
                                        Download Wall Layout
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Cannot download an empty grid.</p></TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button size="sm" onClick={handleDownloadWallLayout} disabled={isWallLayoutDownloading} variant="outline" className="w-full justify-start">
                            {isWallLayoutDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ImagePlus className="mr-2" />
                            )}
                            {isWallLayoutDownloading ? "Generating..." : "Download Wall Layout"}
                        </Button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
