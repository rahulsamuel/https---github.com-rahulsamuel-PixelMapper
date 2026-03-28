
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";

export function RasterMapPreview() {
  const { 
    rasterMapConfig,
    zoom,
    rasterMapRef,
  } = usePixelMap();

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

  const { totalWidth, totalHeight, previewImage, slices, resolutionType, contentWidth, contentHeight, screenArrangement } = rasterMapConfig;
  
  const getSliceBorderColor = () => {
    switch(resolutionType) {
        case 'hd':
            return 'border-chart-1'; // Blue
        case '4k-uhd':
            return 'border-chart-2'; // Green
        case '4k-dci':
            return 'border-chart-4'; // Purple
        case 'custom':
            return 'border-chart-3'; // Yellow
        case 'content':
        default:
            return 'border-primary';
    }
  }
  
  return (
     <div>
        <div style={{ width: totalWidth * zoom, height: totalHeight * zoom }}>
          <div 
            ref={rasterMapRef}
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
                      className="absolute top-0 left-0"
                      style={{
                          width: contentWidth,
                          height: contentHeight,
                      }}
                  />
              )}
              
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

              {/* Screen Arrangement borders */}
              {screenArrangement.map(screen => (
                 <div
                    key={screen.screenId}
                    className="absolute border border-destructive pointer-events-none"
                    style={{
                        left: screen.x,
                        top: screen.y,
                        width: screen.width,
                        height: screen.height,
                        boxSizing: 'border-box'
                    }}
                 />
              ))}
          </div>
      </div>
    </div>
  );
}
