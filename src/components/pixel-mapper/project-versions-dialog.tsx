"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, Loader2, RotateCcw } from "lucide-react";
import {
  getProjectVersionData,
  listProjectVersions,
  updateCloudProject,
  type CloudProject,
  type ProjectVersionSummary,
} from "@/lib/cloud-projects";
import type { ProjectData } from "@/contexts/pixel-map-context";

interface ProjectVersionsDialogProps {
  project: CloudProject | null;
  onClose: () => void;
  onRestored: (projectId: string, projectName: string, data: ProjectData) => void;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function ProjectVersionsDialog({ project, onClose, onRestored }: ProjectVersionsDialogProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<ProjectVersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const projectId = project?.id ?? null;

  useEffect(() => {
    if (!projectId) return;
    let stale = false;
    setIsLoading(true);
    setLoadError(null);
    setVersions([]);
    listProjectVersions(projectId).then(({ data, error }) => {
      if (stale) return;
      setIsLoading(false);
      if (error) {
        setLoadError(error);
        return;
      }
      setVersions(data);
    });
    return () => {
      stale = true;
    };
  }, [projectId]);

  const handleRestore = async (version: ProjectVersionSummary) => {
    if (!project) return;
    setRestoringId(version.id);
    const { data, error } = await getProjectVersionData(version.id);
    if (error || !data) {
      setRestoringId(null);
      toast({ title: "Restore Failed", description: error ?? "This version could not be found.", variant: "destructive" });
      return;
    }
    const { success, error: saveError } = await updateCloudProject(project.id, version.projectName, data);
    setRestoringId(null);
    if (!success) {
      toast({ title: "Restore Failed", description: saveError ?? "Unknown error.", variant: "destructive" });
      return;
    }
    onRestored(project.id, version.projectName, data);
    toast({
      title: "Version Restored",
      description: `"${version.projectName}" was restored to ${formatDateTime(version.createdAt)}.`,
    });
    onClose();
  };

  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Version History
          </DialogTitle>
          <DialogDescription>
            Earlier saved versions of &quot;{project?.projectName}&quot;. Restoring a version keeps the current version in history, so you can switch back.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading versions…
            </div>
          ) : loadError ? (
            <p className="text-center py-8 text-sm text-destructive">{loadError}</p>
          ) : versions.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No earlier versions yet. Versions are saved automatically as the project changes.
            </p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{formatDateTime(version.createdAt)}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{version.projectName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={restoringId !== null}
                  onClick={() => handleRestore(version)}
                >
                  {restoringId === version.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Restore this version
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
