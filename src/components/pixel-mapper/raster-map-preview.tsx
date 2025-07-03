
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Download } from "lucide-react";

export function RasterMapPreview() {
  const { 
    rasterMapConfig, 
    downloadRasterSlices,
    rasterOffset, 
    setRasterOffset, 
    activeBounds, 
    dimensions 
  } = usePixelMapper();

  const scale = useMemo(() => {
    if (!rasterMapConfig) return 1;
    const { totalWidth, totalHeight } = rasterMapConfig;
    if (totalWidth === 0 || totalHeight === 0) return 1;
    
    // Define a max preview size
    const MAX_PREVIEW_DIMENSION = 500; // pixels
    return Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(totalWidth, totalHeight));
  }, [rasterMapConfig]);

  const isOutOfBounds = useMemo(() => {
    if (!rasterMapConfig || !activeBounds || !rasterOffset) return false;
    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const contentHeight = (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight;
    
    return rasterOffset.x < 0 || 
           rasterOffset.y < 0 || 
           (rasterOffset.x + contentWidth) > rasterMapConfig.totalWidth ||
           (rasterOffset.y + contentHeight) > rasterMapConfig.totalHeight;

  }, [rasterMapConfig, activeBounds, dimensions, rasterOffset]);


  if (!rasterMapConfig) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
            <h3 className="text-lg font-semibold">Raster Map Preview</h3>
            <p className="text-sm">Generate a raster map from the "Media Output" panel to see the preview here.</p>
        </div>
      </div>
    );
  }

  const { slices, totalWidth, totalHeight, previewImage } = rasterMapConfig;

  return (
     <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-6">
                <div>
                    <h2 className="text-lg font-semibold">Raster Map Preview</h2>
                    <p className="text-sm text-muted-foreground">
                        {totalWidth}x{totalHeight} ({slices.length} {slices.length === 1 ? 'slice' : 'slices'})
                    </p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="grid w-24 gap-1.5">
                        <Label htmlFor="offset-x">Offset X</Label>
                        <Input 
                            id="offset-x" 
                            type="number" 
                            value={rasterOffset.x} 
                            onChange={(e) => setRasterOffset(prev => ({ ...prev, x: Number(e.target.value) || 0 }))} 
                        />
                    </div>
                    <div className="grid w-24 gap-1.5">
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
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertTriangle className="size-4" />
                    <span>Content is outside the raster boundary.</span>
                    </div>
                )}
            </div>
            <Button
                onClick={downloadRasterSlices}
                disabled={slices.length === 0}
                size="sm"
            >
                <Download className="mr-2" />
                Download Slices
            </Button>
        </div>
        <div className="flex-grow overflow-auto p-8 bg-muted/20 flex items-center justify-center">
            <div 
            className="relative bg-background shadow-lg border bg-contain bg-no-repeat bg-center"
            style={{ 
                width: totalWidth * scale, 
                height: totalHeight * scale,
                backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                boxSizing: 'content-box'
            }}
            >
            {slices.map(slice => {
                const displayWidth = Math.min(slice.width, totalWidth - slice.x);
                const displayHeight = Math.min(slice.height, totalHeight - slice.y);
                if (displayWidth <= 0 || displayHeight <= 0) return null;

                return (
                <div 
                key={slice.key} 
                className="absolute border border-primary/50 bg-primary/10 flex items-center justify-center"
                style={{
                    left: slice.x * scale,
                    top: slice.y * scale,
                    width: displayWidth * scale,
                    height: displayHeight * scale,
                    boxSizing: 'border-box'
                }}
                >
                <div 
                    className="text-primary text-center p-1 overflow-hidden"
                    style={{
                    transform: `scale(${Math.max(0.25, Math.min(1, scale * 1.5))})`,
                    transformOrigin: 'center center'
                    }}
                >
                    <p className="font-bold whitespace-nowrap">{slice.filename.split('/').pop()?.replace('raster-map-','').replace('.png','')}</p>
                    <p className="font-mono text-xs whitespace-nowrap">Offset: ({slice.x}, {slice.y})</p>
                    <p className="font-mono text-xs whitespace-nowrap">Content: {slice.width}x{slice.height}</p>
                </div>
                </div>
                );
            })}
            </div>
        </div>
      </div>
  );
}
