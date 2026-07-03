
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";

function getLabelPosition(pos: string, width: number, height: number, fontSize: number) {
  const pad = fontSize * 0.6;
  switch (pos) {
    case 'top-left':     return { top: pad, left: pad, transform: 'none', textAlign: 'left' as const };
    case 'top-right':    return { top: pad, right: pad, transform: 'none', textAlign: 'right' as const };
    case 'bottom-left':  return { bottom: pad, left: pad, transform: 'none', textAlign: 'left' as const };
    case 'bottom-right': return { bottom: pad, right: pad, transform: 'none', textAlign: 'right' as const };
    default:             return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' as const };
  }
}

export function RasterMapPreview() {
  const {
    rasterMapConfig,
    zoom,
    rasterMapRef,
    rasterBgColor,
    screens,
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

  return (
    <div>
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
                "absolute border-2 border-dashed flex items-center justify-center pointer-events-none z-10",
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
                className="text-center p-2 rounded-md bg-background/80"
                style={{
                  transform: `scale(${Math.min(2, Math.max(0.5, 1 / zoom))})`,
                  transformOrigin: 'center center',
                }}
              >
                <p className="font-bold whitespace-nowrap">{slice.filename.split('/').pop()?.replace('.png', '').replace('raster-map-', '')}</p>
                <p className="font-mono text-xs whitespace-nowrap">Size: {slice.width}x{slice.height}</p>
              </div>
            </div>
          ))}

          {/* Screen arrangement borders + overlays */}
          {screenArrangement.map(sa => {
            const labelPos = getLabelPosition(sa.screenNameLabelPosition, sa.width, sa.height, sa.screenNameLabelFontSize);
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
                {/* Screen name label */}
                {sa.showScreenName && (
                  <div
                    className="absolute z-20 font-bold pointer-events-none"
                    style={{
                      fontSize: sa.screenNameLabelFontSize,
                      color: sa.screenNameLabelColor,
                      textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      ...labelPos,
                    }}
                  >
                    {sa.screenName}
                  </div>
                )}

                {/* Tile offset labels */}
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
