
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { getWiringData } from "@/lib/wiring";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toPng } from "html-to-image";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WiringDiagram() {
  const { 
    dimensions, 
    tiles, 
    tileColor, 
    tileColorTwo, 
    onOffMode, 
    wiringPortConfig, 
    setWiringPortConfig, 
    zoom,
    showDataLabels,
    setShowDataLabels,
    showPowerLabels,
    setShowPowerLabels,
    labels,
    showLabels,
    labelColor,
    wiringPattern,
    setWiringPattern,
  } = usePixelMapper();
  const [isMirrored, setIsMirrored] = useState(false);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);

  const wiringData = getWiringData(dimensions, tiles, wiringPortConfig, wiringPattern);

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
    <>
      <div className="sticky top-0 z-10 bg-background p-4 border-b flex justify-between items-center flex-wrap gap-y-2">
        <h2 className="text-lg font-semibold">Wiring Diagram</h2>
        <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <Label htmlFor="wiring-pattern" className="whitespace-nowrap">Pattern</Label>
                <Select value={wiringPattern} onValueChange={(v) => setWiringPattern(v as any)}>
                    <SelectTrigger id="wiring-pattern" className="w-48 h-8">
                        <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="serpentine-horizontal">Serpentine (Horizontal)</SelectItem>
                        <SelectItem value="serpentine-vertical">Serpentine (Vertical)</SelectItem>
                        <SelectItem value="left-right">Left to Right</SelectItem>
                        <SelectItem value="top-bottom">Top to Bottom</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="tiles-per-group" className="whitespace-nowrap">Tiles per Group</Label>
                <Input
                    id="tiles-per-group"
                    type="number"
                    value={wiringPortConfig}
                    onChange={(e) => setWiringPortConfig(e.target.value)}
                    className="w-20 h-8"
                    placeholder="e.g., 4"
                    min="1"
                />
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="show-data-labels" checked={showDataLabels} onCheckedChange={setShowDataLabels} />
                <Label htmlFor="show-data-labels">Data</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="show-power-labels" checked={showPowerLabels} onCheckedChange={setShowPowerLabels} />
                <Label htmlFor="show-power-labels">Power</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="mirror-switch" checked={isMirrored} onCheckedChange={setIsMirrored} />
                <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
            </div>
            <Button onClick={handleDownload}><Download className="mr-2 size-4" /> Download</Button>
        </div>
      </div>
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
            let bgColor;
            if (onOffMode) {
              bgColor = isDeleted ? '#000000' : '#FFFFFF';
            } else {
              if (isDeleted) {
                bgColor = '#000000';
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
            
            const originalIndex = y * dimensions.screenWidth + x;

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
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--data-wiring))" />
                </marker>
              </defs>
              {showDataLabels && wiringData.map(({ x, y, nextTile, isDeleted }) => {
                if (isDeleted || !nextTile) {
                  return null;
                }

                const TILE_RADIUS = TILE_SIZE / 2;

                const startX = (isMirrored ? (dimensions.screenWidth - 1 - x) : x) * TILE_SIZE + TILE_RADIUS;
                const startY = y * TILE_SIZE + TILE_RADIUS;

                const endX = (isMirrored ? (dimensions.screenWidth - 1 - nextTile.x) : nextTile.x) * TILE_SIZE + TILE_RADIUS;
                const endY = nextTile.y * TILE_SIZE + TILE_RADIUS;

                return (
                  <line
                    key={`line-${x}-${y}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="hsl(var(--data-wiring))"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
        </div>
      </div>
    </>
  );
}
