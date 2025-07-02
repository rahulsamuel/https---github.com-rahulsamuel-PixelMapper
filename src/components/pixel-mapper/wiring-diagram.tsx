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
  const { dimensions, tiles } = usePixelMapper();
  const [isMirrored, setIsMirrored] = useState(false);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);

  const wiringData = getWiringData(dimensions, tiles);

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
  
  const TILE_SIZE = 40;
  const FONT_SIZE = 10;
  
  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Wiring Diagram</h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch id="mirror-switch" checked={isMirrored} onCheckedChange={setIsMirrored} />
                <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
            </div>
            <Button onClick={handleDownload}><Download className="mr-2 size-4" /> Download</Button>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-auto bg-muted/20">
        <div 
          ref={wiringDiagramRef}
          className="relative transition-transform duration-300"
          style={{ 
            width: dimensions.screenWidth * TILE_SIZE, 
            height: dimensions.screenHeight * TILE_SIZE,
            transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          {wiringData.map(({ x, y, dataLabel, powerLabel, isDeleted }) => (
            <div
              key={dataLabel}
              className="absolute border border-border bg-background"
              style={{
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                opacity: isDeleted ? 0.2 : 1,
              }}
            >
              <div
                className="flex flex-col items-center justify-center h-full w-full text-foreground"
                style={{ fontSize: FONT_SIZE, transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
              >
                <span className="font-bold text-accent">{dataLabel}</span>
                <span className="text-xs text-primary">{powerLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
