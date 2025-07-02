"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileOutput } from "lucide-react";

export function MediaOutputControls() {
  const { generateRasterMap, dimensions, activeBounds } = usePixelMapper();
  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : dimensions.screenHeight * dimensions.tileHeight;
  const { tileWidth, tileHeight } = dimensions;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileOutput className="size-5" />
          <CardTitle>Media Output</CardTitle>
        </div>
        <CardDescription>
          Generate raster maps for media servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={() => generateRasterMap(`raster-map-content.png`)} className="w-full">
            <FileOutput className="mr-2 size-4" />
            Fit to Content ({totalWidth}x{totalHeight})
        </Button>
        <Button onClick={() => generateRasterMap('raster-map-hd.png', 1920, 1080)} variant="outline" className="w-full" disabled={tileWidth > 1920 || tileHeight > 1080}>
            HD (1920x1080)
        </Button>
        <Button onClick={() => generateRasterMap('raster-map-4k-uhd.png', 3840, 2160)} variant="outline" className="w-full" disabled={tileWidth > 3840 || tileHeight > 2160}>
            4K UHD (3840x2160)
        </Button>
        <Button onClick={() => generateRasterMap('raster-map-4k-dci.png', 4096, 2160)} variant="outline" className="w-full" disabled={tileWidth > 4096 || tileHeight > 2160}>
            4K DCI (4096x2160)
        </Button>
      </CardContent>
    </Card>
  );
}
