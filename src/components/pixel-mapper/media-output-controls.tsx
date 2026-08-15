
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import type { Screen, RasterMapConfig, RasterGroup, RasterSegment } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { FileOutput, RotateCcw, Plus, Trash2, Pencil, Check, X } from "lucide-react";
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
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export function MediaOutputControls() {
  const {
    generateRasterMap,
    screens,
    rasterMapConfig,
    rasterMapConfigs,
    rasterGroups,
    activeRasterGroupId,
    setActiveRasterGroupId,
    addRasterGroup,
    renameRasterGroup,
    deleteRasterGroup,
    calculateAndApplyOptimalOffset,
    currentScreen,
    updateScreenById,
    rasterBgColor,
    setRasterBgColor,
  } = usePixelMap();

  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const activeConfig = rasterMapConfigs[activeRasterGroupId] ?? null;

  const { totalWidth, totalHeight } = useMemo(() => {
    if (activeConfig?.screenArrangement) {
      return { totalWidth: activeConfig.contentWidth, totalHeight: activeConfig.contentHeight };
    }
    return { totalWidth: 0, totalHeight: 0 };
  }, [activeConfig]);

  // Derive active preset from persisted lastRasterArgs so it survives tab switches
  const activePreset = useMemo((): PresetKey => {
    const args = currentScreen.lastRasterArgs;
    if (!args?.outputWidth && !args?.outputHeight) return 'content';
    if (args.outputWidth === 1920 && args.outputHeight === 1080) return 'hd';
    if (args.outputWidth === 3840 && args.outputHeight === 2160) return '4k-uhd';
    if (args.outputWidth === 4096 && args.outputHeight === 2160) return '4k-dci';
    return 'custom';
  }, [currentScreen.lastRasterArgs]);

  const anyTileTooBig = (width: number, height: number) =>
    screens.some(s => s.dimensions.tileWidth > width || s.dimensions.tileHeight > height);

  const handlePreset = (filename: string, w?: number, h?: number) => {
    generateRasterMap(filename, w, h);
  };

  const handleCustomGenerate = () => {
    generateRasterMap('raster-map-custom.png', parseInt(customWidth), parseInt(customHeight));
  };

  const startEditGroup = (group: RasterGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const commitEditGroup = () => {
    if (editingGroupId && editingGroupName.trim()) {
      renameRasterGroup(editingGroupId, editingGroupName.trim());
    }
    setEditingGroupId(null);
  };

  const screensInGroup = (groupId: string) =>
    screens.filter(s => (s.rasterGroupId ?? 'raster-1') === groupId);

  return (
    <div className="space-y-4">
      {/* Raster Groups management */}
      <div>
        <div className="flex items-center justify-between pb-1">
          <Label className="font-semibold">Raster Outputs</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => addRasterGroup()}
          >
            <Plus className="h-3 w-3" />
            Add Raster
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pb-2">Group screens into separate raster outputs.</p>
        <div className="space-y-1.5">
          {rasterGroups.map(group => {
            const isActive = group.id === activeRasterGroupId;
            const isEditing = editingGroupId === group.id;
            const count = screensInGroup(group.id).length;
            return (
              <div
                key={group.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors",
                  isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                )}
                onClick={() => !isEditing && setActiveRasterGroupId(group.id)}
              >
                {isEditing ? (
                  <>
                    <Input
                      value={editingGroupName}
                      onChange={e => setEditingGroupName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEditGroup();
                        if (e.key === 'Escape') setEditingGroupId(null);
                        e.stopPropagation();
                      }}
                      className="h-6 text-xs flex-1"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                    <button onClick={e => { e.stopPropagation(); commitEditGroup(); }} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); setEditingGroupId(null); }} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium flex-1 truncate">{group.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{count} screen{count !== 1 ? 's' : ''}</span>
                    <button
                      onClick={e => { e.stopPropagation(); startEditGroup(group); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {rasterGroups.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteRasterGroup(group.id); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Preset buttons */}
      <div>
        <Label className="font-semibold">Pixel Map Generation</Label>
        <p className="text-sm text-muted-foreground pb-2">Generate for the active raster output.</p>
        <div className="space-y-2">
          <Button
            onClick={() => handlePreset('raster-map-content.png')}
            variant={activePreset === 'content' ? 'default' : 'outline'}
            className="w-full"
          >
            <FileOutput className="mr-2 size-4" />
            Fit to All Screens ({totalWidth}x{totalHeight})
          </Button>
          <Button
            onClick={() => handlePreset('raster-map-hd.png', 1920, 1080)}
            variant={activePreset === 'hd' ? 'default' : 'outline'}
            className="w-full"
            disabled={anyTileTooBig(1920, 1080)}
          >
            HD (1920x1080)
          </Button>
          <Button
            onClick={() => handlePreset('raster-map-4k-uhd.png', 3840, 2160)}
            variant={activePreset === '4k-uhd' ? 'default' : 'outline'}
            className="w-full"
            disabled={anyTileTooBig(3840, 2160)}
          >
            4K UHD (3840x2160)
          </Button>
          <Button
            onClick={() => handlePreset('raster-map-4k-dci.png', 4096, 2160)}
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
          Generate Pixel Map
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

      {/* Per-screen controls */}
      <div>
        <Label className="font-semibold">Screen Settings</Label>
        <p className="text-sm text-muted-foreground pb-2">Configure each screen&apos;s position, name, and raster assignment.</p>
        <div className="space-y-4">
          {screens.map(screen => (
            <ScreenRasterControls
              key={screen.id}
              screen={screen}
              rasterGroups={rasterGroups}
              updateScreenById={updateScreenById}
              isCurrentScreen={screen.id === currentScreen.id}
              rasterMapConfig={rasterMapConfigs[screen.rasterGroupId ?? 'raster-1'] ?? null}
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
  rasterGroups,
  updateScreenById,
  isCurrentScreen,
  rasterMapConfig,
  calculateAndApplyOptimalOffset,
}: {
  screen: Screen;
  rasterGroups: RasterGroup[];
  updateScreenById: (id: string, updater: (s: Screen) => Screen) => void;
  isCurrentScreen: boolean;
  rasterMapConfig: RasterMapConfig | null;
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

  const assignedGroupName = rasterGroups.find(g => g.id === (screen.rasterGroupId ?? 'raster-1'))?.name ?? 'Raster 1';

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-3",
      isCurrentScreen ? "border-primary/40 bg-primary/5" : "border-border/60"
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate">{screen.name}</span>
        {isCurrentScreen && <span className="text-xs text-primary font-medium shrink-0">Active</span>}
      </div>

      {/* Raster group assignment */}
      {rasterGroups.length > 1 && (
        <div className="space-y-1">
          <Label className="text-xs">Raster Output</Label>
          <Select
            value={screen.rasterGroupId ?? 'raster-1'}
            onValueChange={val => updateScreenById(screen.id, s => ({ ...s, rasterGroupId: val }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={assignedGroupName} />
            </SelectTrigger>
            <SelectContent>
              {rasterGroups.map(g => (
                <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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

      {/* Show resolution overlay */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Resolution</Label>
        <Switch
          checked={screen.showResolution ?? false}
          onCheckedChange={val => updateScreenById(screen.id, s => ({ ...s, showResolution: val }))}
          className="scale-90"
        />
      </div>
      {(screen.showResolution) && (
        <div className="space-y-1">
          <Label className="text-xs">Resolution Position</Label>
          <Select
            value={screen.resolutionLabelPosition ?? 'bottom-right'}
            onValueChange={val =>
              updateScreenById(screen.id, s => ({ ...s, resolutionLabelPosition: val as any }))
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
      )}

      {/* Raster crop segments */}
      <Separator className="my-2" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Crop & Arrange in Raster</Label>
          <Switch
            checked={(screen.rasterSegments?.length ?? 0) > 0}
            onCheckedChange={val => {
              if (val) {
                const effW = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
                const effH = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
                updateScreenById(screen.id, s => ({
                  ...s,
                  rasterCrop: null,
                  rasterSegments: [{
                    id: 'seg-1',
                    bounds: { minX: 0, minY: 0, maxX: effW - 1, maxY: effH - 1 },
                    offset: { x: 0, y: 0 },
                  }],
                }));
              } else {
                updateScreenById(screen.id, s => ({ ...s, rasterSegments: [] }));
              }
            }}
            className="scale-90"
          />
        </div>
        {screen.rasterSegments && screen.rasterSegments.length > 0 && (() => {
          const effW = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
          const effH = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);

          const updateSegment = (segId: string, patch: Partial<RasterSegment>) => {
            updateScreenById(screen.id, s => ({
              ...s,
              rasterSegments: (s.rasterSegments ?? []).map(seg =>
                seg.id === segId ? { ...seg, ...patch, bounds: { ...seg.bounds, ...(patch.bounds ?? {}) }, offset: { ...seg.offset, ...(patch.offset ?? {}) } } : seg
              ),
            }));
          };

          // Compute which tiles are already covered by existing segments
          const coveredTiles = new Set<string>();
          (screen.rasterSegments ?? []).forEach(seg => {
            for (let x = seg.bounds.minX; x <= seg.bounds.maxX; x++) {
              for (let y = seg.bounds.minY; y <= seg.bounds.maxY; y++) {
                coveredTiles.add(`${x},${y}`);
              }
            }
          });
          const totalTiles = effW * effH;
          const remainingCount = totalTiles - coveredTiles.size;

          // Find the next available tile (first uncovered tile in row-major order)
          let nextX = 0, nextY = 0, found = false;
          for (let y = 0; y < effH && !found; y++) {
            for (let x = 0; x < effW && !found; x++) {
              if (!coveredTiles.has(`${x},${y}`)) {
                nextX = x; nextY = y; found = true;
              }
            }
          }

          const addSegment = () => {
            if (!found) return;
            const newSeg: RasterSegment = {
              id: `seg-${Date.now()}`,
              bounds: { minX: nextX, minY: nextY, maxX: effW - 1, maxY: effH - 1 },
              offset: { x: 0, y: 0 },
            };
            updateScreenById(screen.id, s => {
              const segs = [...(s.rasterSegments ?? []), newSeg];
              return { ...s, rasterSegments: segs };
            });
          };

          const removeSegment = (segId: string) => {
            updateScreenById(screen.id, s => ({
              ...s,
              rasterSegments: (s.rasterSegments ?? []).filter(seg => seg.id !== segId),
            }));
          };

          return (
            <>
              <p className="text-xs text-muted-foreground">Split this screen into pieces. Each piece shows a tile range and its own X/Y position in the raster.</p>
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Tiles remaining:</span>
                <span className={`text-xs font-medium ${remainingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {remainingCount} / {totalTiles}
                </span>
              </div>
              {screen.rasterSegments.map((seg, idx) => (
                <div key={seg.id} className="rounded-md border border-border/60 p-2 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Piece {idx + 1}</span>
                    {screen.rasterSegments!.length > 1 && (
                      <button onClick={() => removeSegment(seg.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">Start Tile X</Label>
                      <Input
                        type="number"
                        min={1}
                        max={effW}
                        value={seg.bounds.minX + 1}
                        onChange={e => {
                          const v = Math.max(1, Math.min(effW, Number(e.target.value) || 1)) - 1;
                          updateSegment(seg.id, { bounds: { ...seg.bounds, minX: Math.min(v, seg.bounds.maxX) } });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">End Tile X</Label>
                      <Input
                        type="number"
                        min={1}
                        max={effW}
                        value={seg.bounds.maxX + 1}
                        onChange={e => {
                          const v = Math.max(1, Math.min(effW, Number(e.target.value) || 1)) - 1;
                          updateSegment(seg.id, { bounds: { ...seg.bounds, maxX: Math.max(v, seg.bounds.minX) } });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">Start Tile Y</Label>
                      <Input
                        type="number"
                        min={1}
                        max={effH}
                        value={seg.bounds.minY + 1}
                        onChange={e => {
                          const v = Math.max(1, Math.min(effH, Number(e.target.value) || 1)) - 1;
                          updateSegment(seg.id, { bounds: { ...seg.bounds, minY: Math.min(v, seg.bounds.maxY) } });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">End Tile Y</Label>
                      <Input
                        type="number"
                        min={1}
                        max={effH}
                        value={seg.bounds.maxY + 1}
                        onChange={e => {
                          const v = Math.max(1, Math.min(effH, Number(e.target.value) || 1)) - 1;
                          updateSegment(seg.id, { bounds: { ...seg.bounds, maxY: Math.max(v, seg.bounds.minY) } });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">Position X</Label>
                      <Input
                        type="number"
                        value={seg.offset.x}
                        onChange={e => updateSegment(seg.id, { offset: { x: Number(e.target.value) || 0, y: seg.offset.y } })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-0.5">
                      <Label className="text-[10px]">Position Y</Label>
                      <Input
                        type="number"
                        value={seg.offset.y}
                        onChange={e => updateSegment(seg.id, { offset: { x: seg.offset.x, y: Number(e.target.value) || 0 } })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addSegment} disabled={remainingCount === 0}>
                <Plus className="mr-1.5 h-3 w-3" />
                {remainingCount > 0 ? `Add Piece (from tile ${nextX + 1},${nextY + 1})` : 'All tiles covered'}
              </Button>
            </>
          );
        })()}
      </div>
    </div>
  );
}
