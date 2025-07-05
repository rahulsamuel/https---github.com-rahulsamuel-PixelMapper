
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";

export function RasterMapPreview() {
  const { 
    rasterMapConfig,
    zoom,
    rasterOffset,
    sliceOffsetLabels,
    dimensions,
    activeBounds,
    showDataLabels,
  } = usePixelMapper();

  const checkeredBg = useMemo(() => ({
    backgroundImage: `
      linear-gradient(45deg, hsl(var(--muted) / 0.5) 25%, transparent 25%),
      linear-gradient(-45deg, hsl(var(--muted) / 0.5) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.5) 75%),
      linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.5) 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  }), []);


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

  const { totalWidth, totalHeight, previewImage, slices, resolutionType, contentWidth, contentHeight } = rasterMapConfig;
  
  const getSliceBorderColor = () => {
    switch(resolutionType) {
        case 'hd':
            return 'border-chart-1'; // Blue
        case '4k-uhd':
            return 'border-chart-2'; // Green
        case '4k-dci':
            return 'border-chart-4'; // Purple
        case 'content':
        default:
            return 'border-primary';
    }
  }
  
  return (
     <div className="p-4 bg-muted/20 w-full">
        <div 
          className="relative bg-background shadow-lg border"
          style={{ 
              width: totalWidth, 
              height: totalHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              ...checkeredBg,
              boxSizing: 'content-box',
              overflow: 'hidden',
          }}
        >
            {previewImage && (
                <img 
                    src={previewImage} 
                    alt="LED Grid Preview"
                    className="absolute"
                    style={{
                        left: rasterOffset.x,
                        top: rasterOffset.y,
                        width: contentWidth,
                        height: contentHeight,
                    }}
                />
            )}

            {/* Offset labels */}
            {showDataLabels && activeBounds && sliceOffsetLabels.map((label, index) => {
              if (!label) return null;

              const tileX = index % dimensions.screenWidth;
              const tileY = Math.floor(index / dimensions.screenWidth);

              if (tileX < activeBounds.minX || tileX > activeBounds.maxX || tileY < activeBounds.minY || tileY > activeBounds.maxY) {
                return null;
              }
              
              const labelPosX = rasterOffset.x + (tileX - activeBounds.minX) * dimensions.tileWidth;
              const labelPosY = rasterOffset.y + (tileY - activeBounds.minY) * dimensions.tileHeight;

              return (
                <div
                  key={`raster-offset-label-${index}`}
                  className="absolute bg-black/60 text-white text-xs font-mono px-1 py-0.5 rounded z-20 pointer-events-none"
                  style={{
                    left: labelPosX + 4,
                    top: labelPosY + 4,
                  }}
                >
                  {label}
                </div>
              );
            })}
            
            {/* Slices visualization */}
            {slices && slices.map(slice => (
                <div 
                    key={slice.key} 
                    className={cn(
                        "absolute border-2 border-dashed flex items-center justify-center pointer-events-none z-10",
                        getSliceBorderColor()
                    )}
                    style={{
                        left: slice.x,
                        top: slice.y,
                        width: slice.width,
                        height: slice.height,
                        boxSizing: 'border-box'
                    }}
                >
                    <div 
                        className="text-center p-2 rounded-md bg-background/80"
                        style={{
                            transform: `scale(${Math.min(2, Math.max(0.5, 1 / zoom))})`, // Adjust label size based on zoom
                            transformOrigin: 'center center',
                        }}
                    >
                        <p className="font-bold whitespace-nowrap">{slice.filename.split('/').pop()?.replace('.png','').replace('raster-map-','')}</p>
                        <p className="font-mono text-xs whitespace-nowrap">Size: {slice.width}x{slice.height}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
