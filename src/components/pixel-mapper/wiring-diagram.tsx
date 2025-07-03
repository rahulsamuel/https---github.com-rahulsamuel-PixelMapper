
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { getWiringData } from "@/lib/wiring";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toPng } from "html-to-image";

export function WiringDiagram() {
  const { 
    dimensions, 
    tiles, 
    tileColor, 
    tileColorTwo, 
    onOffMode, 
    wiringPortConfig, 
    zoom,
    showDataLabels,
    showPowerLabels,
    labels,
    showLabels,
    labelColor,
    wiringPattern,
    arrowheadSize,
    arrowheadLength,
    arrowGap,
    rasterMapConfig,
    activeBounds,
  } = usePixelMapper();
  const [isMirrored, setIsMirrored] = useState(false);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);

  const wiringData = getWiringData({ dimensions, tiles, wiringPortConfig, wiringPattern, rasterMapConfig, activeBounds });
  const mainPortsCount = wiringData.filter(d => d.dataLabel).length;

  const handleDownload = () => {
    if (wiringDiagramRef.current) {
      toPng(wiringDiagramRef.current, { 
          cacheBust: true, 
          backgroundColor: 'hsl(var(--background))',
          pixelRatio: 2
      })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `wiring-diagram${isMirrored ? '-mirrored' : ''}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("Failed to generate wiring diagram image", err);
        });
    }
  };
  
  const TILE_SIZE = 120;
  
  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-background p-4 border-b flex justify-between items-center">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">Wiring Diagram</h2>
          {mainPortsCount > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              ({mainPortsCount} Main Ports)
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="mirror-switch" checked={isMirrored} onCheckedChange={setIsMirrored} />
            <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
          </div>
          <Button onClick={handleDownload}><Download className="mr-2 size-4" /> Download</Button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="p-4 bg-muted/20">
          <div 
            ref={wiringDiagramRef}
            className="relative bg-background"
            style={{ 
              width: dimensions.screenWidth * TILE_SIZE, 
              height: dimensions.screenHeight * TILE_SIZE,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {wiringData.map(({ x, y, dataLabel, powerLabel, backupLabel, isDeleted }, index) => {
              const originalIndex = y * dimensions.screenWidth + x;
              const tile = tiles[originalIndex];

              let bgColor;
              if (onOffMode) {
                bgColor = isDeleted ? '#000000' : '#FFFFFF';
              } else {
                if (isDeleted) {
                  bgColor = '#000000';
                } else if (tile?.color) {
                  bgColor = tile.color;
                } else {
                  bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
                }
              }

              const tileStyle = {
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: bgColor,
                border: isDeleted ? 'none' : '1px solid hsl(var(--border))',
                ...(isMirrored ? { right: x * TILE_SIZE } : { left: x * TILE_SIZE }),
              };
              
              const currentLabelColor = onOffMode ? '#000000' : labelColor;

              return (
                <div
                  key={`wiring-tile-${x}-${y}`}
                  className="absolute flex items-center justify-center overflow-visible"
                  style={tileStyle}
                >
                  {!isDeleted && (
                    <>
                      {showLabels && labels[originalIndex] && (
                        <span 
                          className="absolute top-1 left-2 font-mono text-lg font-bold pointer-events-none"
                          style={{ color: currentLabelColor, opacity: 0.7 }}
                        >
                          {labels[originalIndex]}
                        </span>
                      )}
                      <div
                        className="flex flex-col items-center justify-center h-full w-full text-foreground relative"
                      >
                        {showDataLabels && dataLabel && (
                          <div className="bg-data-wiring text-data-wiring-foreground rounded-full size-10 flex items-center justify-center text-sm font-bold mb-1 z-10">
                              <span>{dataLabel}</span>
                          </div>
                        )}
                        {showDataLabels && backupLabel && (
                          <div className="bg-destructive text-destructive-foreground rounded-full size-10 flex items-center justify-center text-sm font-bold mb-1 z-10">
                              <span>{backupLabel}</span>
                          </div>
                        )}
                        {showPowerLabels && powerLabel && !dataLabel && !backupLabel && (
                           <span className="text-xs text-primary z-10">{powerLabel}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
             <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
                style={{
                  width: dimensions.screenWidth * TILE_SIZE,
                  height: dimensions.screenHeight * TILE_SIZE,
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    viewBox={`0 0 ${arrowheadLength} ${arrowheadSize}`}
                    refX={arrowheadLength}
                    refY={arrowheadSize / 2}
                    markerWidth={arrowheadSize}
                    markerHeight={arrowheadSize}
                    orient="auto-start-reverse"
                  >
                    <path d={`M 0 0 L ${arrowheadLength} ${arrowheadSize / 2} L 0 ${arrowheadSize} z`} fill="hsl(var(--data-wiring))" />
                  </marker>
                </defs>
                {showDataLabels && wiringData.map(({ x, y, nextTile, isDeleted }) => {
                  if (isDeleted || !nextTile) {
                    return null;
                  }

                  const TILE_RADIUS = TILE_SIZE / 2;

                  const startX_center = (isMirrored ? (dimensions.screenWidth - 1 - x) : x) * TILE_SIZE + TILE_RADIUS;
                  const startY_center = y * TILE_SIZE + TILE_RADIUS;

                  const endX_center = (isMirrored ? (dimensions.screenWidth - 1 - nextTile.x) : nextTile.x) * TILE_SIZE + TILE_RADIUS;
                  const endY_center = nextTile.y * TILE_SIZE + TILE_RADIUS;
                  
                  const dx = endX_center - startX_center;
                  const dy = endY_center - startY_center;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  if (distance <= arrowGap * 2) {
                    return null; // Don't draw if tiles are too close for the gap
                  }

                  const startOffsetX = (dx / distance) * arrowGap;
                  const startOffsetY = (dy / distance) * arrowGap;

                  const x1 = startX_center + startOffsetX;
                  const y1 = startY_center + startOffsetY;

                  const x2 = endX_center - startOffsetX;
                  const y2 = endY_center - startOffsetY;

                  return (
                    <line
                      key={`line-${x}-${y}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="hsl(var(--data-wiring))"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
