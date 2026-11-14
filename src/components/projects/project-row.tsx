"use client";

import { useState } from "react";
import { ChevronDown, FolderOpen, Loader2, Trash2 } from "lucide-react";
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
import { ProjectHistoryList } from "@/components/projects/project-history-list";
import type { CloudProjectSummary } from "@/lib/cloud-projects";
import { cn } from "@/lib/utils";

interface ProjectRowProps {
  project: CloudProjectSummary;
  isCurrent: boolean;
  onLoad: (project: CloudProjectSummary) => void;
  onDelete: (project: CloudProjectSummary) => Promise<boolean>;
}

export function ProjectRow({ project, isCurrent, onLoad, onDelete }: ProjectRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadConfirmOpen, setIsLoadConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const deleted = await onDelete(project);
    if (!deleted) setIsDeleting(false);
  };

  return (
    <li className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-medium">{project.projectName}</h2>
            {isCurrent && (
              <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                Current
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Last updated {formatDateTime(project.updatedAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-3"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((open) => !open)}
          >
            Versions
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
            />
          </Button>
          <Button size="sm" className="h-8 gap-1.5 px-3" onClick={() => setIsLoadConfirmOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5" />
            Load
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${project.projectName}`}
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3">
          <ProjectHistoryList key={project.id} projectId={project.id} />
        </div>
      )}

      <AlertDialog open={isLoadConfirmOpen} onOpenChange={setIsLoadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load &quot;{project.projectName}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current work will be replaced and cannot be recovered. This project&apos;s pixel map and
              signal flow will open instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onLoad(project)}>Load project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{project.projectName}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the pixel map, the signal flow diagram, and all saved versions of this
              project. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
