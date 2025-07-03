"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadsControls() {
    const {
        handleDownloadPng,
        handleDownloadWiringDiagram,
        downloadRasterSlices,
        rasterMapConfig,
    } = usePixelMapper();

    return (
        <div className="space-y-2">
            <Button size="sm" onClick={() => handleDownloadPng('pixel-map.png')} variant="outline" className="w-full justify-start">
                <Download className="mr-2" />
                Download Grid as PNG
            </Button>
            <Button size="sm" onClick={handleDownloadWiringDiagram} variant="outline" className="w-full justify-start">
                <Download className="mr-2" />
                Download Wiring Diagram
            </Button>
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
    );
}
