"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DownloadsControls() {
    const {
        handleDownloadPng,
        handleDownloadWiringDiagram,
        downloadRasterSlices,
        rasterMapConfig,
        activeBounds,
        activeTab,
    } = usePixelMapper();

    const isGridEmpty = !activeBounds;
    const isGridTab = activeTab === 'grid';
    const isWiringTab = activeTab === 'wiring';

    const pngDownloadDisabled = isGridEmpty || !isGridTab;
    const wiringDownloadDisabled = isGridEmpty || !isWiringTab;

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
                    <Button size="sm" onClick={() => handleDownloadPng('pixel-map.png')} variant="outline" className="w-full justify-start">
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
                
                <Button 
                    size="sm" 
                    onClick={downloadRasterSlices} 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!rasterMapConfig || rasterMapConfig.slices.length === 0}
                >
                    <Download className="mr-2" />
                    Download Raster Slices
                </Button>
            </div>
        </TooltipProvider>
    );
}
