"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { FileOutput, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function MediaOutputControls() {
  const { 
    generateRasterMap, 
    dimensions, 
    activeBounds,
    rasterMapConfig, 
    rasterOffset, 
    setRasterOffset
  } = usePixelMapper();
  
  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : dimensions.screenHeight * dimensions.tileHeight;
  const { tileWidth, tileHeight } = dimensions;

  const isOutOfBounds = useMemo(() => {
    if (!rasterMapConfig || !activeBounds || !rasterOffset) return false;
    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const contentHeight = (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight;
    
    return rasterOffset.x < 0 || 
           rasterOffset.y < 0 || 
           (rasterOffset.x + contentWidth) > rasterMapConfig.totalWidth ||
           (rasterOffset.y + contentHeight) > rasterMapConfig.totalHeight;

  }, [rasterMapConfig, activeBounds, dimensions, rasterOffset]);


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
       <div className="space-y-2">
          <Label className="font-semibold">Raster Offset</Label>
          <p className="text-sm text-muted-foreground pb-2">Position the content within the raster map output.</p>
          <div className="flex items-center gap-2">
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-x">Offset X</Label>
                  <Input 
                      id="offset-x" 
                      type="number" 
                      value={rasterOffset.x} 
                      onChange={(e) => setRasterOffset(prev => ({ ...prev, x: Number(e.target.value) || 0 }))} 
                  />
              </div>
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-y">Offset Y</Label>
                  <Input 
                      id="offset-y" 
                      type="number" 
                      value={rasterOffset.y} 
                      onChange={(e) => setRasterOffset(prev => ({ ...prev, y: Number(e.target.value) || 0 }))} 
                  />
              </div>
          </div>
          {isOutOfBounds && (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium pt-2">
              <AlertTriangle className="size-4" />
              <span>Content is outside the raster boundary.</span>
              </div>
          )}
      </div>
    </div>
  );
}
