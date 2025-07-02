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
  const { handleDownloadRasterMap } = usePixelMapper();

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
      <CardContent>
        <Button onClick={() => handleDownloadRasterMap('raster-map.png')} className="w-full">
            <FileOutput className="mr-2 size-4" />
            Download Raster Map
        </Button>
      </CardContent>
    </Card>
  );
}
