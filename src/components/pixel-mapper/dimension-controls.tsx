"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DimensionControls() {
  const { dimensions, setDimensions } = usePixelMapper();

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
                <Label htmlFor="screenHeight">Screen Height (tiles)</Label>
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
    </div>
  );
}
