'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { usePixelMap } from '@/contexts/pixel-map-context';
import type { Screen } from '@/contexts/pixel-map-types';
import { useToast } from '@/hooks/use-toast';
import {
  getCloudProject,
  getUserCloudProjectSummaries,
  updateCloudProject,
  type CloudProject,
  type CloudProjectSummary,
} from '@/lib/cloud-projects';
import { groupsFitScreen, replaceScreenWiring } from '@/lib/wiring-groups';

function screenHasWiring(screen: Screen): boolean {
  return screen.wiringGroups.length > 0 || screen.tiles.some(tile =>
    !!tile.dataCircuit || !!tile.powerCircuit || !!tile.powerPortLabel
  );
}

export function WiringCopyButton() {
  const { currentScreen } = usePixelMap();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={currentScreen.wiringGroups.length === 0}
        onClick={() => setIsOpen(true)}
      >
        Copy Groups To Another Screen
      </Button>
      {isOpen && <WiringCopyDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

function WiringCopyDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { currentScreen, activeProjectId, screens, replaceWiringGroupsOnScreen } = usePixelMap();
  const { toast } = useToast();

  const [projects, setProjects] = useState<CloudProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [destCloudProject, setDestCloudProject] = useState<CloudProject | null>(null);
  const [destScreens, setDestScreens] = useState<Screen[] | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserCloudProjectSummaries(user.id).then(({ data, error: loadError }) => {
      setProjects(data);
      setError(loadError);
      setIsLoading(false);
    });
  }, [user]);

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedScreenId('');
    setError(null);
    if (projectId === activeProjectId) {
      setDestCloudProject(null);
      setDestScreens(screens);
      return;
    }
    setIsLoading(true);
    const { data, error: loadError } = await getCloudProject(projectId);
    setIsLoading(false);
    if (!data) {
      setDestCloudProject(null);
      setDestScreens(null);
      setError(loadError ?? 'This project could not be loaded.');
      return;
    }
    setDestCloudProject(data);
    setDestScreens(data.projectData.screens);
  };

  const availableScreens = (destScreens ?? []).filter(screen =>
    !(selectedProjectId === activeProjectId && screen.id === currentScreen.id)
  );
  const destScreen = availableScreens.find(screen => screen.id === selectedScreenId) ?? null;
  const fits = destScreen ? groupsFitScreen(currentScreen.wiringGroups, destScreen) : false;

  const handleCopy = async () => {
    if (!destScreen || !fits) return;
    const copiedGroups = currentScreen.wiringGroups.map(group => ({ ...group, id: crypto.randomUUID() }));

    if (!destCloudProject) {
      replaceWiringGroupsOnScreen(destScreen.id, copiedGroups);
      toast({ title: 'Groups copied', description: `Wiring groups were copied to ${destScreen.name}.` });
      onClose();
      return;
    }

    setIsSaving(true);
    const projectData = {
      ...destCloudProject.projectData,
      screens: destCloudProject.projectData.screens.map(screen =>
        screen.id === destScreen.id ? replaceScreenWiring(screen, copiedGroups) : screen
      ),
    };
    const result = await updateCloudProject(destCloudProject.id, destCloudProject.projectName, projectData);
    setIsSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast({ title: 'Groups copied', description: `Wiring groups were copied to ${destScreen.name} in ${destCloudProject.projectName}.` });
    onClose();
  };

  const summary = `Copies ${currentScreen.wiringGroups.length} group${currentScreen.wiringGroups.length === 1 ? '' : 's'} from ${currentScreen.name}. That screen is not changed.`;

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Groups To Another Screen</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copy-project">Project</Label>
            <Select value={selectedProjectId} onValueChange={handleProjectChange} disabled={isLoading || isSaving}>
              <SelectTrigger id="copy-project"><SelectValue placeholder="Choose one of your projects" /></SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName}{project.id === activeProjectId ? ' (open)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {destScreens && (
            <div className="space-y-2">
              <Label htmlFor="copy-screen">Screen</Label>
              <Select value={selectedScreenId} onValueChange={setSelectedScreenId} disabled={isSaving}>
                <SelectTrigger id="copy-screen"><SelectValue placeholder="Choose a screen" /></SelectTrigger>
                <SelectContent>
                  {availableScreens.map(screen => (
                    <SelectItem key={screen.id} value={screen.id}>{screen.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {destScreen && !fits && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              The groups do not fit on {destScreen.name}. That screen is too small, so nothing was changed.
            </p>
          )}
          {destScreen && fits && screenHasWiring(destScreen) && (
            <p className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
              {destScreen.name} already has wiring. Replacing it removes its current circuits and labels.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleCopy} disabled={!destScreen || !fits || isSaving}>
            {destScreen && screenHasWiring(destScreen) ? 'Replace Wiring' : 'Copy Groups'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
