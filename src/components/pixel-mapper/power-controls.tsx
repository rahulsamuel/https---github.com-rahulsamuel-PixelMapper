"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
    showPowerLabels,
    setShowPowerLabels,
    powerArrowheadSize,
    setPowerArrowheadSize,
    powerArrowheadLength,
    setPowerArrowheadLength,
    powerArrowGap,
    setPowerArrowGap,
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
      <div className="flex items-center justify-between">
        <Label htmlFor="show-power-labels">Show Power Path</Label>
        <Switch id="show-power-labels" checked={showPowerLabels} onCheckedChange={setShowPowerLabels} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="power-arrowhead-size">Arrowhead Size: {powerArrowheadSize}</Label>
        <Slider id="power-arrowhead-size" min={2} max={20} step={1} value={[powerArrowheadSize]} onValueChange={(v) => setPowerArrowheadSize(v[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="power-arrowhead-length">Arrowhead Length: {powerArrowheadLength}</Label>
        <Slider id="power-arrowhead-length" min={5} max={30} step={1} value={[powerArrowheadLength]} onValueChange={(v) => setPowerArrowheadLength(v[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="power-arrow-gap">Arrow Gap: {powerArrowGap}</Label>
        <Slider id="power-arrow-gap" min={0} max={50} step={1} value={[powerArrowGap]} onValueChange={(v) => setPowerArrowGap(v[0])} />
      </div>
    </div>
  );
}
