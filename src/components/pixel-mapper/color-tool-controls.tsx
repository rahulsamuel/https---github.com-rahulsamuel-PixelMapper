
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ColorToolControls() {
  const { brushColor, setBrushColor } = usePixelMap();

  return (
    <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
      <Label htmlFor="brush-color" className="font-semibold">Brush Color</Label>
      <div className="flex items-center gap-2">
        <Input
          id="brush-color"
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-14 p-1"
        />
        <Input
            type="text"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            placeholder="#e11d48"
            className="font-mono"
        />
      </div>
    </div>
  );
}
