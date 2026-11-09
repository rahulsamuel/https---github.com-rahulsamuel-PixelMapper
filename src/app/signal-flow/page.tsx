"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SavedProjectPicker } from "@/components/calculator/saved-project-picker";
import { useSavedPixelMapSelection } from "@/hooks/use-saved-pixel-map-selection";
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
  type CableType,
} from "@/lib/signal-flow-types";
import {
  getSignalFlowDiagram,
  saveSignalFlowDiagram,
  type SignalFlowDiagram,
} from "@/lib/signal-flow-client";
import { downloadSignalFlow, type SignalFlowExportFormat, type SignalFlowExportMode } from "@/lib/signal-flow-download";
import { SignalFlowExportMenu, type SignalFlowExportJob } from "@/components/signal-flow/signal-flow-export-menu";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Trash2, Cable } from "lucide-react";

const EMPTY_DATA: SignalFlowData = {
  devices: [],
  connections: [],
  cableTypes: DEFAULT_CABLE_TYPES,
};

export default function SignalFlowPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { signedIn, summaries, listLoading, listError, activeProjectId, activeProject, projectError, selectProject } = useSavedPixelMapSelection();
  const [diagram, setDiagram] = useState<SignalFlowDiagram | null>(null);
  const [diagramData, setDiagramData] = useState<SignalFlowData>(EMPTY_DATA);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState<SignalFlowExportJob | null>(null);
  const exportSurfaceRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load cable types from database (admin-managed) once on mount
  const [dbCableTypes, setDbCableTypes] = useState<CableType[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("signal_flow_cable_types")
          .select("slug, name, color, is_active, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setDbCableTypes(
            (data as Record<string, unknown>[]).map((row) => ({
              id: row.slug as string,
              name: row.name as string,
              color: row.color as string,
            }))
          );
        }
      } catch {
        // fallback to defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Merge DB cable types into diagramData whenever they load
  useEffect(() => {
    if (!dbCableTypes) return;
    setDiagramData((prev) =>
      prev.cableTypes === DEFAULT_CABLE_TYPES || prev.cableTypes.length === 0
        ? { ...prev, cableTypes: dbCableTypes }
        : prev
    );
  }, [dbCableTypes]);

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
        cableTypes: dbCableTypes ?? (dd.cableTypes?.length ? dd.cableTypes : DEFAULT_CABLE_TYPES),
      });
      lastSavedRef.current = JSON.stringify(dd);
    } else {
      setDiagram(null);
      setDiagramData(EMPTY_DATA);
      lastSavedRef.current = JSON.stringify(EMPTY_DATA);
    }
    setDirty(false);
  }, [toast, dbCableTypes]);

  const handleSelectProject = async (projectId: string | null) => {
    setDiagram(null);
    setDirty(false);
    const project = await selectProject(projectId);
    if (projectId && project) loadDiagram(projectId);
  };

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !activeProjectId) return;
    restoredRef.current = true;
    loadDiagram(activeProjectId);
  }, [activeProjectId, loadDiagram]);

  const handleDataChange = (newData: SignalFlowData) => {
    setDiagramData(newData);
    if (JSON.stringify(newData) !== lastSavedRef.current) {
      setDirty(true);
    }
  };

  const handleSave = async () => {
    if (!user || !activeProject) return;
    setSaving(true);
    const { success, error } = await saveSignalFlowDiagram(
      activeProject.id,
      user.id,
      `${activeProject.projectName} — Signal Flow`,
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
      // Fetch the diagram id without toggling loadingDiagram (avoids blanking canvas)
      const { data: fresh } = await getSignalFlowDiagram(activeProject.id);
      if (fresh) setDiagram(fresh);
    }
  };

  const handleClear = () => {
    setDiagramData(EMPTY_DATA);
    setDirty(true);
  };

  // Auto-save on unmount / page leave if dirty
  useEffect(() => {
    const handler = () => {
      if (dirty && user && activeProject) {
        saveSignalFlowDiagram(
          activeProject.id,
          user.id,
          `${activeProject.projectName} — Signal Flow`,
          diagramData,
          diagram?.id
        );
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, user, activeProject, diagramData, diagram]);

  const exportTitle = activeProject?.projectName ?? "Signal Flow Diagram";

  const handleExport = async (format: SignalFlowExportFormat, mode: SignalFlowExportMode) => {
    if (!exportSurfaceRef.current) return;
    setExporting({ format, mode });
    try {
      await downloadSignalFlow(format, mode, exportSurfaceRef.current, exportTitle);
    } catch {
      toast({ title: "Export failed", description: `Could not generate the ${format.toUpperCase()} export.`, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex h-[calc(100svh-3.5rem)] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0 border-b bg-background px-3 py-2 flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Unsaved changes
            </span>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cable className="h-3.5 w-3.5" />
            <span>{diagramData.devices.length} devices · {diagramData.connections.length} cables</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <SignalFlowExportMenu
              disabled={diagramData.devices.length === 0 || exporting !== null}
              exporting={exporting}
              onExport={handleExport}
            />
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
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <SignalFlowCanvas
            data={diagramData}
            onChange={handleDataChange}
            exportRef={exportSurfaceRef}
            loading={loadingDiagram}
            projectPicker={
              <SavedProjectPicker
                signedIn={signedIn}
                projects={summaries}
                projectsLoading={listLoading}
                projectsError={listError ?? projectError}
                activeProject={activeProject}
                showScreens={false}
                activeScreenId={null}
                saveAvailable={activeProject !== null}
                screenNotice={null}
                hasUnsavedChanges={dirty}
                saving={saving}
                saveError={null}
                onSelectProject={handleSelectProject}
                onSave={handleSave}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
