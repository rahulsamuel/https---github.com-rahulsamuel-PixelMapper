
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
  const { dimensions, tiles, tileColor, tileColorTwo, onOffMode, wiringTilesPerPort, setWiringTilesPerPort } = usePixelMapper();
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
  
  const TILE_SIZE = 60; // Increased size to better see arrows
  const FONT_SIZE = 10;
  
  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center">
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
                <Switch id="mirror-switch" checked={isMirrored} onCheckedChange={setIsMirrored} />
                <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
            </div>
            <Button onClick={handleDownload}><Download className="mr-2 size-4" /> Download</Button>
        </div>
      </div>
      <div className="p-4 bg-muted/20 overflow-auto">
        <div 
          ref={wiringDiagramRef}
          className="relative transition-transform duration-300"
          style={{ 
            width: dimensions.screenWidth * TILE_SIZE, 
            height: dimensions.screenHeight * TILE_SIZE,
            transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
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

            return (
              <div
                key={`wiring-tile-${x}-${y}`}
                className="absolute border border-border flex items-center justify-center"
                style={{
                  left: x * TILE_SIZE,
                  top: y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  backgroundColor: bgColor,
                  borderWidth: isDeleted ? '0px' : '1px',
                }}
              >
                {!isDeleted && (
                  <>
                    <div
                      className="flex flex-col items-center justify-center h-full w-full text-foreground relative z-10"
                      style={{ fontSize: FONT_SIZE, transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                    >
                      <span className="font-bold text-accent">{dataLabel}</span>
                      <span className="text-xs text-primary">{powerLabel}</span>
                    </div>
                     {arrowTo && (
                        <div className="absolute inset-0 flex items-center justify-center text-accent-foreground/50 opacity-60">
                            {arrowTo === 'up' && <MoveUp size={24} />}
                            {arrowTo === 'down' && <MoveDown size={24} />}
                            {arrowTo === 'left' && <MoveLeft size={24} />}
                            {arrowTo === 'right' && <MoveRight size={24} />}
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
