"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useRef } from "react";

export function PixelMapperActions() {
  const { exportProject, importProject } = usePixelMapper();
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
  );
}
