
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProjectDetailsControls() {
  const { 
    projectNumber, setProjectNumber,
    versionNumber, setVersionNumber,
    projectNotes, setProjectNotes
  } = usePixelMap();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-number">Project Number</Label>
        <Input 
          id="project-number" 
          placeholder="e.g. PJ-2024-001" 
          value={projectNumber} 
          onChange={(e) => setProjectNumber(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="version-number">Version Number</Label>
        <Input 
          id="version-number" 
          placeholder="e.g. 1.0" 
          value={versionNumber} 
          onChange={(e) => setVersionNumber(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-notes">Delivery Instructions / Notes</Label>
        <Textarea 
          id="project-notes" 
          placeholder="Enter content delivery notes, file naming conventions, etc." 
          rows={10}
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
