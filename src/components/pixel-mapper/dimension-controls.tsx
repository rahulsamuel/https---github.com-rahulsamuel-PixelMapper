
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export function DimensionControls() {
  const { dimensions, setDimensions, topHalfTile, handleTopHalfTileChange, bottomHalfTile, handleBottomHalfTileChange } = usePixelMap();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDimensions(prevDimensions => ({
      ...prevDimensions,
      // Coerce value to number, ensure it's at least 1
      [e.target.name]: Math.max(1, Number(e.target.value) || 1),
    }));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tileWidth">Tile Width (px)</Label>
                <Input 
                    id="tileWidth"
                    name="tileWidth"
                    type="number" 
                    value={dimensions.tileWidth}
                    onChange={handleChange}
                    min="1"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="tileHeight">Tile Height (px)</Label>
                <Input
                    id="tileHeight"
                    name="tileHeight"
                    type="number"
                    value={dimensions.tileHeight}
                    onChange={handleChange}
                    min="1"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="screenWidth">Screen Width (tiles)</Label>
                <Input
                    id="screenWidth"
                    name="screenWidth"
                    type="number"
                    value={dimensions.screenWidth}
                    onChange={handleChange}
                    min="1"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="screenHeight">Screen Height (full tiles)</Label>
                <Input
                    id="screenHeight"
                    name="screenHeight"
                    type="number"
                    value={dimensions.screenHeight}
                    onChange={handleChange}
                    min="1"
                />
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="top-half-tile">Add Top Half Tile</Label>
                <Switch
                    id="top-half-tile"
                    checked={topHalfTile}
                    onCheckedChange={handleTopHalfTileChange}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="bottom-half-tile">Add Bottom Half Tile</Label>
                <Switch
                    id="bottom-half-tile"
                    checked={bottomHalfTile}
                    onCheckedChange={handleBottomHalfTileChange}
                    disabled={dimensions.screenHeight < 1 && !topHalfTile}
                />
            </div>
        </div>
    </div>
  );
}
