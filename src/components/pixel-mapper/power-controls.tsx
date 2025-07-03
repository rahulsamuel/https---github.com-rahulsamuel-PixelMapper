"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function PowerControls() {
  const {
    tilesPerPowerString,
    setTilesPerPowerString,
  } = usePixelMapper();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tiles-per-power-string">Tiles per Power String</Label>
        <Input
            id="tiles-per-power-string"
            type="number"
            value={tilesPerPowerString}
            onChange={(e) => setTilesPerPowerString(e.target.value)}
            placeholder="e.g., 20"
            min="1"
        />
      </div>
    </div>
  );
}
