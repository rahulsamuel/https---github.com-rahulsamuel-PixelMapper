"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FolderOpen, Loader2 } from "lucide-react";
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
  cloneCloudProject,
  deleteCloudProject,
  getCloudProject,
  getUserCloudProjectSummaries,
  type CloudProjectSummary,
} from "@/lib/cloud-projects";

const PAGE_SIZE = 20;

export function ProjectsLibrary() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<CloudProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setActiveProjectId(readStoredSelection(SELECTED_PROJECT_STORAGE_KEY));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setIsLoading(true);
    getUserCloudProjectSummaries(userId).then(({ data, error }) => {
      if (stale) return;
      setProjects(data);
      setPage(1);
      setListError(error);
      setIsLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [userId]);

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProjects = projects.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleLoad = async (project: CloudProjectSummary): Promise<boolean> => {
    const { data, error } = await getCloudProject(project.id);
    if (error || !data) {
      toast({
        title: "Load Failed",
        description: error ?? "Could not load this project. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    writeStoredSelection(SELECTED_PROJECT_STORAGE_KEY, project.id);
    writeStoredSelection(SELECTED_SCREEN_STORAGE_KEY, null);
    router.push(`/app?project=${encodeURIComponent(project.id)}`);
    return true;
  };

  const handleClone = async (project: CloudProjectSummary): Promise<boolean> => {
    if (!userId) return false;

    const existingNames = new Set(projects.map((item) => item.projectName.trim().toLowerCase()));
    const baseName = `${project.projectName.trim()} Copy`;
    let projectName = baseName;
    let copyNumber = 2;
    while (existingNames.has(projectName.toLowerCase())) {
      projectName = `${baseName} ${copyNumber}`;
      copyNumber += 1;
    }

    const result = await cloneCloudProject(project.id, userId, projectName);
    if (!result.success || !result.projectId) {
      toast({
        title: "Clone Failed",
        description: result.error ?? "Could not clone this project.",
        variant: "destructive",
      });
      return false;
    }

    setProjects((prev) => [
      {
        id: result.projectId as string,
        projectName,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
        ownerEmail: user?.email ?? null,
        isOwner: true,
      },
      ...prev,
    ]);
    setPage(1);
    toast({
      title: "Project Cloned",
      description: `A copy of "${project.projectName}" was added to your projects.`,
    });
    return true;
  };

  const handleDelete = async (project: CloudProjectSummary): Promise<boolean> => {
    if (!project.isOwner) return false;
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
          expand it to browse and restore earlier versions. Projects shared with you by other collaborators
          appear here too.
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
        <>
          <ul className="space-y-3">
            {visibleProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isCurrent={project.id === activeProjectId}
                onLoad={handleLoad}
                onClone={handleClone}
                onDelete={handleDelete}
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
              <span>
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, projects.length)} of {projects.length} projects
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="min-w-[92px] text-center">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
