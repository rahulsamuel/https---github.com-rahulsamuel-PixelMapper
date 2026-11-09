'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CloudProject, CloudProjectSummary } from '@/lib/cloud-projects';
import type { Screen } from '@/contexts/pixel-map-types';

const MANUAL_VALUE = '__manual__';

interface SavedProjectPickerProps {
  signedIn: boolean;
  projects: CloudProjectSummary[];
  projectsLoading: boolean;
  projectsError: string | null;
  activeProject: CloudProject | null;
  showScreens?: boolean;
  activeScreenId: string | null;
  saveAvailable: boolean;
  screenNotice?: string | null;
  hasUnsavedChanges: boolean;
  saving: boolean;
  saveError: string | null;
  onSelectProject: (projectId: string | null) => void;
  onSelectScreen?: (screenId: string) => void;
  onSave: () => void;
}

export function SavedProjectPicker({
  signedIn,
  projects,
  projectsLoading,
  projectsError,
  activeProject,
  showScreens = true,
  activeScreenId,
  saveAvailable,
  screenNotice,
  hasUnsavedChanges,
  saving,
  saveError,
  onSelectProject,
  onSelectScreen,
  onSave,
}: SavedProjectPickerProps) {
  if (!signedIn) {
    return (
      <div className="space-y-2">
        <Label>Saved Pixel Map Project</Label>
        <p className="text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">Sign in</Link> to load projects saved in the Pixel Map.
        </p>
      </div>
    );
  }

  const screens: Screen[] = activeProject?.projectData.screens ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Saved Pixel Map Project</Label>
        <Select
          value={activeProject ? activeProject.id : MANUAL_VALUE}
          onValueChange={(value) => onSelectProject(value === MANUAL_VALUE ? null : value)}
          disabled={projectsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Choose a project'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MANUAL_VALUE}>Manual entry</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.projectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projectsError && <p className="text-xs text-destructive">{projectsError}</p>}
        {!projectsLoading && !projectsError && projects.length === 0 && (
          <p className="text-xs text-muted-foreground">No saved Pixel Map projects yet.</p>
        )}
      </div>

      {activeProject && showScreens && (
        <div className="space-y-2">
          <Label>Screen</Label>
          {screens.length === 0 ? (
            <p className="text-xs text-muted-foreground">This project has no screens yet.</p>
          ) : (
            <Select value={activeScreenId ?? undefined} onValueChange={onSelectScreen}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a screen" />
              </SelectTrigger>
              <SelectContent>
                {screens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {screenNotice && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground">{screenNotice}</p>
      )}

      {saveAvailable && (
        <div className="space-y-2">
          <Button
            className="w-full"
            size="sm"
            variant={hasUnsavedChanges ? 'default' : 'outline'}
            disabled={!hasUnsavedChanges || saving}
            onClick={onSave}
          >
            {saving ? 'Saving...' : 'Save to Pixel Map Project'}
          </Button>
          {hasUnsavedChanges ? (
            <p className="text-xs text-muted-foreground">Changes are only kept here until you save them.</p>
          ) : (
            <p className="text-xs text-muted-foreground">Everything matches the saved project.</p>
          )}
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
      )}
    </div>
  );
}
