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
import { Download, Upload, RotateCcw, Settings, Trash2 } from "lucide-react";
import { useRef } from "react";

export function PixelMapperActions() {
  const { deletedCount, restoreAll, exportProject, importProject } = usePixelMapper();
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importProject(file);
    }
    // Reset input value to allow re-importing the same file
    e.target.value = '';
  };

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
        <div className="grid grid-cols-2 gap-2">
           <Button onClick={exportProject} variant="outline">
            <Download className="mr-2" />
            Export
          </Button>
          <Button onClick={handleImportClick} variant="outline">
            <Upload className="mr-2" />
            Import
             <input
              ref={importInputRef}
              id="import-project-input"
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleFileChange}
            />
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Deleted Tiles</span>
          </div>
          <span className="font-mono text-lg font-bold">{deletedCount}</span>
        </div>
        <Button onClick={restoreAll} variant="outline" className="w-full">
            <RotateCcw className="mr-2" />
            Restore All
        </Button>
      </CardContent>
    </Card>
  );
}
