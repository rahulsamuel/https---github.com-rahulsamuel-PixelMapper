"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Loader2, Check } from "lucide-react";
import type { PresenceUser } from "@/hooks/use-presence";

interface PresenceBarProps {
  onlineUsers: PresenceUser[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  onShareClick: () => void;
}

export function PresenceBar({ onlineUsers, isSyncing, lastSyncAt, onShareClick }: PresenceBarProps) {
  const remoteUsers = onlineUsers.filter((u) => !u.isLocal);
  const localUser = onlineUsers.find((u) => u.isLocal);

  return (
    <div className="flex items-center gap-2">
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
            <TooltipContent side="bottom" className="text-xs">{localUser.email} (You)</TooltipContent>
          </Tooltip>
        )}
        {remoteUsers.slice(0, 4).map((u) => (
          <Tooltip key={u.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-7 w-7 border-2 border-background" style={{ backgroundColor: u.color }}>
                  <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: u.color }}>
                    {u.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{u.email}</TooltipContent>
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
  );
}
