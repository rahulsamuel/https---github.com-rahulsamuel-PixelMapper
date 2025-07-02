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
import { Paintbrush } from "lucide-react";

export function AppearanceControls() {
  const { tileColor, setTileColor, tileColorTwo, setTileColorTwo, borderWidth, setBorderWidth } = usePixelMapper();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Paintbrush className="size-5" />
          <CardTitle>Appearance</CardTitle>
        </div>
        <CardDescription>Customize the look of the LED tiles.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                placeholder="#ffffff"
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
                placeholder="#4a4a4a"
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
      </CardContent>
    </Card>
  );
}
