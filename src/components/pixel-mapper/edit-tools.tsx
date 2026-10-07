"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Button } from "@/components/ui/button";
import { Palette, Trash2, Bolt, GitBranch, Eraser, Undo2 } from "lucide-react";

export function EditTools() {
  const {
    activeTool,
    setActiveTool,
    activeTab,
    clearDataWiring,
    restoreDataWiring,
    clearPowerWiring,
    restorePowerWiring,
  } = usePixelMap();

  const onWiringTab = activeTab === 'wiring';

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant={activeTool === 'delete' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool('delete')}
        size="sm"
      >
        <Trash2 className="mr-2" />
        Delete
      </Button>
      <Button
        variant={activeTool === 'color' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool(activeTool === 'color' ? 'delete' : 'color')}
        size="sm"
      >
        <Palette className="mr-2" />
        Color
      </Button>
      <Button
        variant={activeTool === 'power' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool(activeTool === 'power' ? 'delete' : 'power')}
        size="sm"
        disabled={!onWiringTab}
      >
        <Bolt className="mr-2" />
        Power
      </Button>
      <Button
        variant={activeTool === 'data' ? 'secondary' : 'outline'}
        onClick={() => setActiveTool(activeTool === 'data' ? 'delete' : 'data')}
        size="sm"
        disabled={!onWiringTab}
      >
        <GitBranch className="mr-2" />
        Data
      </Button>
      <Button
        variant="outline"
        onClick={clearDataWiring}
        size="sm"
        disabled={!onWiringTab}
        className="col-span-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Eraser className="mr-2" />
        Clear Data Cabling
      </Button>
      <Button
        variant="outline"
        onClick={restoreDataWiring}
        size="sm"
        disabled={!onWiringTab}
        className="col-span-2 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600"
      >
        <Undo2 className="mr-2" />
        Restore Data Cabling
      </Button>
      <Button
        variant="outline"
        onClick={clearPowerWiring}
        size="sm"
        disabled={!onWiringTab}
        className="col-span-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Eraser className="mr-2" />
        Clear Power Cabling
      </Button>
      <Button
        variant="outline"
        onClick={restorePowerWiring}
        size="sm"
        disabled={!onWiringTab}
        className="col-span-2 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600"
      >
        <Undo2 className="mr-2" />
        Restore Power Cabling
      </Button>
    </div>
  );
}
