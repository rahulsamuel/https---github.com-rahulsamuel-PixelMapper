"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import { PixelMapLayout } from "./pixel-map-layout";
import { ShareDialog } from "./share-dialog";
import { supabase } from "@/lib/supabase/client";
import type { ProjectData } from "@/contexts/pixel-map-context";

export function CollaborationWrapper() {
  const {
    activeProjectId,
    setActiveProjectId,
    getProjectData,
    loadProjectData,
    scheduleSave,
    setProjectName,
  } = usePixelMap();
  const { user } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string | null>(null);

  // Load project from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId && projectId !== loadedRef.current && user) {
      loadedRef.current = projectId;
      (async () => {
        const { data, error } = await supabase
          .from("pixel_map_projects")
          .select("project_name, project_data")
          .eq("id", projectId)
          .maybeSingle();

        if (error || !data) return;
        loadProjectData(data.project_data as ProjectData);
        setProjectName(data.project_name);
        setActiveProjectId(projectId);
      })();
    }
  }, [user, loadProjectData, setActiveProjectId, setProjectName]);

  const { onlineUsers, updateCursor } = usePresence({
    projectId: activeProjectId,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    gridRef,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateCursor(x, y);
  }, [updateCursor]);

  return (
    <div className="h-full w-full" onMouseMove={handleMouseMove} ref={gridRef}>
      <PixelMapLayout
        onlineUsers={onlineUsers}
        onShareClick={() => setShareDialogOpen(true)}
      />
      <ShareDialog
        projectId={activeProjectId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  );
}
