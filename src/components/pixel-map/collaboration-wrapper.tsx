"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import { useToast } from "@/hooks/use-toast";
import { PixelMapLayout } from "./pixel-map-layout";
import { ShareDialog } from "./share-dialog";
import { ProjectSwitcher } from "./project-switcher";
import { useCollaborationNotifications } from "@/hooks/use-collaboration-notifications";
import {
  SELECTED_PROJECT_STORAGE_KEY,
  SELECTED_SCREEN_STORAGE_KEY,
  readStoredSelection,
  writeStoredSelection,
} from "@/hooks/use-saved-pixel-map-selection";
import {
  getCachedCloudProject,
  getCloudProject,
  saveCloudProject,
  type CloudProject,
} from "@/lib/cloud-projects";

function ProjectLoadingSkeleton() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background" aria-live="polite" aria-label="Loading project">
      <div className="hidden w-80 shrink-0 space-y-4 border-r p-4 md:block">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-3 border-b px-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="ml-auto h-8 w-32" />
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-3xl space-y-4">
            <Skeleton className="mx-auto h-8 w-1/3" />
            <Skeleton className="h-[360px] w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <p className="text-center text-sm text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollaborationWrapper() {
  const {
    activeProjectId,
    setActiveProjectId,
    getProjectData,
    loadProjectData,
    setProjectName,
    projectName,
    startNewProject,
    currentScreenId,
    setCurrentScreenId,
    activeTab,
  } = usePixelMap();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isShareSaving, setIsShareSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef<{ id: string; updatedAt: string } | null>(null);
  const refreshedKeyRef = useRef<string | null>(null);

  useCollaborationNotifications();

  const applyProject = useCallback((project: CloudProject) => {
    loadProjectData(project.projectData);
    setProjectName(project.projectName);
    setActiveProjectId(project.id);
    appliedRef.current = { id: project.id, updatedAt: project.updatedAt };
  }, [loadProjectData, setActiveProjectId, setProjectName]);

  const restoreStoredScreen = useCallback((project: CloudProject) => {
    const storedScreenId = readStoredSelection(SELECTED_SCREEN_STORAGE_KEY);
    if (storedScreenId && project.projectData.screens.some((s) => s.id === storedScreenId)) {
      setCurrentScreenId(storedScreenId);
    }
  }, [setCurrentScreenId]);

  const switchToProject = useCallback(async (projectId: string) => {
    setProjectLoading(true);
    setProjectLoadError(null);
    const { data, error } = await getCloudProject(projectId);
    if (error || !data) {
      setProjectLoading(false);
      setProjectLoadError("Could not load this project. Please try again.");
      toast({ title: "Error", description: "Could not load project.", variant: "destructive" });
      return;
    }
    applyProject(data);
    setProjectLoading(false);

    const url = new URL(window.location.href);
    url.searchParams.set("project", projectId);
    window.history.replaceState({}, "", url.toString());
  }, [applyProject, toast]);

  useEffect(() => {
    if (activeProjectId) writeStoredSelection(SELECTED_PROJECT_STORAGE_KEY, activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (restored && currentScreenId) writeStoredSelection(SELECTED_SCREEN_STORAGE_KEY, currentScreenId);
  }, [restored, currentScreenId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project") ?? readStoredSelection(SELECTED_PROJECT_STORAGE_KEY);
    if (!projectId) {
      setProjectLoadError(null);
      setProjectLoading(false);
      setRestored(true);
      return;
    }

    const cached = getCachedCloudProject(projectId);
    if (appliedRef.current?.id !== projectId && cached) {
      applyProject(cached);
      restoreStoredScreen(cached);
      setProjectLoadError(null);
      setProjectLoading(false);
    } else if (!cached) {
      setProjectLoading(true);
    }
    setRestored(true);

    if (!user) {
      if (!cached) {
        setProjectLoading(false);
        setProjectLoadError("Could not load this project. Please sign in again.");
      }
      return;
    }
    const refreshKey = `${projectId}|${user.id}`;
    if (refreshedKeyRef.current === refreshKey) return;
    refreshedKeyRef.current = refreshKey;

    let stale = false;
    getCloudProject(projectId).then(({ data, error }) => {
      if (stale) return;
      if (error || !data) {
        if (!cached) {
          setProjectLoading(false);
          setProjectLoadError("Could not load this project. Please try again.");
        }
        return;
      }
      if (appliedRef.current?.id === data.id && appliedRef.current.updatedAt === data.updatedAt) {
        setProjectLoading(false);
        return;
      }
      applyProject(data);
      restoreStoredScreen(data);
      setProjectLoadError(null);
      setProjectLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [user, applyProject, restoreStoredScreen]);

  const { onlineUsers, updateCursor } = usePresence({
    projectId: activeProjectId,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    currentScreenId,
    activeTab,
    gridRef,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateCursor(x, y);
  }, [updateCursor]);

  const handleShareClick = useCallback(async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to share projects.", variant: "destructive" });
      return;
    }
    if (activeProjectId) {
      setShareDialogOpen(true);
      return;
    }
    setIsShareSaving(true);
    const projectData = getProjectData();
    const { success, error, projectId } = await saveCloudProject(user.id, projectName, projectData);
    setIsShareSaving(false);
    if (!success || !projectId) {
      toast({ title: "Share Failed", description: error ?? "Could not save project for sharing.", variant: "destructive" });
      return;
    }
    setActiveProjectId(projectId);
    setShareDialogOpen(true);
  }, [user, activeProjectId, getProjectData, projectName, setActiveProjectId, toast]);

  const handleNewProject = useCallback(() => {
    setProjectLoadError(null);
    setProjectLoading(false);
    startNewProject();
    setActiveProjectId(null);
    appliedRef.current = null;
    localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState({}, "", url.toString());
  }, [startNewProject, setActiveProjectId]);

  if (!restored || projectLoading) return <ProjectLoadingSkeleton />;
  if (projectLoadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-6 text-center">
        <div className="space-y-2">
          <p className="font-medium">Project could not be loaded</p>
          <p className="text-sm text-muted-foreground">{projectLoadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full" onMouseMove={handleMouseMove} ref={gridRef}>
      <PixelMapLayout
        onlineUsers={onlineUsers}
        onShareClick={handleShareClick}
        projectSwitcher={
          <ProjectSwitcher
            activeProjectId={activeProjectId}
            currentProjectName={projectName}
            onSwitchProject={switchToProject}
            onNewProject={handleNewProject}
          />
        }
      />
      <ShareDialog
        projectId={activeProjectId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        isShareSaving={isShareSaving}
      />
    </div>
  );
}
