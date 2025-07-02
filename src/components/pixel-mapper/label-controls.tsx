"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CaseSensitive, Type, Palettes } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  } = usePixelMapper();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Type className="size-5" />
          <CardTitle>Labeling</CardTitle>
        </div>
        <CardDescription>
          Customize the labels on the LED tiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels">Show Labels</Label>
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
              <SelectItem value="dmx-style">DMX-Style (A1, A2, ...)</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </CardContent>
    </Card>
  );
}
