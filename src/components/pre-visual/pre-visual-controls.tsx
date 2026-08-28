"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Ruler, Grid3x3, Tag, Palette, Rotate3d } from "lucide-react";
import type { PreVisualSettings, ViewMode, RenderMode } from "./types";

interface Props {
  settings: PreVisualSettings;
  onChange: (patch: Partial<PreVisualSettings>) => void;
  onReset: () => void;
  screens: { id: string; name: string }[];
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "isometric", label: "Isometric" },
  { value: "front", label: "Front" },
  { value: "side", label: "Side" },
  { value: "top", label: "Top" },
];

export function PreVisualControls({ settings, onChange, onReset, screens }: Props) {
  return (
    <div className="space-y-4">
      {/* Screen selector */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Screen</Label>
        <Select
          value={settings.selectedScreenId ?? ""}
          onValueChange={(v) => onChange({ selectedScreenId: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a screen" />
          </SelectTrigger>
          <SelectContent>
            {screens.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* View mode */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block flex items-center gap-1.5">
          <Rotate3d className="h-3.5 w-3.5" /> View
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {VIEW_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={settings.view === opt.value ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => onChange({ view: opt.value })}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Render mode */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Render Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["2d", "3d"] as RenderMode[]).map(mode => (
            <Button
              key={mode}
              variant={settings.renderMode === mode ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => onChange({ renderMode: mode })}
            >
              {mode === "2d" ? "2D" : "3D"}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* 3D rotation controls */}
      {settings.renderMode === "3d" && settings.view === "isometric" && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Rotation</Label>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">X Axis</span>
                <span className="font-mono">{settings.rotateX}°</span>
              </div>
              <Slider
                value={[settings.rotateX]}
                min={-90}
                max={90}
                step={1}
                onValueChange={([v]) => onChange({ rotateX: v })}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Y Axis</span>
                <span className="font-mono">{settings.rotateY}°</span>
              </div>
              <Slider
                value={[settings.rotateY]}
                min={-180}
                max={180}
                step={1}
                onValueChange={([v]) => onChange({ rotateY: v })}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Z Axis</span>
                <span className="font-mono">{settings.rotateZ}°</span>
              </div>
              <Slider
                value={[settings.rotateZ]}
                min={-180}
                max={180}
                step={1}
                onValueChange={([v]) => onChange({ rotateZ: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Zoom */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Zoom</span>
          <span className="font-mono">{Math.round(settings.zoom * 100)}%</span>
        </div>
        <Slider
          value={[settings.zoom]}
          min={0.2}
          max={3}
          step={0.05}
          onValueChange={([v]) => onChange({ zoom: v })}
        />
      </div>

      <Separator />

      {/* Display toggles */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Display</Label>
        <ToggleRow
          icon={<Ruler className="h-3.5 w-3.5" />}
          label="Dimensions"
          checked={settings.showDimensions}
          onChange={(v) => onChange({ showDimensions: v })}
        />
        <ToggleRow
          icon={<Tag className="h-3.5 w-3.5" />}
          label="Labels"
          checked={settings.showLabels}
          onChange={(v) => onChange({ showLabels: v })}
        />
        <ToggleRow
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
          label="Ground Grid"
          checked={settings.showGrid}
          onChange={(v) => onChange({ showGrid: v })}
        />
      </div>

      <Separator />

      {/* Background color */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" /> Background
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="h-8 w-8 rounded border border-border cursor-pointer"
          />
          <span className="text-xs font-mono text-muted-foreground">{settings.backgroundColor}</span>
        </div>
      </div>

      <Separator />

      {/* Reset button */}
      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Reset View
      </Button>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
