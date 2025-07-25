
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
import { Separator } from "@/components/ui/separator";

export function LabelControls() {
  const {
    showLabels,
    setShowLabels,
    labelFormat,
    setLabelFormat,
    labelFontSize,
    setLabelFontSize,
    labelColor,
    setLabelColor,
    labelPosition,
    setLabelPosition,
    labelColorMode,
    setLabelColorMode,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    labelStartNumber,
    setLabelStartNumber,
  } = usePixelMap();

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels">Show Tile Labels</Label>
          <Switch
            id="show-labels"
            checked={showLabels}
            onCheckedChange={setShowLabels}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="label-format">Label Format</Label>
          <Select
            value={labelFormat}
            onValueChange={(value) => setLabelFormat(value as any)}
          >
            <SelectTrigger id="label-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sequential">Sequential (1, 2, ...)</SelectItem>
              <SelectItem value="row-col">Row-Col (1-1, 1-2, ...)</SelectItem>
              <SelectItem value="row-letter-col-number">Row Letter-Col Number (A1, B1, ..)</SelectItem>
              <SelectItem value="dmx-style">DMX-Style (A1, A2, ...)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {labelFormat === 'sequential' && (
          <div className="space-y-2">
            <Label htmlFor="label-start-number">Label Start Number</Label>
            <Input
              id="label-start-number"
              type="number"
              value={labelStartNumber}
              onChange={(e) => setLabelStartNumber(Number(e.target.value) || 1)}
              min="1"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="label-position">Label Position</Label>
          <Select
            value={labelPosition}
            onValueChange={(value) => setLabelPosition(value as any)}
          >
            <SelectTrigger id="label-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="label-color-mode">Label Color Mode</Label>
          <Select
            value={labelColorMode}
            onValueChange={(value) => setLabelColorMode(value as 'single' | 'auto')}
          >
            <SelectTrigger id="label-color-mode">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Color</SelectItem>
              <SelectItem value="auto">Automatic (B&W)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {labelColorMode === 'single' && (
          <div className="space-y-2">
            <Label htmlFor="label-color">Label Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="label-color"
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                className="w-14 p-1"
              />
              <Input
                type="text"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                placeholder="#ffffff"
                className="font-mono"
              />
            </div>
          </div>
        )}


        <div className="space-y-2">
          <Label htmlFor="label-font-size">Font Size: {labelFontSize}px</Label>
          <Slider
            id="label-font-size"
            min={8}
            max={128}
            step={1}
            value={[labelFontSize]}
            onValueChange={(value) => setLabelFontSize(value[0])}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="show-slice-offsets-grid">Show Content Offsets</Label>
          <Switch id="show-slice-offsets-grid" checked={showSliceOffsetLabels} onCheckedChange={setShowSliceOffsetLabels} />
        </div>
      </div>
  );
}
