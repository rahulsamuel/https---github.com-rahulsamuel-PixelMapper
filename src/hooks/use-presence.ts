"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface PresenceUser {
  userId: string;
  sessionId: string;
  email: string;
  color: string;
  cursor: { x: number; y: number } | null;
  currentScreenId: string | null;
  activeTab: string | null;
  isLocal?: boolean;
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f43f5e",
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0x7fffffff;
  }
  return COLORS[hash % COLORS.length];
}

interface UsePresenceArgs {
  projectId: string | null;
  userId: string | null;
  email: string | null;
  currentScreenId: string | null;
  activeTab: string | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

const SESSION_ID = Math.random().toString(36).slice(2, 11);

export function usePresence({ projectId, userId, email, currentScreenId, activeTab, gridRef }: UsePresenceArgs) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenIdRef = useRef(currentScreenId);
  const activeTabRef = useRef(activeTab);

  screenIdRef.current = currentScreenId;
  activeTabRef.current = activeTab;

  const isLocalUser = useCallback((p: any) => {
    return p.userId === userId && p.sessionId === SESSION_ID;
  }, [userId]);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !userId) return;
    if (cursorThrottleRef.current) return;
    cursorThrottleRef.current = setTimeout(() => {
      cursorThrottleRef.current = null;
    }, 50);

    channelRef.current.track({
      userId,
      sessionId: SESSION_ID,
      email,
      color: pickColor(userId),
      cursor: { x, y },
      currentScreenId: screenIdRef.current,
      activeTab: activeTabRef.current,
    });
  }, [userId, email]);

  // Re-track when screen or tab changes so others see the update immediately
  useEffect(() => {
    if (!channelRef.current || !userId) return;
    channelRef.current.track({
      userId,
      sessionId: SESSION_ID,
      email,
      color: pickColor(userId),
      cursor: null,
      currentScreenId,
      activeTab,
    });
  }, [currentScreenId, activeTab, userId, email]);

  useEffect(() => {
    if (!projectId || !userId) {
      console.log("[presence] skipping subscribe", { projectId, userId });
      return;
    }
    console.log("[presence] subscribing", { projectId, userId, email, SESSION_ID });

    const channel = supabase.channel(`presence-${projectId}`, {
      config: {
        presence: { key: SESSION_ID },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        console.log("[presence] sync", { state, keyCount: Object.keys(state).length });
        const users: PresenceUser[] = Object.values(state).flat().map((p: any) => ({
          userId: p.userId,
          sessionId: p.sessionId,
          email: p.email,
          color: p.color || pickColor(p.userId),
          cursor: p.cursor ?? null,
          currentScreenId: p.currentScreenId ?? null,
          activeTab: p.activeTab ?? null,
          isLocal: isLocalUser(p),
        }));
        console.log("[presence] users", users);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        console.log("[presence] channel status", status);
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            sessionId: SESSION_ID,
            email,
            color: pickColor(userId),
            cursor: null,
            currentScreenId: screenIdRef.current,
            activeTab: activeTabRef.current,
          });
        }
      });

    const handleLeave = () => {
      if (channelRef.current) channelRef.current.untrack();
    };
    window.addEventListener("beforeunload", handleLeave);

    return () => {
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [projectId, userId, email]);

  return { onlineUsers, updateCursor };
}
