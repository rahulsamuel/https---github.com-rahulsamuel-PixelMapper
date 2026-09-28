"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SignalFlowCanvas } from "@/components/signal-flow/signal-flow-canvas";
import {
  DEFAULT_CABLE_TYPES,
  type SignalFlowData,
} from "@/lib/signal-flow-types";
import {
  getSignalFlowDiagram,
  saveSignalFlowDiagram,
  type SignalFlowDiagram,
} from "@/lib/signal-flow-client";
import { getOwnedProjects, getSharedProjects, type SharedProject } from "@/lib/collaboration";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  ChevronDown,
  Loader2,
  Plus,
  Users,
  Crown,
  Save,
  Download,
  Trash2,
  Cable,
} from "lucide-react";

const EMPTY_DATA: SignalFlowData = {
  devices: [],
  connections: [],
  cableTypes: DEFAULT_CABLE_TYPES,
};

export default function SignalFlowPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ownedProjects, setOwnedProjects] = useState<SharedProject[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SharedProject | null>(null);
  const [diagram, setDiagram] = useState<SignalFlowDiagram | null>(null);
  const [diagramData, setDiagramData] = useState<SignalFlowData>(EMPTY_DATA);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lastSavedRef = useRef<string>("");

  // Load project lists
  const loadProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    const [ownedRes, sharedRes] = await Promise.all([
      getOwnedProjects(user.id),
      getSharedProjects(user.id),
    ]);
    setIsLoadingProjects(false);
    if (ownedRes.data) setOwnedProjects(ownedRes.data);
    if (sharedRes.data) setSharedProjects(sharedRes.data);
  }, [user]);

  useEffect(() => {
    if (projectPickerOpen) loadProjects();
  }, [projectPickerOpen, loadProjects]);

  // Load diagram when project is selected
  const loadDiagram = useCallback(async (projectId: string) => {
    setLoadingDiagram(true);
    const { data, error } = await getSignalFlowDiagram(projectId);
    setLoadingDiagram(false);
    if (error) {
      toast({ title: "Error loading diagram", description: error, variant: "destructive" });
      return;
    }
    if (data) {
      setDiagram(data);
      const dd = data.diagramData?.devices ? data.diagramData : EMPTY_DATA;
      setDiagramData({
        ...dd,
        cableTypes: dd.cableTypes?.length ? dd.cableTypes : DEFAULT_CABLE_TYPES,
      });
      lastSavedRef.current = JSON.stringify(dd);
    } else {
      setDiagram(null);
      setDiagramData(EMPTY_DATA);
      lastSavedRef.current = JSON.stringify(EMPTY_DATA);
    }
    setDirty(false);
  }, [toast]);

  const handleSelectProject = (project: SharedProject) => {
    setSelectedProject(project);
    setProjectPickerOpen(false);
    loadDiagram(project.id);
  };

  const handleDataChange = (newData: SignalFlowData) => {
    setDiagramData(newData);
    if (JSON.stringify(newData) !== lastSavedRef.current) {
      setDirty(true);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedProject) return;
    setSaving(true);
    const { success, error } = await saveSignalFlowDiagram(
      selectedProject.id,
      user.id,
      `${selectedProject.projectName} — Signal Flow`,
      diagramData,
      diagram?.id
    );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error, variant: "destructive" });
      return;
    }
    if (success) {
      toast({ title: "Saved", description: "Signal flow diagram saved to cloud." });
      setDirty(false);
      lastSavedRef.current = JSON.stringify(diagramData);
      // Refresh diagram id
      loadDiagram(selectedProject.id);
    }
  };

  const handleClear = () => {
    setDiagramData(EMPTY_DATA);
    setDirty(true);
  };

  // Auto-save on unmount / page leave if dirty
  useEffect(() => {
    const handler = () => {
      if (dirty && user && selectedProject) {
        saveSignalFlowDiagram(
          selectedProject.id,
          user.id,
          `${selectedProject.projectName} — Signal Flow`,
          diagramData,
          diagram?.id
        );
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, user, selectedProject, diagramData, diagram]);

  const canEdit = selectedProject?.isOwner ?? true;

  if (!user) {
    return (
      <div className="h-[calc(100svh-3.5rem)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Cable className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">Please sign in to use Signal Flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b bg-background px-3 py-2 flex items-center gap-3">
        {/* Project picker */}
        <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 max-w-[240px]">
              <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selectedProject ? selectedProject.projectName : "Select Project"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-semibold">Projects</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                </div>
              ) : (
                <>
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
                            isActive={p.id === selectedProject?.id}
                            onClick={() => handleSelectProject(p)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
                            isActive={p.id === selectedProject?.id}
                            onClick={() => handleSelectProject(p)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {ownedProjects.length === 0 && sharedProjects.length === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">No saved projects yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a project in Pixel Map first.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {selectedProject && (
          <>
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Unsaved changes
              </span>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-1">
              <Cable className="h-3.5 w-3.5" />
              <span>{diagramData.devices.length} devices · {diagramData.connections.length} cables</span>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {selectedProject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving || !canEdit}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={diagramData.devices.length === 0}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all devices?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all devices and cables from the canvas. Save first if you want to keep the current state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Canvas or empty state */}
      {selectedProject ? (
        loadingDiagram ? (
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SignalFlowCanvas
            data={diagramData}
            onChange={handleDataChange}
            onSave={handleSave}
            saving={saving}
          />
        )
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center space-y-3">
            <Cable className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground text-sm">Select a project from the dropdown to start drawing a signal flow.</p>
            <p className="text-muted-foreground/60 text-xs">Your signal flow is saved per project.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  isActive,
  onClick,
}: {
  project: SharedProject;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-md px-2 py-2 text-left transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
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
    </button>
  );
}
