
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function AppearanceControls() {
  const { tileColor, setTileColor, tileColorTwo, setTileColorTwo, borderWidth, setBorderWidth, borderColor, setBorderColor } = usePixelMap();

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tile-color">Tile Color 1</Label>
          <div className="flex items-center gap-2">
            <Input
              id="tile-color"
              type="color"
              value={tileColor}
              onChange={(e) => setTileColor(e.target.value)}
              className="w-14 p-1"
            />
            <Input
                type="text"
                value={tileColor}
                onChange={(e) => setTileColor(e.target.value)}
                placeholder="#273a5e"
                className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tile-color-2">Tile Color 2</Label>
          <div className="flex items-center gap-2">
            <Input
              id="tile-color-2"
              type="color"
              value={tileColorTwo}
              onChange={(e) => setTileColorTwo(e.target.value)}
              className="w-14 p-1"
            />
            <Input
                type="text"
                value={tileColorTwo}
                onChange={(e) => setTileColorTwo(e.target.value)}
                placeholder="#d1d9e6"
                className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="border-color">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="border-color"
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="w-14 p-1"
            />
            <Input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                placeholder="#ffffff"
                className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="border-width">Border Width: {borderWidth}px</Label>
          <Slider
            id="border-width"
            min={0}
            max={5}
            step={1}
            value={[borderWidth]}
            onValueChange={(value) => setBorderWidth(value[0])}
          />
        </div>
      </div>
  );
}
