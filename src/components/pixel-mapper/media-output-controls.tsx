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
  const { handleDownloadRasterMap, dimensions } = usePixelMapper();
  const totalWidth = dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = dimensions.screenHeight * dimensions.tileHeight;

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
        <Button onClick={() => handleDownloadRasterMap(`raster-map-content.png`)} className="w-full">
            <FileOutput className="mr-2 size-4" />
            Fit to Content ({totalWidth}x{totalHeight})
        </Button>
        <Button onClick={() => handleDownloadRasterMap('raster-map-hd.png', 1920, 1080)} variant="outline" className="w-full">
            HD (1920x1080)
        </Button>
        <Button onClick={() => handleDownloadRasterMap('raster-map-4k-uhd.png', 3840, 2160)} variant="outline" className="w-full">
            4K UHD (3840x2160)
        </Button>
        <Button onClick={() => handleDownloadRasterMap('raster-map-4k-dci.png', 4096, 2160)} variant="outline" className="w-full">
            4K DCI (4096x2160)
        </Button>
      </CardContent>
    </Card>
  );
}
