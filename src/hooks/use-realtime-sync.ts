"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ProjectData } from "@/contexts/pixel-map-context";

const SAVE_DEBOUNCE_MS = 2000;

interface UseRealtimeSyncArgs {
  projectId: string | null;
  userId: string | null;
  getProjectData: () => ProjectData;
  loadProjectData: (data: ProjectData) => void;
}

export function useRealtimeSync({
  projectId,
  userId,
  getProjectData,
  loadProjectData,
}: UseRealtimeSyncArgs) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const skipRemoteRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(getProjectData);

  dataRef.current = getProjectData;

  const scheduleSave = useCallback(() => {
    if (!projectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const data = dataRef.current();
      skipRemoteRef.current = true;
      setIsSyncing(true);
      const { error } = await supabase
        .from("pixel_map_projects")
        .update({
          project_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
      setIsSyncing(false);
      if (!error) setLastSyncAt(Date.now());
    }, SAVE_DEBOUNCE_MS);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-sync-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pixel_map_projects",
          filter: `id=eq.${projectId}`,
        },
        (payload: any) => {
          if (skipRemoteRef.current) {
            skipRemoteRef.current = false;
            return;
          }
          const newProjectData = payload.new?.project_data;
          if (newProjectData) {
            loadProjectData(newProjectData as ProjectData);
            setLastSyncAt(Date.now());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, loadProjectData]);

  return { scheduleSave, isSyncing, lastSyncAt };
}
