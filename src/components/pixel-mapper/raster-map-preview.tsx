
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";

type RasterMapConfig = ReturnType<typeof usePixelMapper>['rasterMapConfig'];
type ResolutionType = RasterMapConfig extends object ? RasterMapConfig['resolutionType'] : never;

export function RasterMapPreview() {
  const { 
    rasterMapConfig,
    zoom,
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

  const { slices, totalWidth, totalHeight, previewImage, resolutionType } = rasterMapConfig;
  
  const getSliceStyle = (type: ResolutionType) => {
    switch(type) {
      case 'hd':
        return {
          container: 'border-chart-1/50 bg-chart-1/10',
          text: 'text-chart-1'
        };
      case '4k-uhd':
        return {
          container: 'border-chart-2/50 bg-chart-2/10',
          text: 'text-chart-2'
        };
      case '4k-dci':
        return {
          container: 'border-chart-4/50 bg-chart-4/10',
          text: 'text-chart-4'
        };
      case 'content':
      default:
        return {
          container: 'border-primary/50 bg-primary/10',
          text: 'text-primary'
        };
    }
  };

  const sliceStyle = getSliceStyle(resolutionType);

  return (
     <div className="p-4 bg-muted/20 w-full h-full">
        <div 
          className="relative bg-background shadow-lg border"
          style={{ 
              width: totalWidth, 
              height: totalHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              ...checkeredBg,
              boxSizing: 'content-box'
          }}
        >
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {slices.map(slice => (
                <div 
                key={slice.key} 
                className={cn(
                  "absolute border flex items-center justify-center pointer-events-none",
                  sliceStyle.container
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
                        className={cn(
                          "text-center p-1 bg-background/80 rounded",
                          sliceStyle.text
                          )}
                    >
                        <p className="font-bold whitespace-nowrap">{slice.filename.split('/').pop()?.replace('raster-map-','').replace('.png','')}</p>
                        <p className="font-mono text-xs whitespace-nowrap">{slice.width}x{slice.height}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
