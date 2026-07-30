"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ProjectData, Screen } from "@/contexts/pixel-map-context";

const SAVE_DEBOUNCE_MS = 5000;
const SESSION_ID = Math.random().toString(36).slice(2, 11);

interface UseRealtimeSyncArgs {
  projectId: string | null;
  userId: string | null;
  screens: Screen[];
  getProjectData: () => ProjectData;
  mergeRemoteScreen: (screen: Screen) => void;
  removeRemoteScreen: (screenId: string) => void;
}

export function useRealtimeSync({
  projectId,
  userId,
  screens,
  getProjectData,
  mergeRemoteScreen,
  removeRemoteScreen,
}: UseRealtimeSyncArgs) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(getProjectData);
  const lastBroadcastScreensRef = useRef<Screen[]>([]);
  const isMergingRef = useRef(false);

  dataRef.current = getProjectData;

  const scheduleSave = useCallback(() => {
    if (!projectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const data = dataRef.current();
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

  // Detect local screen changes, broadcast them, and schedule a DB save.
  useEffect(() => {
    if (!projectId || !userId) return;

    if (isMergingRef.current) {
      lastBroadcastScreensRef.current = screens;
      isMergingRef.current = false;
      return;
    }

    const prev = lastBroadcastScreensRef.current;
    const prevMap = new Map(prev.map(s => [s.id, s]));
    const currentIds = new Set(screens.map(s => s.id));

    // Broadcast deleted screens
    for (const oldScreen of prev) {
      if (!currentIds.has(oldScreen.id) && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "screen_delete",
          payload: { screenId: oldScreen.id, userId, sessionId: SESSION_ID },
        });
      }
    }

    // Broadcast changed or new screens
    for (const screen of screens) {
      const prevScreen = prevMap.get(screen.id);
      if (!prevScreen || JSON.stringify(prevScreen) !== JSON.stringify(screen)) {
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "screen_update",
            payload: { screen, userId, sessionId: SESSION_ID },
          });
        }
      }
    }

    lastBroadcastScreensRef.current = screens;
    scheduleSave();
  }, [screens, projectId, userId, scheduleSave]);

  // Set up realtime broadcast channel
  useEffect(() => {
    if (!projectId || !userId) return;

    const channel = supabase.channel(`project-collab-${projectId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;
    lastBroadcastScreensRef.current = screens;

    channel
      .on("broadcast", { event: "screen_update" }, (payload: any) => {
        const remoteScreen = payload.payload?.screen as Screen | undefined;
        const remoteSessionId = payload.payload?.sessionId as string | undefined;
        if (!remoteScreen || !remoteSessionId || remoteSessionId === SESSION_ID) return;
        isMergingRef.current = true;
        mergeRemoteScreen(remoteScreen);
        setLastSyncAt(Date.now());
      })
      .on("broadcast", { event: "screen_delete" }, (payload: any) => {
        const screenId = payload.payload?.screenId as string | undefined;
        const remoteSessionId = payload.payload?.sessionId as string | undefined;
        if (!screenId || !remoteSessionId || remoteSessionId === SESSION_ID) return;
        isMergingRef.current = true;
        removeRemoteScreen(screenId);
        setLastSyncAt(Date.now());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, mergeRemoteScreen, removeRemoteScreen]);

  return { scheduleSave, isSyncing, lastSyncAt };
}
