"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PowerControls() {
  const {
    tilesPerPowerString,
    setTilesPerPowerString,
    powerWiringPattern,
    setPowerWiringPattern,
  } = usePixelMapper();

  return (
    <div className="space-y-4">
       <div className="space-y-2">
        <Label htmlFor="power-wiring-pattern">Pattern</Label>
        <Select value={powerWiringPattern} onValueChange={(v) => setPowerWiringPattern(v as any)}>
          <SelectTrigger id="power-wiring-pattern">
            <SelectValue placeholder="Select pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="serpentine-horizontal">Serpentine (Horizontal)</SelectItem>
            <SelectItem value="serpentine-horizontal-reverse">Serpentine (Bottom Up)</SelectItem>
            <SelectItem value="serpentine-vertical">Serpentine (Vertical)</SelectItem>
            <SelectItem value="left-right">Left to Right</SelectItem>
            <SelectItem value="top-bottom">Top to Bottom</SelectItem>
            <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
