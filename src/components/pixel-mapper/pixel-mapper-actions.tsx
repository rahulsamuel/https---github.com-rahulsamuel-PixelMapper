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
import { RotateCcw, Settings, Trash2 } from "lucide-react";

export function PixelMapperActions() {
  const { deletedCount, restoreAll } = usePixelMapper();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="size-5" />
          <CardTitle>Actions</CardTitle>
        </div>
        <CardDescription>
          Manage your grid and export your work.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Deleted Tiles</span>
          </div>
          <span className="font-mono text-lg font-bold">{deletedCount}</span>
        </div>
        <Button onClick={restoreAll} variant="outline" className="w-full">
            <RotateCcw className="mr-2 size-4" />
            Restore All
        </Button>
      </CardContent>
    </Card>
  );
}
