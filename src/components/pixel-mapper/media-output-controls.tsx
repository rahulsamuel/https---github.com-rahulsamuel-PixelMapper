"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Button } from "@/components/ui/button";
import { FileOutput } from "lucide-react";
import { Label } from "@/components/ui/label";

export function MediaOutputControls() {
  const { 
    generateRasterMap, 
    dimensions, 
    activeBounds,
  } = usePixelMapper();
  
  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : dimensions.screenHeight * dimensions.tileHeight;
  const { tileWidth, tileHeight } = dimensions;

  return (
    <div className="space-y-4">
      <div>
        <Label className="font-semibold">Raster Map Generation</Label>
        <p className="text-sm text-muted-foreground pb-2">Create raster maps for media servers.</p>
        <div className="space-y-2">
          <Button onClick={() => generateRasterMap(`raster-map-content.png`)} className="w-full">
              <FileOutput className="mr-2 size-4" />
              Fit to Content ({totalWidth}x{totalHeight})
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-hd.png', 1920, 1080)} variant="outline" className="w-full" disabled={tileWidth > 1920 || tileHeight > 1080}>
              HD (1920x1080)
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-4k-uhd.png', 3840, 2160)} variant="outline" className="w-full" disabled={tileWidth > 3840 || tileHeight > 2160}>
              4K UHD (3840x2160)
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-4k-dci.png', 4096, 2160)} variant="outline" className="w-full" disabled={tileWidth > 4096 || tileHeight > 2160}>
              4K DCI (4096x2160)
          </Button>
        </div>
      </div>
    </div>
  );
}
