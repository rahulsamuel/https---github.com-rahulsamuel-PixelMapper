
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Upload,
  Cloud,
  CloudUpload,
  FolderOpen,
  Trash2,
  LogIn,
  Loader2,
  Clock,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  saveCloudProject,
  getUserCloudProjects,
  deleteCloudProject,
  type CloudProject,
} from "@/lib/cloud-projects";

export function PixelMapActions() {
  const { exportProject, importProject, getProjectData, loadProjectData } = usePixelMap();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState("Untitled Project");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [projectToLoad, setProjectToLoad] = useState<CloudProject | null>(null);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);

  const loadUserProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    const { data, error } = await getUserCloudProjects(user.id);
    setIsLoadingProjects(false);
    if (error) {
      toast({ title: "Error", description: "Could not load your projects.", variant: "destructive" });
      return;
    }
    setCloudProjects(data);
  }, [user, toast]);

  useEffect(() => {
    if (user && showProjectsDialog) {
      loadUserProjects();
    }
  }, [user, showProjectsDialog, loadUserProjects]);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importProject(file);
    e.target.value = "";
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      setShowLoginWarning(true);
      return;
    }
    setIsSaving(true);
    const projectData = getProjectData();
    const { success, error } = await saveCloudProject(user.id, projectName, projectData);
    setIsSaving(false);
    if (!success) {
      toast({ title: "Save Failed", description: error ?? "Unknown error.", variant: "destructive" });
      return;
    }
    toast({ title: "Saved to Cloud", description: `"${projectName}" saved successfully.` });
    if (showProjectsDialog) loadUserProjects();
  };

  const handleOpenProjects = async () => {
    setShowProjectsDialog(true);
  };

  const handleLoadProject = (project: CloudProject) => {
    setProjectToLoad(project);
    setShowLoadConfirm(true);
  };

  const confirmLoadProject = () => {
    if (!projectToLoad) return;
    loadProjectData(projectToLoad.projectData);
    setProjectName(projectToLoad.projectName);
    setShowLoadConfirm(false);
    setShowProjectsDialog(false);
    setProjectToLoad(null);
    toast({ title: "Project Loaded", description: `"${projectToLoad.projectName}" has been loaded.` });
  };

  const handleDeleteProject = async (projectId: string) => {
    const { success, error } = await deleteCloudProject(projectId);
    if (!success) {
      toast({ title: "Delete Failed", description: error ?? "Unknown error.", variant: "destructive" });
      return;
    }
    setCloudProjects((prev) => prev.filter((p) => p.id !== projectId));
    toast({ title: "Project Deleted" });
    setShowDeleteConfirm(null);
  };

  const handleLoginRedirect = () => {
    setShowLoginWarning(false);
    router.push("/login");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Local export / import */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportProject} variant="outline" size="sm">
          <Download className="mr-2 h-3.5 w-3.5" />
          Export
        </Button>
        <Button onClick={handleImportClick} variant="outline" size="sm">
          <Upload className="mr-2 h-3.5 w-3.5" />
          Import
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFileChange}
          />
        </Button>
      </div>

      {/* Cloud section */}
      <div className="border rounded-lg p-3 space-y-2.5 bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Cloud className="h-3.5 w-3.5" />
          Cloud Save
          {user && <span className="ml-auto text-xs font-normal normal-case text-green-500">Logged in</span>}
        </div>

        {user && (
          <div className="space-y-1.5">
            <Label htmlFor="cloud-project-name" className="text-xs text-muted-foreground">Project name</Label>
            <Input
              id="cloud-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-8 text-sm"
              placeholder="Enter project name"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSaveToCloud}
            disabled={isSaving}
            size="sm"
            className="w-full"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CloudUpload className="mr-2 h-3.5 w-3.5" />
            )}
            {user ? "Save to Cloud" : "Save to Cloud"}
          </Button>

          <Button
            onClick={handleOpenProjects}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!user}
          >
            <FolderOpen className="mr-2 h-3.5 w-3.5" />
            My Projects
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            <button
              onClick={() => setShowLoginWarning(true)}
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              Log in
            </button>{" "}
            to save projects to the cloud.
          </p>
        )}
      </div>

      {/* Login warning dialog */}
      <AlertDialog open={showLoginWarning} onOpenChange={setShowLoginWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You need to be logged in to save projects to the cloud.
              </span>
              <span className="block font-semibold text-destructive">
                Warning: If you leave this page without exporting, your current work will be lost.
              </span>
              <span className="block">
                Export your project first, then log in and come back to save it to the cloud.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={exportProject}>
              <Download className="mr-2 h-4 w-4" />
              Export First
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cloud projects dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              My Cloud Projects
            </DialogTitle>
            <DialogDescription>
              Select a project to load it into the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-1">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading projects…
              </div>
            ) : cloudProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No saved projects yet. Save your first project above.
              </div>
            ) : (
              cloudProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 hover:bg-muted/40 transition-colors group"
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => handleLoadProject(project)}
                  >
                    <p className="text-sm font-medium leading-tight">{project.projectName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                      <span className="ml-1">
                        · {project.projectData.screens?.length ?? 1} screen{(project.projectData.screens?.length ?? 1) !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(project.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load confirmation */}
      <AlertDialog open={showLoadConfirm} onOpenChange={setShowLoadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load project?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading "{projectToLoad?.projectName}" will replace your current work. Any unsaved changes will be lost. Export first if you want to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={exportProject}>
              <Download className="mr-2 h-4 w-4" />
              Export Current
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLoadProject}>
              Load Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!showDeleteConfirm}
        onOpenChange={(o) => !o && setShowDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project will be permanently deleted from the cloud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => showDeleteConfirm && handleDeleteProject(showDeleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
