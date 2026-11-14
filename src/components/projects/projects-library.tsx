"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRow } from "@/components/projects/project-row";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  readStoredSelection,
  SELECTED_PROJECT_STORAGE_KEY,
  SELECTED_SCREEN_STORAGE_KEY,
  writeStoredSelection,
} from "@/hooks/use-saved-pixel-map-selection";
import {
  deleteCloudProject,
  getUserCloudProjectSummaries,
  type CloudProjectSummary,
} from "@/lib/cloud-projects";

export function ProjectsLibrary() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<CloudProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    setActiveProjectId(readStoredSelection(SELECTED_PROJECT_STORAGE_KEY));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    getUserCloudProjectSummaries(userId).then(({ data, error }) => {
      if (stale) return;
      setProjects(data);
      setListError(error);
      setIsLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [userId]);

  const handleLoad = (project: CloudProjectSummary) => {
    writeStoredSelection(SELECTED_PROJECT_STORAGE_KEY, project.id);
    writeStoredSelection(SELECTED_SCREEN_STORAGE_KEY, null);
    router.push("/app");
  };

  const handleDelete = async (project: CloudProjectSummary): Promise<boolean> => {
    const { success, error } = await deleteCloudProject(project.id);
    if (!success) {
      toast({ title: "Delete Failed", description: error ?? "Unknown error.", variant: "destructive" });
      return false;
    }
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    if (readStoredSelection(SELECTED_PROJECT_STORAGE_KEY) === project.id) {
      writeStoredSelection(SELECTED_PROJECT_STORAGE_KEY, null);
      writeStoredSelection(SELECTED_SCREEN_STORAGE_KEY, null);
      setActiveProjectId(null);
    }
    toast({
      title: "Project Deleted",
      description: `"${project.projectName}" and all of its versions were deleted.`,
    });
    return true;
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each project holds its pixel map and signal flow. Open a project to continue working on it, or
          expand it to browse and restore earlier versions.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading projects...
        </div>
      ) : listError ? (
        <p className="py-16 text-center text-sm text-destructive">{listError}</p>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Save a pixel map to create your first project.</p>
          </div>
          <Link href="/app">
            <Button size="sm">Go to Pixel Map</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isCurrent={project.id === activeProjectId}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
