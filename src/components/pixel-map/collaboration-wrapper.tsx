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
import { supabase } from "@/lib/supabase/client";
import { saveCloudProject } from "@/lib/cloud-projects";
import type { ProjectData } from "@/contexts/pixel-map-context";

const ACTIVE_PROJECT_KEY = "pixel-map:activeProjectId";

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
  const gridRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string | null>(null);

  useCollaborationNotifications();

  const switchToProject = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from("pixel_map_projects")
      .select("project_name, project_data")
      .eq("id", projectId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Could not load project.", variant: "destructive" });
      return;
    }
    loadProjectData(data.project_data as ProjectData);
    setProjectName(data.project_name);
    setActiveProjectId(projectId);
    loadedRef.current = projectId;
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);

    const url = new URL(window.location.href);
    url.searchParams.set("project", projectId);
    window.history.replaceState({}, "", url.toString());
  }, [loadProjectData, setActiveProjectId, setProjectName, toast]);

  // Load project from URL param, or the last opened project, on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project") ?? localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (projectId && projectId !== loadedRef.current && user) {
      loadedRef.current = projectId;
      (async () => {
        const { data, error } = await supabase
          .from("pixel_map_projects")
          .select("project_name, project_data")
          .eq("id", projectId)
          .maybeSingle();

        if (error) return;
        if (!data) {
          localStorage.removeItem(ACTIVE_PROJECT_KEY);
          return;
        }
        loadProjectData(data.project_data as ProjectData);
        setProjectName(data.project_name);
        setActiveProjectId(projectId);
        localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
      })();
    }
  }, [user, loadProjectData, setActiveProjectId, setProjectName]);

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
    console.log("[share] saving project", { userId: user.id, projectName, hasData: !!projectData });
    const { success, error, projectId } = await saveCloudProject(user.id, projectName, projectData);
    console.log("[share] save result", { success, error, projectId });
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
    loadedRef.current = null;
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState({}, "", url.toString());
  }, [startNewProject, setActiveProjectId]);

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
