
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileOutput, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

type PresetKey = 'content' | 'hd' | '4k-uhd' | '4k-dci' | 'custom';

const LABEL_POSITIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export function MediaOutputControls() {
  const {
    generateRasterMap,
    screens,
    rasterMapConfig,
    setRasterOffset,
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    currentScreen,
    updateScreenById,
    rasterBgColor,
    setRasterBgColor,
  } = usePixelMap();

  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  const [activePreset, setActivePreset] = useState<PresetKey>('content');

  const { totalWidth, totalHeight } = useMemo(() => {
    if (rasterMapConfig?.screenArrangement) {
      return { totalWidth: rasterMapConfig.contentWidth, totalHeight: rasterMapConfig.contentHeight };
    }
    return { totalWidth: 0, totalHeight: 0 };
  }, [rasterMapConfig]);

  const anyTileTooBig = (width: number, height: number) =>
    screens.some(s => s.dimensions.tileWidth > width || s.dimensions.tileHeight > height);

  const handlePreset = (preset: PresetKey, filename: string, w?: number, h?: number) => {
    setActivePreset(preset);
    generateRasterMap(filename, w, h);
  };

  const handleCustomGenerate = () => {
    setActivePreset('custom');
    generateRasterMap('raster-map-custom.png', parseInt(customWidth), parseInt(customHeight));
  };

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div>
        <Label className="font-semibold">Raster Map Generation</Label>
        <p className="text-sm text-muted-foreground pb-2">Create raster maps for media servers from presets.</p>
        <div className="space-y-2">
          <Button
            onClick={() => handlePreset('content', 'raster-map-content.png')}
            variant={activePreset === 'content' ? 'default' : 'outline'}
            className="w-full"
          >
            <FileOutput className="mr-2 size-4" />
            Fit to All Screens ({totalWidth}x{totalHeight})
          </Button>
          <Button
            onClick={() => handlePreset('hd', 'raster-map-hd.png', 1920, 1080)}
            variant={activePreset === 'hd' ? 'default' : 'outline'}
            className="w-full"
            disabled={anyTileTooBig(1920, 1080)}
          >
            HD (1920x1080)
          </Button>
          <Button
            onClick={() => handlePreset('4k-uhd', 'raster-map-4k-uhd.png', 3840, 2160)}
            variant={activePreset === '4k-uhd' ? 'default' : 'outline'}
            className="w-full"
            disabled={anyTileTooBig(3840, 2160)}
          >
            4K UHD (3840x2160)
          </Button>
          <Button
            onClick={() => handlePreset('4k-dci', 'raster-map-4k-dci.png', 4096, 2160)}
            variant={activePreset === '4k-dci' ? 'default' : 'outline'}
            className="w-full"
            disabled={anyTileTooBig(4096, 2160)}
          >
            4K DCI (4096x2160)
          </Button>
        </div>
      </div>

      <Separator />

      {/* Custom size */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Or create a custom sized raster map.</p>
        <div className="flex items-center gap-2">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="custom-width">Custom Width</Label>
            <Input
              id="custom-width"
              type="number"
              value={customWidth}
              onChange={e => setCustomWidth(e.target.value)}
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
              onChange={e => setCustomHeight(e.target.value)}
              placeholder="e.g. 1080"
              min="1"
            />
          </div>
        </div>
        <Button
          onClick={handleCustomGenerate}
          variant={activePreset === 'custom' ? 'default' : 'outline'}
          className="w-full"
          disabled={!customWidth || !customHeight || anyTileTooBig(parseInt(customWidth), parseInt(customHeight))}
        >
          Generate Custom Map
        </Button>
      </div>

      <Separator />

      {/* Background color */}
      <div className="flex items-center justify-between">
        <Label htmlFor="raster-bg-color">Background Color</Label>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: rasterBgColor }} />
          <Input
            id="raster-bg-color"
            type="color"
            value={rasterBgColor}
            onChange={e => setRasterBgColor(e.target.value)}
            className="w-10 h-8 p-0.5 cursor-pointer border-border rounded"
          />
        </div>
      </div>

      <Separator />

      {/* Show content offsets (global) */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-slice-offsets-raster">Show Content Offsets</Label>
        <Switch id="show-slice-offsets-raster" checked={showSliceOffsetLabels} onCheckedChange={setShowSliceOffsetLabels} />
      </div>

      <Separator />

      {/* Per-screen controls */}
      <div>
        <Label className="font-semibold">Screen Settings</Label>
        <p className="text-sm text-muted-foreground pb-2">Configure each screen's position, name, and offset.</p>
        <div className="space-y-4">
          {screens.map(screen => (
            <ScreenRasterControls
              key={screen.id}
              screen={screen}
              updateScreenById={updateScreenById}
              isCurrentScreen={screen.id === currentScreen.id}
              rasterMapConfig={rasterMapConfig}
              calculateAndApplyOptimalOffset={screen.id === currentScreen.id ? calculateAndApplyOptimalOffset : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenRasterControls({
  screen,
  updateScreenById,
  isCurrentScreen,
  rasterMapConfig,
  calculateAndApplyOptimalOffset,
}: {
  screen: import('@/contexts/pixel-map-context').Screen;
  updateScreenById: (id: string, updater: (s: import('@/contexts/pixel-map-context').Screen) => import('@/contexts/pixel-map-context').Screen) => void;
  isCurrentScreen: boolean;
  rasterMapConfig: import('@/contexts/pixel-map-context').RasterMapConfig | null;
  calculateAndApplyOptimalOffset?: () => void;
}) {
  const [localOffsetX, setLocalOffsetX] = useState(screen.rasterOffset.x);
  const [localOffsetY, setLocalOffsetY] = useState(screen.rasterOffset.y);

  useEffect(() => {
    setLocalOffsetX(screen.rasterOffset.x);
    setLocalOffsetY(screen.rasterOffset.y);
  }, [screen.rasterOffset]);

  const commitOffset = () => {
    updateScreenById(screen.id, s => ({ ...s, rasterOffset: { x: localOffsetX, y: localOffsetY } }));
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-3",
      isCurrentScreen ? "border-primary/40 bg-primary/5" : "border-border/60"
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate">{screen.name}</span>
        {isCurrentScreen && <span className="text-xs text-primary font-medium shrink-0">Active</span>}
      </div>

      {/* Offset */}
      <div className="flex items-center gap-2">
        <div className="grid w-full gap-1">
          <Label className="text-xs">Offset X</Label>
          <Input
            type="number"
            value={localOffsetX}
            onChange={e => setLocalOffsetX(Number(e.target.value) || 0)}
            onBlur={commitOffset}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-8 text-xs"
          />
        </div>
        <div className="grid w-full gap-1">
          <Label className="text-xs">Offset Y</Label>
          <Input
            type="number"
            value={localOffsetY}
            onChange={e => setLocalOffsetY(Number(e.target.value) || 0)}
            onBlur={commitOffset}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-8 text-xs"
          />
        </div>
      </div>
      {isCurrentScreen && calculateAndApplyOptimalOffset && (
        <Button
          onClick={calculateAndApplyOptimalOffset}
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          disabled={!rasterMapConfig}
        >
          <RotateCcw className="mr-1.5 h-3 w-3" />
          Reset Offset
        </Button>
      )}

      {/* Show screen name overlay */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Screen Name</Label>
        <Switch
          checked={screen.showScreenName}
          onCheckedChange={val => updateScreenById(screen.id, s => ({ ...s, showScreenName: val }))}
          className="scale-90"
        />
      </div>

      {screen.showScreenName && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Name Position</Label>
            <Select
              value={screen.screenNameLabelPosition}
              onValueChange={val =>
                updateScreenById(screen.id, s => ({ ...s, screenNameLabelPosition: val as any }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABEL_POSITIONS.map(p => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Font Size: {screen.screenNameLabelFontSize}px</Label>
            <input
              type="range"
              min={12}
              max={200}
              step={1}
              value={screen.screenNameLabelFontSize}
              onChange={e => updateScreenById(screen.id, s => ({ ...s, screenNameLabelFontSize: Number(e.target.value) }))}
              className="w-full accent-primary h-4"
            />
          </div>
        </>
      )}

      {/* Show slice offset labels per screen */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Tile Offsets</Label>
        <Switch
          checked={screen.showSliceOffsetLabels ?? false}
          onCheckedChange={val => updateScreenById(screen.id, s => ({ ...s, showSliceOffsetLabels: val }))}
          className="scale-90"
        />
      </div>
    </div>
  );
}
