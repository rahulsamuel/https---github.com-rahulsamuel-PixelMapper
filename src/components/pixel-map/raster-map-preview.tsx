
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { type PointerEvent as ReactPointerEvent, useCallback, useMemo, useRef } from 'react';
import type { Screen, TextOverlay } from "@/contexts/pixel-map-types";
import { cn } from "@/lib/utils";
import { Download, Layers, Plus, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RasterScreenToggles } from "./raster-screen-toggles";

function getRasterCropOffset(screen: Screen, activeBounds: { minX: number; minY: number; maxX: number; maxY: number }): { x: number; y: number } {
  const { tileWidth, tileHeight } = screen.dimensions;
  const effectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
  const effectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
  let x = 0;
  let y = 0;
  for (let index = 0; index < activeBounds.minX; index++) {
    const isHalf = (screen.leftHalfTile && index === 0) || (screen.rightHalfTile && index === effectiveWidth - 1);
    x += isHalf ? tileWidth / 2 : tileWidth;
  }
  for (let index = 0; index < activeBounds.minY; index++) {
    const isHalf = (screen.topHalfTile && index === 0) || (screen.bottomHalfTile && index === effectiveHeight - 1);
    y += isHalf ? tileHeight / 2 : tileHeight;
  }
  return { x, y };
}


export function RasterMapPreview() {
  const {
    rasterMapConfig,
    rasterMapConfigs,
    rasterOutputConfigs,
    rasterGroups,
    activeRasterGroupId,
    setActiveRasterGroupId,
    zoom,
    rasterMapRef,
    rasterBgColor,
    screens,
    downloadRasterSlices,
    updateScreenById,
    currentScreen,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
  } = usePixelMap();

  const groupsWithConfig = rasterGroups.filter(g => rasterMapConfigs[g.id]);
  const showTabs = groupsWithConfig.length > 1;
  const displayGroupId = rasterMapConfigs[activeRasterGroupId]
    ? activeRasterGroupId
    : groupsWithConfig[0]?.id ?? activeRasterGroupId;
  const displayConfig = rasterOutputConfigs[displayGroupId] ?? null;

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
      <div className="space-y-3">
        <RasterScreenToggles groupId={displayGroupId} />
        <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
          <div className="text-center">
            <p className="text-sm">No screens assigned to this raster output.</p>
          </div>
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

  const overlaysVisible = screenArrangement.every(sa => screens.find(s => s.id === sa.screenId)?.showTextOverlaysInRaster ?? true);
  const setOverlaysVisible = (checked: boolean) => {
    for (const sa of screenArrangement) {
      updateScreenById(sa.screenId, s => ({ ...s, showTextOverlaysInRaster: checked }));
    }
  };

  const logoVisible = screenArrangement.every(sa => screens.find(s => s.id === sa.screenId)?.showLogoOverlayInRaster ?? true);
  const setLogoVisible = (checked: boolean) => {
    for (const sa of screenArrangement) {
      updateScreenById(sa.screenId, s => ({ ...s, showLogoOverlayInRaster: checked }));
    }
  };

  const dragRef = useRef<{
    screenId: string;
    overlayId: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    pointerId: number;
  } | null>(null);

  const handleOverlayPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>, screenId: string, overlay: TextOverlay) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      screenId,
      overlayId: overlay.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: overlay.x,
      startY: overlay.y,
      pointerId: event.pointerId,
    };
  }, []);

  const handleOverlayPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateScreenById(drag.screenId, (screen) => ({
      ...screen,
      textOverlays: (screen.textOverlays ?? []).map((overlay) => overlay.id === drag.overlayId
        ? {
            ...overlay,
            x: Math.max(0, drag.startX + (event.clientX - drag.startClientX) / zoom),
            y: Math.max(0, drag.startY + (event.clientY - drag.startClientY) / zoom),
          }
        : overlay),
    }));
  }, [updateScreenById, zoom]);

  const finishOverlayDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const currentOverlays = currentScreen.textOverlays ?? [];

  return (
    <div className="space-y-2">
      <RasterScreenToggles groupId={displayGroupId} />
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
                {rasterOutputConfigs[g.id]?.screenArrangement.length ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-4 px-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="raster-logo-overlay" className="text-xs text-muted-foreground">Logo overlay</Label>
          <Switch id="raster-logo-overlay" checked={logoVisible} onCheckedChange={setLogoVisible} />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="raster-text-overlays" className="text-xs text-muted-foreground">Text overlays</Label>
          <Switch id="raster-text-overlays" checked={overlaysVisible} onCheckedChange={setOverlaysVisible} />
        </div>
      </div>

      <div className="space-y-2 rounded-md border bg-muted/20 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Type className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-medium">Text overlays</span>
            <span className="truncate text-[11px] text-muted-foreground">for {currentScreen.name}</span>
          </div>
          <Button type="button" size="sm" variant="outline" className="h-7 shrink-0 gap-1 text-xs" onClick={addTextOverlay}>
            <Plus className="h-3.5 w-3.5" />
            Add text
          </Button>
        </div>
        {currentOverlays.length > 0 && (
          <div className="space-y-2">
            {currentOverlays.map((overlay) => (
              <div key={overlay.id} className="grid grid-cols-[minmax(120px,1fr)_32px_minmax(90px,150px)_28px] items-center gap-2">
                <Input
                  value={overlay.text}
                  onChange={(event) => updateTextOverlay(overlay.id, { text: event.target.value })}
                  className="h-7 text-xs"
                  aria-label="Overlay text"
                />
                <Input
                  type="color"
                  value={overlay.colorMode === 'auto' ? '#ffffff' : overlay.color}
                  onChange={(event) => updateTextOverlay(overlay.id, { color: event.target.value, colorMode: 'single' })}
                  className="h-7 w-8 cursor-pointer p-0.5"
                  aria-label="Overlay color"
                />
                <div className="flex items-center gap-2">
                  <Slider
                    min={12}
                    max={256}
                    step={1}
                    value={[overlay.fontSize]}
                    onValueChange={([fontSize]) => updateTextOverlay(overlay.id, { fontSize })}
                    aria-label={`Font size for ${overlay.text || 'text overlay'}`}
                  />
                  <span className="w-8 text-right text-[10px] text-muted-foreground">{overlay.fontSize}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeTextOverlay(overlay.id)}
                  aria-label={`Remove ${overlay.text || 'text overlay'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Drag text directly on the raster preview to reposition it.</p>
      </div>

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
          {screenArrangement.map((sa, arrangementIndex) => {
            const offsetItems = tileOffsetsByScreen.get(`${sa.screenId}-${sa.segmentId}`) ?? [];
            const screen = screens.find(s => s.id === sa.screenId);
            if (!screen) return null;
            const screenOverlays = (screen.showTextOverlaysInRaster ?? true) ? (screen.textOverlays ?? []) : [];
            const firstArrangementIndex = screenArrangement.findIndex((candidate) => candidate.screenId === screen.id);

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
                  const cropOffset = getRasterCropOffset(screen, sa.activeBounds);
                  return screenOverlays.map(overlay => {
                    const shiftedX = overlay.x - cropOffset.x;
                    const shiftedY = overlay.y - cropOffset.y;
                    const isInsideThisArrangement = shiftedX <= sa.width
                      && shiftedY <= sa.height
                      && shiftedX + overlay.fontSize * (overlay.text?.length ?? 4) >= 0
                      && shiftedY + overlay.fontSize >= 0;
                    const isInsideAnyArrangement = screenArrangement.some((candidate) => {
                      if (candidate.screenId !== screen.id) return false;
                      const candidateOffset = getRasterCropOffset(screen, candidate.activeBounds);
                      const candidateX = overlay.x - candidateOffset.x;
                      const candidateY = overlay.y - candidateOffset.y;
                      return candidateX <= candidate.width
                        && candidateY <= candidate.height
                        && candidateX + overlay.fontSize * (overlay.text?.length ?? 4) >= 0
                        && candidateY + overlay.fontSize >= 0;
                    });
                    if (!isInsideThisArrangement && (arrangementIndex !== firstArrangementIndex || isInsideAnyArrangement)) return null;
                    return (
                      <div
                        key={overlay.id}
                        className="fixed z-20 cursor-grab pointer-events-auto select-none active:cursor-grabbing"
                        style={{
                          left: sa.x + shiftedX,
                          top: sa.y + shiftedY,
                          transform: `rotate(${overlay.rotation}deg)`,
                          transformOrigin: 'center',
                          touchAction: 'none',
                        }}
                        onPointerDown={(event) => handleOverlayPointerDown(event, screen.id, overlay)}
                        onPointerMove={handleOverlayPointerMove}
                        onPointerUp={finishOverlayDrag}
                        onPointerCancel={finishOverlayDrag}
                      >
                        <div
                          className="whitespace-nowrap"
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
