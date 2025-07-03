
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";

export function RasterMapPreview() {
  const { 
    rasterMapConfig,
    zoom,
  } = usePixelMapper();


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
     <div className="p-8 bg-muted/20">
        <div 
        className="relative bg-background shadow-lg border bg-contain bg-no-repeat bg-center"
        style={{ 
            width: totalWidth, 
            height: totalHeight,
            backgroundImage: previewImage ? `url(${previewImage})` : 'none',
            boxSizing: 'content-box',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
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
                left: slice.x,
                top: slice.y,
                width: displayWidth,
                height: displayHeight,
                boxSizing: 'border-box'
            }}
            >
            <div 
                className="text-primary text-center p-1 overflow-hidden"
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
  );
}
