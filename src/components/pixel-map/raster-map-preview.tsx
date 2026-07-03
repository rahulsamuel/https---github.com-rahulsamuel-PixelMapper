
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";


export function RasterMapPreview() {
  const {
    rasterMapConfig,
    zoom,
    rasterMapRef,
    rasterBgColor,
    screens,
    downloadSingleSlice,
    downloadRasterSlices,
  } = usePixelMap();

  if (!rasterMapConfig) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Raster Map Preview</h3>
          <p className="text-sm">Generate a raster map from the &quot;Media Output&quot; panel to see the preview here.</p>
        </div>
      </div>
    );
  }

  const { totalWidth, totalHeight, previewImage, slices, resolutionType, contentWidth, contentHeight, screenArrangement } = rasterMapConfig;

  // Per-screen tile offset labels: { screenId -> { tileIndex -> label } }
  const tileOffsetsByScreen = useMemo(() => {
    const result = new Map<string, { x: number; y: number; tileX: number; tileY: number; label: string }[]>();

    for (const arrangement of screenArrangement) {
      if (!arrangement.showSliceOffsetLabels) continue;

      const screen = screens.find(s => s.id === arrangement.screenId);
      if (!screen || !rasterMapConfig.slices.length) continue;

      const { tileWidth, tileHeight } = screen.dimensions;
      const effW = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
      const effH = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
      const ab = arrangement.activeBounds;
      const { outputWidth, outputHeight } = rasterMapConfig;

      const items: { x: number; y: number; tileX: number; tileY: number; label: string }[] = [];

      const tilesBySlice = new Map<string, number[]>();
      const activeTiles = screen.tiles.map((_, i) => i).filter(i => !screen.tiles[i].deleted);

      activeTiles.forEach(index => {
        const tx = index % effW;
        const ty = Math.floor(index / effW);
        if (tx < ab.minX || tx > ab.maxX || ty < ab.minY || ty > ab.maxY) return;

        let tcy = 0;
        for (let i = ab.minY; i < ty; i++) {
          const isTop = screen.topHalfTile && i === 0;
          const isBot = screen.bottomHalfTile && i === effH - 1;
          tcy += (isTop || isBot) ? tileHeight / 2 : tileHeight;
        }
        let tcx = 0;
        for (let i = ab.minX; i < tx; i++) {
          const isL = screen.leftHalfTile && i === 0;
          const isR = screen.rightHalfTile && i === effW - 1;
          tcx += (isL || isR) ? tileWidth / 2 : tileWidth;
        }

        const absX = tcx + arrangement.x;
        const absY = tcy + arrangement.y;
        const sliceKey = `${Math.floor(absY / outputHeight)}-${Math.floor(absX / outputWidth)}`;
        if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
        tilesBySlice.get(sliceKey)!.push(index);
      });

      tilesBySlice.forEach((sliceIndices, sliceKey) => {
        if (!sliceIndices.length) return;
        const slice = rasterMapConfig.slices.find(s => s.key === sliceKey);
        if (!slice) return;
        const firstIndex = sliceIndices[0];
        const tx = firstIndex % effW;
        const ty = Math.floor(firstIndex / effW);

        let tcy = 0;
        for (let i = ab.minY; i < ty; i++) {
          const isTop = screen.topHalfTile && i === 0;
          const isBot = screen.bottomHalfTile && i === effH - 1;
          tcy += (isTop || isBot) ? tileHeight / 2 : tileHeight;
        }
        let tcx = 0;
        for (let i = ab.minX; i < tx; i++) {
          const isL = screen.leftHalfTile && i === 0;
          const isR = screen.rightHalfTile && i === effW - 1;
          tcx += (isL || isR) ? tileWidth / 2 : tileWidth;
        }

        const absX = tcx + arrangement.x;
        const absY = tcy + arrangement.y;
        const offsetXInSlice = absX - slice.x;
        const offsetYInSlice = absY - slice.y;

        // Position relative to the screen arrangement box
        items.push({
          x: tcx,
          y: tcy,
          tileX: tileWidth / 2,
          tileY: tileHeight / 2,
          label: `(${offsetXInSlice},${offsetYInSlice})`,
        });
      });

      result.set(arrangement.screenId, items);
    }

    return result;
  }, [rasterMapConfig, screens, screenArrangement]);

  const getSliceBorderColor = () => {
    switch (resolutionType) {
      case 'hd':       return 'border-chart-1';
      case '4k-uhd':   return 'border-chart-2';
      case '4k-dci':   return 'border-chart-4';
      case 'custom':   return 'border-chart-3';
      default:         return 'border-primary';
    }
  };

  const hasMultipleSlices = slices && slices.length > 1;

  return (
    <div className="space-y-2">
      {hasMultipleSlices && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{slices.length} raster slices — content spans multiple outputs</span>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={downloadRasterSlices}>
            <Download className="h-3.5 w-3.5" />
            Download All ({slices.length})
          </Button>
        </div>
      )}
      <div style={{ width: totalWidth * zoom, height: totalHeight * zoom }}>
        <div
          ref={rasterMapRef}
          className="relative shadow-lg border"
          style={{
            width: totalWidth,
            height: totalHeight,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            backgroundColor: rasterBgColor,
            boxSizing: 'content-box',
            overflow: 'hidden',
          }}
        >
          {previewImage && (
            <img
              src={previewImage}
              alt="LED Grid Preview"
              className="absolute top-0 left-0"
              style={{ width: contentWidth, height: contentHeight }}
            />
          )}

          {/* Slices visualization */}
          {slices && slices.map(slice => (
            <div
              key={slice.key}
              className={cn(
                "absolute border-2 border-dashed z-10",
                getSliceBorderColor()
              )}
              style={{
                left: slice.x,
                top: slice.y,
                width: slice.width,
                height: slice.height,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                style={{
                  transform: `translate(-50%, -50%) scale(${Math.min(2, Math.max(0.5, 1 / zoom))})`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-background/85">
                  <p className="font-bold whitespace-nowrap text-sm">{slice.filename.split('/').pop()?.replace('.png', '').replace('raster-map-', '')}</p>
                  <p className="font-mono text-xs whitespace-nowrap text-muted-foreground">Size: {slice.width}x{slice.height}</p>
                  <button
                    className="mt-1 flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1 hover:bg-primary/90 transition-colors"
                    onClick={() => downloadSingleSlice(slice.key)}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Screen arrangement borders + tile offset overlays */}
          {screenArrangement.map(sa => {
            const offsetItems = tileOffsetsByScreen.get(sa.screenId) ?? [];

            return (
              <div
                key={sa.screenId}
                className="absolute pointer-events-none border border-destructive"
                style={{
                  left: sa.x,
                  top: sa.y,
                  width: sa.width,
                  height: sa.height,
                  boxSizing: 'border-box',
                }}
              >
                {/* Tile offset labels (HTML overlay only — screen names are drawn in canvas) */}
                {offsetItems.map((item, i) => (
                  <div
                    key={i}
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.tileX * 2,
                      height: item.tileY * 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span
                      className="text-white font-mono rounded px-0.5"
                      style={{
                        fontSize: Math.max(10, Math.min(20, item.tileX * 0.25)),
                        background: 'rgba(0,0,0,0.6)',
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
