
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Download, Gem } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";

export function DownloadsControls() {
    const {
        handleDownloadPng,
        handleDownloadWiringDiagram,
        downloadRasterSlices,
        handleDownloadFullRaster,
        rasterMapConfig,
        activeBounds,
        activeTab,
    } = usePixelMap();

    const { subscriptionStatus } = useAuth();
    const isPro = subscriptionStatus === 'pro';

    const isGridEmpty = !activeBounds;
    const isGridTab = activeTab === 'grid';
    const isWiringTab = activeTab === 'wiring';
    const isRasterTab = activeTab === 'raster';

    const pngDownloadDisabled = isGridEmpty || !isGridTab;
    const wiringDownloadDisabled = isGridEmpty || !isWiringTab;
    const slicesDownloadDisabled = !isPro || !rasterMapConfig || rasterMapConfig.slices.length === 0;
    const fullRasterDownloadDisabled = !isPro || !rasterMapConfig || !isRasterTab;

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

    let fullRasterTooltip;
    if (!isPro) {
        fullRasterTooltip = "This is a Pro feature. Please subscribe for full access.";
    } else if (!rasterMapConfig) {
        fullRasterTooltip = "Generate a raster map first.";
    } else if (!isRasterTab) {
        fullRasterTooltip = "Switch to the Raster Map Preview tab to download.";
    }
    
    let slicesDownloadTooltip;
    if (!isPro) {
        slicesDownloadTooltip = "This is a Pro feature. Please subscribe for full access.";
    } else if (!rasterMapConfig || rasterMapConfig.slices.length === 0) {
        slicesDownloadTooltip = "Generate a raster map with slices first.";
    }


    return (
        <TooltipProvider>
            <div className="space-y-2">
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
                    <Button size="sm" onClick={() => handleDownloadPng('pixel-map-grid.png')} variant="outline" className="w-full justify-start">
                        <Download className="mr-2" />
                        Download Grid as PNG
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
                
                {slicesDownloadDisabled ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Gem className="mr-2" />
                                    Download Raster Slices
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{slicesDownloadTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={downloadRasterSlices} variant="outline" className="w-full justify-start">
                        <Gem className="mr-2" />
                        Download Raster Slices
                    </Button>
                )}
                
                {fullRasterDownloadDisabled ? (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button size="sm" variant="outline" className="w-full justify-start" disabled>
                                    <Gem className="mr-2" />
                                    Download Full Raster Map
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{fullRasterTooltip}</p></TooltipContent>
                    </Tooltip>
                ) : (
                    <Button size="sm" onClick={handleDownloadFullRaster} variant="outline" className="w-full justify-start">
                        <Gem className="mr-2" />
                        Download Full Raster Map
                    </Button>
                )}
            </div>
        </TooltipProvider>
    );
}
