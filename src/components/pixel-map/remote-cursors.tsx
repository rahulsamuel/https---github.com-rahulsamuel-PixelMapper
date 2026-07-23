"use client";

import type { PresenceUser } from "@/hooks/use-presence";

interface RemoteCursorsProps {
  onlineUsers: PresenceUser[];
}

export function RemoteCursors({ onlineUsers }: RemoteCursorsProps) {
  const remoteUsers = onlineUsers.filter((u) => !u.isLocal && u.cursor);

  if (remoteUsers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {remoteUsers.map((u) => {
        if (!u.cursor) return null;
        return (
          <div
            key={u.userId}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              left: `${u.cursor.x}px`,
              top: `${u.cursor.y}px`,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-md"
              style={{ color: u.color }}
            >
              <path
                d="M5.5 3.21V20.79c0 .45.54.67.85.31l4.86-5.22c.16-.17.38-.27.61-.27h5.87c.45 0 .67-.54.31-.85L6.16 2.9c-.31-.31-.85-.09-.85.31z"
                fill="currentColor"
              />
            </svg>
            <div
              className="absolute top-4 left-3 px-1.5 py-0.5 rounded text-[10px] text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: u.color }}
            >
              {u.email?.split("@")[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
