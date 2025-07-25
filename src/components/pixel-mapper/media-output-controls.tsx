
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileOutput, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";

export function MediaOutputControls() {
  const { 
    generateRasterMap,
    screens,
    rasterMapConfig, 
    rasterOffset, 
    setRasterOffset,
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    currentScreen,
  } = usePixelMap();

  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  
  const { totalWidth, totalHeight, canFitContent } = useMemo(() => {
    let totalW = 0;
    let totalH = 0;
    let canFit = true;

    if (rasterMapConfig?.screenArrangement) {
        totalW = rasterMapConfig.contentWidth;
        totalH = rasterMapConfig.contentHeight;
    }

    if (parseInt(customWidth) < totalW || parseInt(customHeight) < totalH) {
      canFit = false;
    }
    
    return { totalWidth: totalW, totalHeight: totalH, canFitContent: canFit };
  }, [rasterMapConfig, customWidth, customHeight]);

  const anyTileTooBig = (width: number, height: number) => {
    return screens.some(s => s.dimensions.tileWidth > width || s.dimensions.tileHeight > height);
  }
  
  // Local state for input fields to avoid lag
  const [localOffsetX, setLocalOffsetX] = useState(rasterOffset.x);
  const [localOffsetY, setLocalOffsetY] = useState(rasterOffset.y);

  // Update local state when the current screen (and its offset) changes
  useEffect(() => {
    setLocalOffsetX(currentScreen.rasterOffset.x);
    setLocalOffsetY(currentScreen.rasterOffset.y);
  }, [currentScreen.rasterOffset]);

  const handleOffsetBlur = () => {
      setRasterOffset({x: localOffsetX, y: localOffsetY});
  };


  return (
    <div className="space-y-4">
      <div>
        <Label className="font-semibold">Raster Map Generation</Label>
        <p className="text-sm text-muted-foreground pb-2">Create raster maps for media servers from presets.</p>
        <div className="space-y-2">
          <Button onClick={() => generateRasterMap(`raster-map-content.png`)} className="w-full">
              <FileOutput className="mr-2 size-4" />
              Fit to All Screens ({totalWidth}x{totalHeight})
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-hd.png', 1920, 1080)} variant="outline" className="w-full" disabled={anyTileTooBig(1920, 1080)}>
              HD (1920x1080)
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-4k-uhd.png', 3840, 2160)} variant="outline" className="w-full" disabled={anyTileTooBig(3840, 2160)}>
              4K UHD (3840x2160)
          </Button>
          <Button onClick={() => generateRasterMap('raster-map-4k-dci.png', 4096, 2160)} variant="outline" className="w-full" disabled={anyTileTooBig(4096, 2160)}>
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
            disabled={!customWidth || !customHeight || anyTileTooBig(parseInt(customWidth), parseInt(customHeight))}
          >
              Generate Custom Map
          </Button>
      </div>
       <div className="space-y-2">
          <Label className="font-semibold">Screen Offset (&quot;{currentScreen.name}&quot;)</Label>
          <p className="text-sm text-muted-foreground pb-2">Position the current screen within the raster map.</p>
          <div className="flex items-center gap-2">
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-x">Offset X</Label>
                  <Input 
                      id="offset-x" 
                      type="number" 
                      value={localOffsetX} 
                      onChange={(e) => setLocalOffsetX(Number(e.target.value) || 0)} 
                      onBlur={handleOffsetBlur}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  />
              </div>
              <div className="grid w-full gap-1.5">
                  <Label htmlFor="offset-y">Offset Y</Label>
                  <Input 
                      id="offset-y" 
                      type="number" 
                      value={localOffsetY} 
                      onChange={(e) => setLocalOffsetY(Number(e.target.value) || 0)}
                      onBlur={handleOffsetBlur}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
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
                Reset Screen Offset
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
