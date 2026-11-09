"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import { useToast } from "@/hooks/use-toast";
import { PixelMapLayout } from "./pixel-map-layout";
import { ShareDialog } from "./share-dialog";
import { ProjectSwitcher } from "./project-switcher";
import { useCollaborationNotifications } from "@/hooks/use-collaboration-notifications";
import { SELECTED_PROJECT_STORAGE_KEY } from "@/hooks/use-saved-pixel-map-selection";
import {
  getCachedCloudProject,
  getCloudProject,
  saveCloudProject,
  type CloudProject,
} from "@/lib/cloud-projects";

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
    activeTab,
  } = usePixelMap();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isShareSaving, setIsShareSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef<{ id: string; updatedAt: string } | null>(null);
  const refreshedKeyRef = useRef<string | null>(null);

  useCollaborationNotifications();

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, activeProjectId);
  }, [activeProjectId]);

  const applyProject = useCallback((project: CloudProject) => {
    loadProjectData(project.projectData);
    setProjectName(project.projectName);
    setActiveProjectId(project.id);
    appliedRef.current = { id: project.id, updatedAt: project.updatedAt };
  }, [loadProjectData, setActiveProjectId, setProjectName]);

  const switchToProject = useCallback(async (projectId: string) => {
    const { data, error } = await getCloudProject(projectId);
    if (error || !data) {
      toast({ title: "Error", description: "Could not load project.", variant: "destructive" });
      return;
    }
    applyProject(data);

    const url = new URL(window.location.href);
    url.searchParams.set("project", projectId);
    window.history.replaceState({}, "", url.toString());
  }, [applyProject, toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project") ?? localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    if (!projectId) {
      setRestored(true);
      return;
    }

    if (appliedRef.current?.id !== projectId) {
      const cached = getCachedCloudProject(projectId);
      if (cached) applyProject(cached);
    }
    setRestored(true);

    if (!user) return;
    const refreshKey = `${projectId}|${user.id}`;
    if (refreshedKeyRef.current === refreshKey) return;
    refreshedKeyRef.current = refreshKey;

    let stale = false;
    getCloudProject(projectId).then(({ data, error }) => {
      if (stale || error) return;
      if (!data) {
        localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
        return;
      }
      if (appliedRef.current?.id === data.id && appliedRef.current.updatedAt === data.updatedAt) return;
      applyProject(data);
    });
    return () => {
      stale = true;
    };
  }, [user, applyProject]);

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
    startNewProject();
    setActiveProjectId(null);
    appliedRef.current = null;
    localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState({}, "", url.toString());
  }, [startNewProject, setActiveProjectId]);

  if (!restored) return <div className="h-full w-full" />;

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
