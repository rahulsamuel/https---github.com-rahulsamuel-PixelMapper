
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Palette, Trash2 } from "lucide-react";

export function EditTools() {
  const { activeTool, setActiveTool } = usePixelMap();

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant={activeTool === 'delete' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool(activeTool === 'delete' ? 'delete' : 'delete')}
      >
        <Trash2 className="mr-2" />
        Delete
      </Button>
      <Button
        variant={activeTool === 'color' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool(activeTool === 'color' ? 'delete' : 'color')}
      >
        <Palette className="mr-2" />
        Color
      </Button>
    </div>
  );
}
