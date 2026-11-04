"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function RasterScreenToggles({ groupId }: { groupId: string }) {
  const { screens, updateScreenById } = usePixelMap();
  const groupScreens = screens.filter(s => (s.rasterGroupId ?? 'raster-1') === groupId);
  if (groupScreens.length === 0) return null;

  const enabledCount = groupScreens.filter(s => s.rasterEnabled !== false).length;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-xs text-muted-foreground mr-1">
        Screens in preview and download ({enabledCount}/{groupScreens.length})
      </span>
      {groupScreens.map(screen => {
        const isOn = screen.rasterEnabled !== false;
        return (
          <label
            key={screen.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              isOn ? "bg-background border-border text-foreground" : "bg-muted/40 border-dashed text-muted-foreground"
            )}
          >
            <Switch
              checked={isOn}
              onCheckedChange={checked => updateScreenById(screen.id, s => ({ ...s, rasterEnabled: checked }))}
            />
            <span className="truncate max-w-[160px]">{screen.name}</span>
          </label>
        );
      })}
    </div>
  );
}
