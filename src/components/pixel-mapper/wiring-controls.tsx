

"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
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
import { Cpu } from "lucide-react";

export function WiringControls() {
  const {
    wiringPattern,
    setWiringPattern,
    wiringPortConfig,
    setWiringPortConfig,
    dataPortStartNumber,
    setDataPortStartNumber,
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
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    processorType,
    setProcessorType
  } = usePixelMap();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="processor-type" className="flex items-center gap-2"><Cpu className="size-4" /> Processor Type</Label>
        <Select value={processorType} onValueChange={(v) => setProcessorType(v as any)}>
          <SelectTrigger id="processor-type">
            <SelectValue placeholder="Select processor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Brompton">Brompton Processor</SelectItem>
            <SelectItem value="Novastar">Novastar Processor</SelectItem>
            <SelectItem value="Helios">Helios Processor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wiring-pattern">Pattern</Label>
        <Select value={wiringPattern} onValueChange={(v) => setWiringPattern(v as any)}>
          <SelectTrigger id="wiring-pattern">
            <SelectValue placeholder="Select pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="serpentine-horizontal">Serpentine (Horizontal)</SelectItem>
            <SelectItem value="serpentine-horizontal-reverse">Serpentine (Horizontal Reverse)</SelectItem>
            <SelectItem value="serpentine-vertical">Serpentine (Vertical)</SelectItem>
            <SelectItem value="serpentine-vertical-reverse">Serpentine (Vertical Reverse)</SelectItem>
            <SelectItem value="serpentine-vertical-bottom-start">Serpentine Vertical (Bottom Start)</SelectItem>
            <SelectItem value="serpentine-vertical-bottom-main">Serpentine Vertical (Bottom Main)</SelectItem>
            <SelectItem value="serpentine-vertical-reverse-bottom-start">Serpentine Vertical (Reverse Bottom Start)</SelectItem>
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
            disabled={wiringPattern === 'manual'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="data-port-start-number">Data Port Start Number</Label>
        <Input
            id="data-port-start-number"
            type="number"
            value={dataPortStartNumber}
            onChange={(e) => setDataPortStartNumber(Number(e.target.value) || 1)}
            min="1"
            disabled={wiringPattern === 'manual'}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-data-labels">Show Data Path</Label>
        <Switch id="show-data-labels" checked={showDataLabels} onCheckedChange={setShowDataLabels} />
      </div>
       <div className="flex items-center justify-between">
        <Label htmlFor="show-slice-offsets-wiring">Show Content Offsets</Label>
        <Switch id="show-slice-offsets-wiring" checked={showSliceOffsetLabels} onCheckedChange={setShowSliceOffsetLabels} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="data-label-size">Label Size: {dataLabelSize}px</Label>
        <Slider id="data-label-size" min={10} max={200} step={1} value={[dataLabelSize]} onValueChange={(v) => setDataLabelSize(v[0])} />
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
