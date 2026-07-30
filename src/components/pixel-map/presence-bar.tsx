"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Users, Loader2, Check } from "lucide-react";
import type { PresenceUser } from "@/hooks/use-presence";

interface PresenceBarProps {
  onlineUsers: PresenceUser[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  onShareClick: () => void;
  currentScreenId: string | null;
  screens: { id: string; name: string }[];
}

export function PresenceBar({ onlineUsers, isSyncing, lastSyncAt, onShareClick, currentScreenId, screens }: PresenceBarProps) {
  const remoteUsers = onlineUsers.filter((u) => !u.isLocal);
  const localUser = onlineUsers.find((u) => u.isLocal);

  const sameScreenUsers = remoteUsers.filter((u) => u.currentScreenId === currentScreenId);
  const screenName = (id: string | null) => screens.find((s) => s.id === id)?.name ?? "Unknown";

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex items-center gap-2">
      {/* Same-screen collision warning */}
      {sameScreenUsers.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden sm:inline">{sameScreenUsers.length} other{sameScreenUsers.length > 1 ? "s" : ""} on this screen</span>
              <span className="sm:hidden">{sameScreenUsers.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {sameScreenUsers.map((u) => (
              <div key={u.sessionId}>{u.email} is also viewing &ldquo;{screenName(u.currentScreenId)}&rdquo;</div>
            ))}
            <div className="mt-1 text-muted-foreground">Coordinate to avoid overwriting each other&apos;s changes.</div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Sync indicator */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
        {isSyncing ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Syncing…</span>
          </>
        ) : lastSyncAt ? (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span>Saved</span>
          </>
        ) : null}
      </div>

      {/* Online avatars */}
      <div className="flex items-center -space-x-2">
        {localUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-7 w-7 border-2 border-background" style={{ backgroundColor: localUser.color }}>
                  <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: localUser.color }}>
                    {localUser.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{localUser.email} (You) &middot; {screenName(localUser.currentScreenId)}</TooltipContent>
          </Tooltip>
        )}
        {remoteUsers.slice(0, 4).map((u) => (
          <Tooltip key={u.sessionId}>
            <TooltipTrigger asChild>
              <div className="relative" style={{ outlineWidth: 2, outlineStyle: "solid", outlineColor: u.currentScreenId === currentScreenId ? "rgb(245 158 11 / 0.5)" : "transparent", outlineOffset: 1 }}>
                <Avatar className="h-7 w-7 border-2 border-background" style={{ backgroundColor: u.color }}>
                  <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: u.color }}>
                    {u.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{u.email} &middot; {screenName(u.currentScreenId)}</TooltipContent>
          </Tooltip>
        ))}
        {remoteUsers.length > 4 && (
          <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
            +{remoteUsers.length - 4}
          </div>
        )}
      </div>

      {/* Share button */}
      <Button variant="outline" size="sm" onClick={onShareClick} className="h-7 gap-1.5">
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs">Share</span>
      </Button>
    </div>
    </TooltipProvider>
  );
}
