

"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Type } from "lucide-react";

export function LabelControls() {
  const {
    showLabels,
    setShowLabels,
    labelFormat,
    setLabelFormat,
    labelFontSize,
    setLabelFontSize,
    labelColor,
    setLabelColor,
    labelPosition,
    setLabelPosition,
    labelColorMode,
    setLabelColorMode,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    labelStartNumber,
    setLabelStartNumber,
    showScreenName,
    setShowScreenName,
    screenNameLabelPosition,
    setScreenNameLabelPosition,
    screenNameLabelFontSize,
    setScreenNameLabelFontSize,
    screenNameLabelColor,
    setScreenNameLabelColor,
    screenNameLabelColorMode,
    setScreenNameLabelColorMode,
    showResolution,
    setShowResolution,
    resolutionLabelPosition,
    setResolutionLabelPosition,
    resolutionLabelFontSize,
    setResolutionLabelFontSize,
    resolutionLabelColor,
    setResolutionLabelColor,
    resolutionLabelColorMode,
    setResolutionLabelColorMode,
    currentScreen,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
  } = usePixelMap();

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels">Show Tile Labels</Label>
          <Switch
            id="show-labels"
            checked={showLabels}
            onCheckedChange={setShowLabels}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="label-format">Label Format</Label>
          <Select
            value={labelFormat}
            onValueChange={(value) => setLabelFormat(value as any)}
          >
            <SelectTrigger id="label-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sequential">Sequential (1, 2, ...)</SelectItem>
              <SelectItem value="row-col">Row-Col (1-1, 1-2, ...)</SelectItem>
              <SelectItem value="row-letter-col-number">Row Letter-Col Number (A1, B1, ..)</SelectItem>
              <SelectItem value="dmx-style">DMX-Style (A1, A2, ...)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(labelFormat === 'sequential' || labelFormat === 'row-col' || labelFormat === 'row-letter-col-number') && (
          <div className="space-y-2">
            <Label htmlFor="label-start-number">Label Start Number</Label>
            <Input
              id="label-start-number"
              type="number"
              value={labelStartNumber}
              onChange={(e) => setLabelStartNumber(Number(e.target.value) || 1)}
              min="1"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="label-position">Label Position</Label>
          <Select
            value={labelPosition}
            onValueChange={(value) => setLabelPosition(value as any)}
          >
            <SelectTrigger id="label-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-center">Top Center</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-center">Bottom Center</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="label-color-mode">Label Color Mode</Label>
          <Select
            value={labelColorMode}
            onValueChange={(value) => setLabelColorMode(value as 'single' | 'auto')}
          >
            <SelectTrigger id="label-color-mode">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Color</SelectItem>
              <SelectItem value="auto">Automatic (B&W)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {labelColorMode === 'single' && (
          <div className="space-y-2">
            <Label htmlFor="label-color">Label Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="label-color"
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                className="w-14 p-1"
              />
              <Input
                type="text"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                placeholder="#ffffff"
                className="font-mono"
              />
            </div>
          </div>
        )}


        <div className="space-y-2">
          <Label htmlFor="label-font-size">Font Size: {labelFontSize}px</Label>
          <Slider
            id="label-font-size"
            min={8}
            max={128}
            step={1}
            value={[labelFontSize]}
            onValueChange={(value) => setLabelFontSize(value[0])}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="show-slice-offsets-grid">Show Content Offsets</Label>
          <Switch id="show-slice-offsets-grid" checked={showSliceOffsetLabels} onCheckedChange={setShowSliceOffsetLabels} />
        </div>

        <Separator />
        
        <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-screen-name">Show Screen Name</Label>
              <Switch
                id="show-screen-name"
                checked={showScreenName}
                onCheckedChange={setShowScreenName}
              />
            </div>
            {showScreenName && (
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="screen-name-position">Position</Label>
                        <Select
                            value={screenNameLabelPosition}
                            onValueChange={(value) => setScreenNameLabelPosition(value as any)}
                        >
                            <SelectTrigger id="screen-name-position"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="top-left">Top Left</SelectItem>
                                <SelectItem value="top-center">Top Center</SelectItem>
                                <SelectItem value="top-right">Top Right</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="screen-name-color-mode">Color Mode</Label>
                        <Select
                            value={screenNameLabelColorMode}
                            onValueChange={(v) => setScreenNameLabelColorMode(v as any)}
                        >
                            <SelectTrigger id="screen-name-color-mode"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single Color</SelectItem>
                                <SelectItem value="auto">Automatic (B&W)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {screenNameLabelColorMode === 'single' && (
                        <div className="space-y-2">
                        <Label htmlFor="screen-name-color">Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                            id="screen-name-color"
                            type="color"
                            value={screenNameLabelColor}
                            onChange={(e) => setScreenNameLabelColor(e.target.value)}
                            className="w-14 p-1"
                            />
                             <Input
                                type="text"
                                value={screenNameLabelColor}
                                onChange={(e) => setScreenNameLabelColor(e.target.value)}
                                placeholder="#ffffff"
                                className="font-mono"
                            />
                        </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="screen-name-font-size">Font Size: {screenNameLabelFontSize}px</Label>
                        <Slider
                            id="screen-name-font-size"
                            min={12}
                            max={256}
                            step={1}
                            value={[screenNameLabelFontSize]}
                            onValueChange={(value) => setScreenNameLabelFontSize(value[0])}
                        />
                    </div>
                </div>
            )}
        </div>

        <Separator />

        <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-resolution">Show Resolution</Label>
              <Switch
                id="show-resolution"
                checked={showResolution}
                onCheckedChange={setShowResolution}
              />
            </div>
            {showResolution && (
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="resolution-position">Position</Label>
                        <Select
                            value={resolutionLabelPosition}
                            onValueChange={(value) => setResolutionLabelPosition(value as any)}
                        >
                            <SelectTrigger id="resolution-position"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="top-left">Top Left</SelectItem>
                                <SelectItem value="top-center">Top Center</SelectItem>
                                <SelectItem value="top-right">Top Right</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resolution-color-mode">Color Mode</Label>
                        <Select
                            value={resolutionLabelColorMode}
                            onValueChange={(v) => setResolutionLabelColorMode(v as any)}
                        >
                            <SelectTrigger id="resolution-color-mode"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single Color</SelectItem>
                                <SelectItem value="auto">Automatic (B&W)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {resolutionLabelColorMode === 'single' && (
                        <div className="space-y-2">
                            <Label htmlFor="resolution-color">Color</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="resolution-color"
                                    type="color"
                                    value={resolutionLabelColor}
                                    onChange={(e) => setResolutionLabelColor(e.target.value)}
                                    className="w-14 p-1"
                                />
                                <Input
                                    type="text"
                                    value={resolutionLabelColor}
                                    onChange={(e) => setResolutionLabelColor(e.target.value)}
                                    placeholder="#ffffff"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="resolution-font-size">Font Size: {resolutionLabelFontSize}px</Label>
                        <Slider
                            id="resolution-font-size"
                            min={12}
                            max={256}
                            step={1}
                            value={[resolutionLabelFontSize]}
                            onValueChange={(value) => setResolutionLabelFontSize(value[0])}
                        />
                    </div>
                </div>
            )}
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Text Overlays
            </Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={addTextOverlay}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Text
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Drag text on the grid to reposition. Hover over text to delete it.
          </p>
          {(currentScreen.textOverlays ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">
              No text overlays yet. Click "Add Text" to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {(currentScreen.textOverlays ?? []).map((overlay) => (
                <div key={overlay.id} className="border rounded-lg p-3 space-y-2.5 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Input
                      value={overlay.text}
                      onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                      placeholder="Enter text"
                      className="h-8 text-sm flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeTextOverlay(overlay.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Font Size: {overlay.fontSize}px</Label>
                    <Slider
                      min={12}
                      max={256}
                      step={1}
                      value={[overlay.fontSize]}
                      onValueChange={(v) => updateTextOverlay(overlay.id, { fontSize: v[0] })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Rotation: {overlay.rotation}°</Label>
                    <Slider
                      min={-180}
                      max={180}
                      step={1}
                      value={[overlay.rotation]}
                      onValueChange={(v) => updateTextOverlay(overlay.id, { rotation: v[0] })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Color Mode</Label>
                    <Select
                      value={overlay.colorMode}
                      onValueChange={(v) => updateTextOverlay(overlay.id, { colorMode: v as any })}
                    >
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Color</SelectItem>
                        <SelectItem value="auto">Automatic (B&W)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {overlay.colorMode === 'single' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={overlay.color}
                          onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                          className="w-14 p-1 h-8"
                        />
                        <Input
                          type="text"
                          value={overlay.color}
                          onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                          placeholder="#ffffff"
                          className="font-mono h-8 text-sm flex-1"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Background</Label>
                    <Switch
                      checked={overlay.showBackground}
                      onCheckedChange={(v) => updateTextOverlay(overlay.id, { showBackground: v })}
                    />
                  </div>
                  {overlay.showBackground && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Background Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={overlay.backgroundColor}
                          onChange={(e) => updateTextOverlay(overlay.id, { backgroundColor: e.target.value })}
                          className="w-14 p-1 h-8"
                        />
                        <Input
                          type="text"
                          value={overlay.backgroundColor}
                          onChange={(e) => updateTextOverlay(overlay.id, { backgroundColor: e.target.value })}
                          placeholder="#000000"
                          className="font-mono h-8 text-sm flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
