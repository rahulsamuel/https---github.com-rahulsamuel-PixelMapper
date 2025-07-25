
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileOutput, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function MediaOutputControls() {
  const { 
    generateRasterMap, 
    dimensions, 
    activeBounds,
    rasterMapConfig, 
    rasterOffset, 
    setRasterOffset,
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
  } = usePixelMap();

  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  
  const totalWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : dimensions.screenWidth * dimensions.tileWidth;
  const totalHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : dimensions.screenHeight * dimensions.tileHeight;
  const { tileWidth, tileHeight } = dimensions;


  return (
    <div className="space-y-4">
      <div>
        <Label className="font-semibold">Raster Map Generation</Label>
        <p className="text-sm text-muted-foreground pb-2">Create raster maps for media servers from presets.</p>
        <div className="space-y-2">
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
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Or create a custom sized raster map.</p>
        <div className="flex items-center gap-2">
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="custom-width">Custom Width</Label>
                  <Input 
                      id="custom-width" 
                      type="number" 
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="e.g. 1920"
                      min="1"
                  />
              </div>
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="custom-height">Custom Height</Label>
                  <Input 
                      id="custom-height" 
                      type="number" 
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="e.g. 1080"
                      min="1"
                  />
              </div>
          </div>
          <Button 
            onClick={() => generateRasterMap('raster-map-custom.png', parseInt(customWidth), parseInt(customHeight))} 
            variant="outline" 
            className="w-full"
            disabled={!customWidth || !customHeight || tileWidth > parseInt(customWidth) || tileHeight > parseInt(customHeight)}
          >
              Generate Custom Map
          </Button>
      </div>
       <div className="space-y-2">
          <Label className="font-semibold">Raster Offset</Label>
          <p className="text-sm text-muted-foreground pb-2">Position the content within the raster map output.</p>
          <div className="flex items-center gap-2">
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-x">Offset X</Label>
                  <Input 
                      id="offset-x" 
                      type="number" 
                      value={rasterOffset.x} 
                      onChange={(e) => setRasterOffset(prev => ({ ...prev, x: Number(e.target.value) || 0 }))} 
                  />
              </div>
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-y">Offset Y</Label>
                  <Input 
                      id="offset-y" 
                      type="number" 
                      value={rasterOffset.y} 
                      onChange={(e) => setRasterOffset(prev => ({ ...prev, y: Number(e.target.value) || 0 }))} 
                  />
              </div>
          </div>
          <div className="pt-2">
            <Button 
                onClick={calculateAndApplyOptimalOffset} 
                variant="outline" 
                className="w-full"
                disabled={!rasterMapConfig}
            >
                <RotateCcw className="mr-2 size-4" />
                Reset the Offset
            </Button>
          </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
          <Label htmlFor="show-slice-offsets-raster">Show Content Offsets</Label>
          <Switch id="show-slice-offsets-raster" checked={showSliceOffsetLabels} onCheckedChange={setShowSliceOffsetLabels} />
      </div>
    </div>
  );
}
