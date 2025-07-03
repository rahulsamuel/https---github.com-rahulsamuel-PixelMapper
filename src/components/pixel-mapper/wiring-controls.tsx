
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

export function WiringControls() {
  const {
    wiringPattern,
    setWiringPattern,
    wiringPortConfig,
    setWiringPortConfig,
    showDataLabels,
    setShowDataLabels,
    arrowheadSize,
    setArrowheadSize,
    arrowheadLength,
    setArrowheadLength,
    arrowGap,
    setArrowGap,
    dataLabelSize,
    setDataLabelSize,
  } = usePixelMapper();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wiring-pattern">Pattern</Label>
        <Select value={wiringPattern} onValueChange={(v) => setWiringPattern(v as any)}>
          <SelectTrigger id="wiring-pattern">
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
        <Label htmlFor="tiles-per-group">Tiles per Data Port</Label>
        <Input
            id="tiles-per-group"
            type="number"
            value={wiringPortConfig}
            onChange={(e) => setWiringPortConfig(e.target.value)}
            placeholder="e.g., 4"
            min="1"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-data-labels">Show Data Path</Label>
        <Switch id="show-data-labels" checked={showDataLabels} onCheckedChange={setShowDataLabels} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="data-label-size">Label Size: {dataLabelSize}px</Label>
        <Slider id="data-label-size" min={10} max={100} step={1} value={[dataLabelSize]} onValueChange={(v) => setDataLabelSize(v[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arrowhead-size">Arrowhead Size: {arrowheadSize}</Label>
        <Slider id="arrowhead-size" min={2} max={40} step={1} value={[arrowheadSize]} onValueChange={(v) => setArrowheadSize(v[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arrowhead-length">Arrowhead Length: {arrowheadLength}</Label>
        <Slider id="arrowhead-length" min={5} max={60} step={1} value={[arrowheadLength]} onValueChange={(v) => setArrowheadLength(v[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arrow-gap">Arrow Gap: {arrowGap}</Label>
        <Slider id="arrow-gap" min={0} max={100} step={1} value={[arrowGap]} onValueChange={(v) => setArrowGap(v[0])} />
      </div>
    </div>
  );
}
