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
import { Palette, Tag, Trash2, Wand2 } from "lucide-react";

export function EditTools() {
  const { activeTool, setActiveTool } = usePixelMapper();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="size-5" />
          <CardTitle>Edit Tools</CardTitle>
        </div>
        <CardDescription>
          Select a tool to apply to the grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={activeTool === 'delete' ? 'secondary' : 'outline'}
            onClick={() => setActiveTool('delete')}
          >
            <Trash2 className="mr-2" />
            Delete
          </Button>
          <Button
            variant={activeTool === 'label' ? 'secondary' : 'outline'}
            onClick={() => setActiveTool('label')}
          >
            <Tag className="mr-2" />
            Label
          </Button>
          <Button
            variant={activeTool === 'color' ? 'secondary' : 'outline'}
            onClick={() => setActiveTool('color')}
          >
            <Palette className="mr-2" />
            Color
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
