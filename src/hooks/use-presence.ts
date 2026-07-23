"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface PresenceUser {
  userId: string;
  email: string;
  color: string;
  cursor: { x: number; y: number } | null;
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
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function usePresence({ projectId, userId, email, gridRef }: UsePresenceArgs) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !userId) return;
    if (cursorThrottleRef.current) return;
    cursorThrottleRef.current = setTimeout(() => {
      cursorThrottleRef.current = null;
    }, 50);

    channelRef.current.track({
      userId,
      email,
      color: pickColor(userId),
      cursor: { x, y },
    });
  }, [userId, email]);

  useEffect(() => {
    if (!projectId || !userId) return;

    const channel = supabase.channel(`presence-${projectId}`, {
      config: {
        presence: { key: userId },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = Object.values(state).flat().map((p: any) => ({
          userId: p.userId,
          email: p.email,
          color: p.color || pickColor(p.userId),
          cursor: p.cursor ?? null,
          isLocal: p.userId === userId,
        }));
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            email,
            color: pickColor(userId),
            cursor: null,
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
