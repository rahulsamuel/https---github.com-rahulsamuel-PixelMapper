
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from "react";

export function RasterMapPreview() {
  const { rasterMapConfig } = usePixelMapper();

  const scale = useMemo(() => {
    if (!rasterMapConfig) return 1;
    const { totalWidth, totalHeight } = rasterMapConfig;
    if (totalWidth === 0 || totalHeight === 0) return 1;
    
    // Define a max preview size
    const MAX_PREVIEW_DIMENSION = 800; // in pixels
    return Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(totalWidth, totalHeight));
  }, [rasterMapConfig]);

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

  const { slices, totalWidth, totalHeight } = rasterMapConfig;

  return (
     <div className="p-8 bg-muted/20 w-full h-full overflow-auto flex items-center justify-center">
        <div 
          className="relative bg-background shadow-lg border"
          style={{ 
            width: totalWidth * scale, 
            height: totalHeight * scale
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
                  transform: `scale(${Math.min(1, scale * 8)})`, // Adjust text size based on scale
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
  );
}
