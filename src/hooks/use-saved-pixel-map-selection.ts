"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { fetchTabIdentifiers, type TabIdentifiers } from "@/lib/project-tab-identifiers";
import {
  getCachedCloudProject,
  getCachedCloudProjectSummaries,
  getCloudProject,
  getUserCloudProjectSummaries,
  type CloudProject,
  type CloudProjectSummary,
} from "@/lib/cloud-projects";

export const SELECTED_PROJECT_STORAGE_KEY = "saved-pixel-map:projectId";
export const SELECTED_SCREEN_STORAGE_KEY = "saved-pixel-map:screenId";

export function readStoredSelection(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

export function writeStoredSelection(key: string, value: string | null) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useSavedPixelMapSelection() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [activeProjectId, setActiveProjectId] = usePersistentState<string | null>(SELECTED_PROJECT_STORAGE_KEY, null);
  const [activeScreenId, setActiveScreenId] = usePersistentState<string | null>(SELECTED_SCREEN_STORAGE_KEY, null);

  const [summaries, setSummaries] = useState<CloudProjectSummary[]>(() =>
    (userId && getCachedCloudProjectSummaries(userId)) || []
  );
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [activeProject, setActiveProject] = useState<CloudProject | null>(() =>
    activeProjectId ? getCachedCloudProject(activeProjectId) : null
  );
  const [projectError, setProjectError] = useState<string | null>(null);
  const [tabIdentifiers, setTabIdentifiers] = useState<TabIdentifiers>({});

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    if (!getCachedCloudProjectSummaries(userId)) setListLoading(true);
    getUserCloudProjectSummaries(userId).then(({ data, error }) => {
      if (stale) return;
      setSummaries(data);
      setListError(error);
      setListLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !activeProjectId) return;
    let stale = false;
    getCloudProject(activeProjectId).then((result) => {
      if (stale) return;
      if (result.error) {
        setProjectError(result.error);
        return;
      }
      if (!result.data) {
        setActiveProjectId(null);
        setActiveScreenId(null);
        setActiveProject(null);
        return;
      }
      const fresh = result.data;
      setActiveProject((prev) =>
        prev?.id === fresh.id && prev.updatedAt === fresh.updatedAt ? prev : fresh
      );
    });
    return () => {
      stale = true;
    };
  }, [userId, activeProjectId, setActiveProjectId, setActiveScreenId]);

  useEffect(() => {
    if (!userId || !activeProjectId) {
      setTabIdentifiers({});
      return;
    }
    let stale = false;
    fetchTabIdentifiers(activeProjectId).then(({ data }) => {
      if (!stale && data) setTabIdentifiers(data);
    });
    return () => {
      stale = true;
    };
  }, [userId, activeProjectId]);

  const selectProject = useCallback(
    async (projectId: string | null): Promise<CloudProject | null> => {
      setProjectError(null);
      if (!projectId) {
        setActiveProjectId(null);
        setActiveScreenId(null);
        setActiveProject(null);
        return null;
      }
      const result = await getCloudProject(projectId);
      if (result.error) {
        setProjectError(result.error);
        return null;
      }
      if (!result.data) {
        setProjectError("This project no longer exists.");
        return null;
      }
      setActiveProjectId(projectId);
      setActiveProject(result.data);
      setActiveScreenId(null);
      return result.data;
    },
    [setActiveProjectId, setActiveScreenId]
  );

  const refreshActiveProject = useCallback(async () => {
    if (!activeProjectId) return;
    const result = await getCloudProject(activeProjectId);
    if (result.error) {
      setProjectError(result.error);
      return;
    }
    if (result.data) setActiveProject(result.data);
    const identifiers = await fetchTabIdentifiers(activeProjectId);
    if (identifiers.data) setTabIdentifiers(identifiers.data);
  }, [activeProjectId]);

  return {
    signedIn: userId !== null,
    summaries,
    listLoading,
    listError,
    activeProjectId,
    activeProject,
    projectError,
    activeScreenId,
    tabIdentifiers,
    selectProject,
    selectScreen: setActiveScreenId,
    refreshActiveProject,
  };
}
