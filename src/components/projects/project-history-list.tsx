"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, GitBranch, Loader2, LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/components/pixel-mapper/project-versions-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  listProjectHistory,
  restoreProjectHistoryEntry,
  type ProjectHistoryEntry,
} from "@/lib/project-history";

interface ProjectHistoryListProps {
  projectId: string;
}

const KIND_LABEL: Record<ProjectHistoryEntry["kind"], string> = {
  pixel_map: "Pixel map",
  signal_flow: "Signal flow",
};

export function ProjectHistoryList({ projectId }: ProjectHistoryListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ProjectHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingEntry, setPendingEntry] = useState<ProjectHistoryEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadHistory = useCallback(async () => {
    const { data, error } = await listProjectHistory(projectId);
    setIsLoading(false);
    setLoadError(error);
    setEntries(data);
  }, [projectId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRestore = async () => {
    if (!pendingEntry || !user) return;
    setIsRestoring(true);
    const { success, error } = await restoreProjectHistoryEntry(pendingEntry, {
      id: projectId,
      userId: user.id,
    });
    setIsRestoring(false);
    setPendingEntry(null);
    if (!success) {
      toast({ title: "Restore Failed", description: error ?? "Unknown error.", variant: "destructive" });
      return;
    }
    toast({
      title: "Version Restored",
      description: `${KIND_LABEL[pendingEntry.kind]} was restored to ${formatDateTime(pendingEntry.createdAt)}.`,
    });
    await loadHistory();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading versions...
      </div>
    );
  }

  if (loadError) {
    return <p className="py-6 text-center text-sm text-destructive">{loadError}</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No saved versions yet. Versions are saved automatically as the project changes.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const Icon = entry.kind === "pixel_map" ? LayoutGrid : GitBranch;
          return (
            <li
              key={`${entry.kind}-${entry.id}`}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{formatDateTime(entry.createdAt)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {KIND_LABEL[entry.kind]} &middot; {entry.name}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={isRestoring}
                onClick={() => setPendingEntry(entry)}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Restore
              </Button>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={pendingEntry !== null} onOpenChange={(open) => !open && setPendingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Restore this version?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your current work will be replaced and cannot be recovered. This version is from{" "}
              {pendingEntry ? formatDateTime(pendingEntry.createdAt) : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
