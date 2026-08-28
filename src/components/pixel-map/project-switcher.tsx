"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ChevronDown, Loader2, Plus, Users, Crown } from "lucide-react";
import { getOwnedProjects, getSharedProjects, type SharedProject } from "@/lib/collaboration";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface ProjectSwitcherProps {
  activeProjectId: string | null;
  currentProjectName: string;
  onSwitchProject: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectSwitcher({
  activeProjectId,
  currentProjectName,
  onSwitchProject,
  onNewProject,
}: ProjectSwitcherProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ownedProjects, setOwnedProjects] = useState<SharedProject[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [ownedRes, sharedRes] = await Promise.all([
      getOwnedProjects(user.id),
      getSharedProjects(user.id),
    ]);
    setIsLoading(false);
    if (ownedRes.data) setOwnedProjects(ownedRes.data);
    if (sharedRes.data) setSharedProjects(sharedRes.data);
  }, [user]);

  useEffect(() => {
    if (open) loadProjects();
  }, [open, loadProjects]);

  const handleSwitch = async (projectId: string) => {
    setSwitchingTo(projectId);
    await onSwitchProject(projectId);
    setSwitchingTo(null);
    setOpen(false);
  };

  const displayName = currentProjectName || "Untitled Project";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 max-w-[200px] px-2"
        >
          <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{displayName}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Projects</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              setOpen(false);
              onNewProject();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="p-2">
              {/* My Projects */}
              {ownedProjects.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Crown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      My Projects
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {ownedProjects.map((p) => (
                      <ProjectRow
                        key={p.id}
                        project={p}
                        isActive={p.id === activeProjectId}
                        isSwitching={switchingTo === p.id}
                        onClick={() => handleSwitch(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Shared with me */}
              {sharedProjects.length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Shared with Me
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {sharedProjects.map((p) => (
                      <ProjectRow
                        key={p.id}
                        project={p}
                        isActive={p.id === activeProjectId}
                        isSwitching={switchingTo === p.id}
                        onClick={() => handleSwitch(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {ownedProjects.length === 0 && sharedProjects.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No saved projects yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the Project panel to save your work.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProjectRow({
  project,
  isActive,
  isSwitching,
  onClick,
}: {
  project: SharedProject;
  isActive: boolean;
  isSwitching: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isSwitching}
      className={cn(
        "w-full flex items-center justify-between rounded-md px-2 py-2 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-foreground",
        isSwitching && "opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{project.projectName}</p>
        {!project.isOwner && (
          <p className="text-xs text-muted-foreground truncate">
            Shared by {project.ownerEmail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
        {project.isOwner ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Owner
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-300">
            Shared
          </Badge>
        )}
      </div>
    </button>
  );
}
