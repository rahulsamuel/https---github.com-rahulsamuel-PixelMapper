
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";


export function RasterMapPreview() {
  const {
    rasterMapConfig,
    rasterMapConfigs,
    rasterGroups,
    activeRasterGroupId,
    setActiveRasterGroupId,
    zoom,
    rasterMapRef,
    rasterBgColor,
    screens,
    downloadRasterSlices,
  } = usePixelMap();

  const groupsWithConfig = rasterGroups.filter(g => rasterMapConfigs[g.id]);
  const showTabs = groupsWithConfig.length > 1;
  const displayGroupId = rasterMapConfigs[activeRasterGroupId]
    ? activeRasterGroupId
    : groupsWithConfig[0]?.id ?? activeRasterGroupId;
  const displayConfig = rasterMapConfigs[displayGroupId] ?? null;

  // Per-screen tile offset labels — must be called unconditionally (hook rules)
  const tileOffsetsByScreen = useMemo(() => {
    const result = new Map<string, { x: number; y: number; tileX: number; tileY: number; label: string }[]>();
    if (!displayConfig) return result;

    for (const arrangement of displayConfig.screenArrangement) {
      if (!arrangement.showSliceOffsetLabels) continue;

      const screen = screens.find(s => s.id === arrangement.screenId);
      if (!screen || !displayConfig.slices.length) continue;

      const { tileWidth, tileHeight } = screen.dimensions;
      const items: { x: number; y: number; tileX: number; tileY: number; label: string }[] = [];

      // Each segment gets its own coordinate label. Do not combine segments by screen ID.
      items.push({
        x: 0,
        y: 0,
        tileX: tileWidth / 2,
        tileY: tileHeight / 2,
        label: `(${arrangement.x},${arrangement.y})`,
      });

      result.set(`${arrangement.screenId}-${arrangement.segmentId}`, items);
      result.set(`${arrangement.screenId}-${arrangement.segmentId}`, items);
    }

    return result;
  }, [displayConfig, screens]);

  // Early returns after all hooks
  if (!displayConfig) {
    const hasAnyConfig = Object.keys(rasterMapConfigs).length > 0;
    if (!hasAnyConfig) {
      return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Raster Map Preview</h3>
            <p className="text-sm">Generate a raster map from the &quot;Media Output&quot; panel to see the preview here.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <p className="text-sm">No screens assigned to this raster output.</p>
        </div>
      </div>
    );
  }

  const { totalWidth, totalHeight, previewImage, slices, resolutionType, contentWidth, contentHeight, screenArrangement } = displayConfig;

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
      {/* Raster group tabs */}
      {showTabs && (
        <div className="flex items-center gap-1 flex-wrap px-1">
          {groupsWithConfig.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveRasterGroupId(g.id)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors border",
                g.id === displayGroupId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {g.name}
              <span className="ml-1.5 opacity-60">
                {rasterMapConfigs[g.id]?.screenArrangement.length ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

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
                </div>
              </div>
            </div>
          ))}

          {/* Screen arrangement borders + tile offset overlays */}
          {screenArrangement.map(sa => {
            const offsetItems = tileOffsetsByScreen.get(`${sa.screenId}-${sa.segmentId}`) ?? [];
            const screen = screens.find(s => s.id === sa.screenId);
            const screenOverlays = screen?.textOverlays ?? [];

            return (
              <div
                key={`${sa.screenId}-${sa.segmentId}`}
                className="absolute pointer-events-none border border-destructive"
                style={{
                  left: sa.x,
                  top: sa.y,
                  width: sa.width,
                  height: sa.height,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
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

                {/* Text overlays — positioned in full-screen coordinate space, clipped to this piece */}
                {(() => {
                  const { tileWidth: tw, tileHeight: th } = screen.dimensions;
                  const effW = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
                  const effH = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
                  const ab = sa.activeBounds;
                  let cropOffsetX = 0;
                  for (let i = 0; i < ab.minX; i++) {
                    const isL = screen.leftHalfTile && i === 0;
                    const isR = screen.rightHalfTile && i === effW - 1;
                    cropOffsetX += (isL || isR) ? tw / 2 : tw;
                  }
                  let cropOffsetY = 0;
                  for (let i = 0; i < ab.minY; i++) {
                    const isT = screen.topHalfTile && i === 0;
                    const isB = screen.bottomHalfTile && i === effH - 1;
                    cropOffsetY += (isT || isB) ? th / 2 : th;
                  }
                  return screenOverlays.map(overlay => {
                    const shiftedX = overlay.x - cropOffsetX;
                    const shiftedY = overlay.y - cropOffsetY;
                    if (shiftedX > sa.width || shiftedY > sa.height || shiftedX + overlay.fontSize * (overlay.text?.length ?? 4) < 0 || shiftedY + overlay.fontSize < 0) return null;
                    return (
                      <div
                        key={overlay.id}
                        className="absolute z-20 pointer-events-none"
                        style={{
                          left: shiftedX,
                          top: shiftedY,
                          transform: `rotate(${overlay.rotation}deg)`,
                          transformOrigin: 'center',
                        }}
                      >
                        <div
                          className="font-bold whitespace-nowrap"
                          style={{
                            fontSize: `${overlay.fontSize}px`,
                            color: overlay.colorMode === 'auto' ? '#FFFFFF' : overlay.color,
                            fontWeight: overlay.fontWeight,
                            backgroundColor: overlay.showBackground ? overlay.backgroundColor : 'transparent',
                            padding: overlay.showBackground ? '4px 10px' : '0',
                            borderRadius: overlay.showBackground ? '4px' : '0',
                            lineHeight: 1.2,
                          }}
                        >
                          {overlay.text || ' '}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
