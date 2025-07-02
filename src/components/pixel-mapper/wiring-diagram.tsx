
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { getWiringData } from "@/lib/wiring";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, MoveUp, MoveDown, MoveLeft, MoveRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toPng } from "html-to-image";
import { Input } from "@/components/ui/input";

export function WiringDiagram() {
  const { 
    dimensions, 
    tiles, 
    tileColor, 
    tileColorTwo, 
    onOffMode, 
    wiringTilesPerPort, 
    setWiringTilesPerPort, 
    zoom,
    showDataLabels,
    setShowDataLabels,
    showPowerLabels,
    setShowPowerLabels,
  } = usePixelMapper();
  const [isMirrored, setIsMirrored] = useState(false);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);

  const wiringData = getWiringData(dimensions, tiles, wiringTilesPerPort);

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
  const ARROW_SIZE = 36;
  
  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center flex-wrap gap-y-2">
        <h2 className="text-lg font-semibold">Wiring Diagram</h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="tiles-per-port" className="whitespace-nowrap">Tiles per Port</Label>
                <Input
                    id="tiles-per-port"
                    type="number"
                    value={wiringTilesPerPort}
                    onChange={(e) => setWiringTilesPerPort(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 h-8"
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
      <div className="p-4 bg-muted/20 overflow-auto">
        <div 
          ref={wiringDiagramRef}
          className="relative"
          style={{ 
            width: dimensions.screenWidth * TILE_SIZE, 
            height: dimensions.screenHeight * TILE_SIZE,
            transform: `scale(${zoom}) ${isMirrored ? 'scaleX(-1)' : ''}`,
            transformOrigin: 'top left',
          }}
        >
          {wiringData.map(({ x, y, dataLabel, powerLabel, isDeleted, arrowTo }) => {
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

            const arrowPositionStyle = {
                ...(arrowTo === 'up' && { top: -ARROW_SIZE / 2, left: '50%', transform: 'translateX(-50%)' }),
                ...(arrowTo === 'down' && { bottom: -ARROW_SIZE / 2, left: '50%', transform: 'translateX(-50%)' }),
                ...(arrowTo === 'left' && { left: -ARROW_SIZE / 2, top: '50%', transform: 'translateY(-50%)' }),
                ...(arrowTo === 'right' && { right: -ARROW_SIZE / 2, top: '50%', transform: 'translateY(-50%)' }),
            };

            const tileStyle = {
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: bgColor,
              borderWidth: isDeleted ? '0px' : '1px',
              ...(isMirrored ? { right: x * TILE_SIZE } : { left: x * TILE_SIZE }),
            };

            return (
              <div
                key={`wiring-tile-${x}-${y}`}
                className="absolute border-border flex items-center justify-center overflow-visible"
                style={tileStyle}
              >
                {!isDeleted && (
                  <>
                    <div
                      className="flex flex-col items-center justify-center h-full w-full text-foreground relative"
                      style={{ transform: isMirrored ? 'scaleX(-1)' : '' }}
                    >
                      {showDataLabels && dataLabel && (
                        <div className="bg-accent text-accent-foreground rounded-full size-10 flex items-center justify-center text-sm font-bold mb-1 z-10">
                            <span>{dataLabel}</span>
                        </div>
                      )}
                      {showPowerLabels && (
                         <span className="text-xs text-primary z-10">{powerLabel}</span>
                      )}
                    </div>
                     {showDataLabels && arrowTo && (
                        <div 
                            className="absolute text-accent/80 z-20 flex items-center justify-center"
                            style={arrowPositionStyle}
                        >
                            {arrowTo === 'up' && <MoveUp size={ARROW_SIZE} />}
                            {arrowTo === 'down' && <MoveDown size={ARROW_SIZE} />}
                            {arrowTo === 'left' && <MoveLeft size={ARROW_SIZE} />}
                            {arrowTo === 'right' && <MoveRight size={ARROW_SIZE} />}
                        </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
