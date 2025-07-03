
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";

export function RasterMapPreview() {
  const { 
    rasterMapConfig,
    zoom,
    rasterOffset,
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

  const { totalWidth, totalHeight, outputWidth, outputHeight, previewImage } = rasterMapConfig;

  // The preview area represents the canvas of a single output file (the first slice).
  // This helps visualize how the content fits and offsets within the export frame.
  const previewCanvasWidth = outputWidth;
  const previewCanvasHeight = outputHeight;

  return (
     <div className="p-8 bg-muted/20 overflow-auto">
        <div 
          className="relative"
          style={{ 
              width: previewCanvasWidth, 
              height: previewCanvasHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
          }}
        >
          {/* This is the viewport, representing one slice file. It's black and clips content. */}
          <div
            className="absolute inset-0 bg-black overflow-hidden border border-border shadow-lg"
          >
            {/* This is the full content grid, positioned using the offset */}
            <div
              className="absolute bg-contain bg-no-repeat bg-center"
              style={{
                width: totalWidth,
                height: totalHeight,
                left: rasterOffset.x,
                top: rasterOffset.y,
                backgroundImage: previewImage ? `url(${previewImage})` : 'none',
              }}
            />
          </div>
        </div>
    </div>
  );
}
