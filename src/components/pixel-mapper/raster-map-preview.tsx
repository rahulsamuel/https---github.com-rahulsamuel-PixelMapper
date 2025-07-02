
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function RasterMapPreview() {
  const { rasterMapConfig, downloadRasterSlices, rasterOffset, setRasterOffset, activeBounds, dimensions } = usePixelMapper();

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
        <div className="p-4 border-b flex-col items-start gap-4">
            <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">
                Preview: {totalWidth}x{totalHeight} ({slices.length} {slices.length === 1 ? 'slice' : 'slices'})
                </h2>
                <Button
                onClick={downloadRasterSlices}
                disabled={slices.length === 0}
                >
                <Download className="mr-2" />
                Download Slices
                </Button>
            </div>
            <div className="flex items-end gap-4 mt-4">
                <div className="grid w-32 gap-1.5">
                    <Label htmlFor="offset-x">Offset X</Label>
                    <Input 
                        id="offset-x" 
                        type="number" 
                        value={rasterOffset.x} 
                        onChange={(e) => setRasterOffset(prev => ({ ...prev, x: Number(e.target.value) || 0 }))} 
                    />
                </div>
                <div className="grid w-32 gap-1.5">
                    <Label htmlFor="offset-y">Offset Y</Label>
                    <Input 
                        id="offset-y" 
                        type="number" 
                        value={rasterOffset.y} 
                        onChange={(e) => setRasterOffset(prev => ({ ...prev, y: Number(e.target.value) || 0 }))} 
                    />
                </div>
                {isOutOfBounds && (
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertTriangle className="size-5" />
                    <span>Warning: Grid is outside the raster boundary.</span>
                  </div>
                )}
            </div>
        </div>
        <div className="p-8 bg-muted/20 w-full flex-grow overflow-auto flex items-center justify-center">
            <div 
            className="relative bg-background shadow-lg border bg-contain bg-no-repeat bg-center"
            style={{ 
                width: totalWidth * scale, 
                height: totalHeight * scale,
                backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                boxSizing: 'content-box'
            }}
            >
            {slices.map(slice => (
                <div 
                key={slice.key} 
                className="absolute border border-primary/50 bg-primary/10 flex items-center justify-center"
                style={{
                    left: slice.x * scale,
                    top: slice.y * scale,
                    width: slice.width * scale,
                    height: slice.height * scale,
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
            ))}
            </div>
        </div>
      </div>
  );
}
