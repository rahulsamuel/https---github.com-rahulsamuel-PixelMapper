"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadsControls() {
    const {
        handleDownloadPng,
        rasterMapConfig,
        downloadRasterSlices,
        handleDownloadWiringDiagram,
    } = usePixelMapper();

    return (
        <div className="space-y-2">
            <Button size="sm" onClick={() => handleDownloadPng('pixel-map.png')} variant="outline" className="w-full justify-start">
                <Download className="mr-2" />
                Download Grid as PNG
            </Button>
            {rasterMapConfig && (
                <Button
                    onClick={downloadRasterSlices}
                    disabled={rasterMapConfig.slices.length === 0}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                >
                    <Download className="mr-2" />
                    Download Raster Slices ({rasterMapConfig.slices.length})
                </Button>
            )}
            <Button size="sm" onClick={handleDownloadWiringDiagram} variant="outline" className="w-full justify-start">
                <Download className="mr-2" />
                Download Wiring Diagram
            </Button>
        </div>
    );
}
