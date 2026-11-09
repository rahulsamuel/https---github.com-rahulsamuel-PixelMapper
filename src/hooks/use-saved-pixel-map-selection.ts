"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePersistentState } from "@/hooks/use-persistent-state";
import {
  getCloudProject,
  getUserCloudProjectSummaries,
  type CloudProject,
  type CloudProjectSummary,
} from "@/lib/cloud-projects";

export function useSavedPixelMapSelection(storageKey: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [summaries, setSummaries] = useState<CloudProjectSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [activeProjectId, setActiveProjectId] = usePersistentState<string | null>(`${storageKey}:projectId`, null);
  const [activeScreenId, setActiveScreenId] = usePersistentState<string | null>(`${storageKey}:screenId`, null);
  const [activeProject, setActiveProject] = useState<CloudProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const latestProjectRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setListLoading(true);
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

  const loadProject = useCallback(async (projectId: string) => {
    latestProjectRequestRef.current = projectId;
    setProjectLoading(true);
    const result = await getCloudProject(projectId);
    if (latestProjectRequestRef.current !== projectId) return null;
    setProjectLoading(false);
    return result;
  }, []);

  useEffect(() => {
    if (!userId || !activeProjectId || activeProject?.id === activeProjectId) return;
    let stale = false;
    loadProject(activeProjectId).then((result) => {
      if (!result || stale) return;
      if (result.error) {
        setProjectError(result.error);
        return;
      }
      if (!result.data) {
        setActiveProjectId(null);
        setActiveScreenId(null);
        return;
      }
      setActiveProject(result.data);
    });
    return () => {
      stale = true;
    };
  }, [userId, activeProjectId, activeProject?.id, loadProject, setActiveProjectId, setActiveScreenId]);

  const selectProject = useCallback(
    async (projectId: string | null): Promise<CloudProject | null> => {
      setProjectError(null);
      if (!projectId) {
        setActiveProjectId(null);
        setActiveScreenId(null);
        setActiveProject(null);
        return null;
      }
      const result = await loadProject(projectId);
      if (!result) return null;
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
    [loadProject, setActiveProjectId, setActiveScreenId]
  );

  const refreshActiveProject = useCallback(async () => {
    if (!activeProjectId) return;
    const result = await loadProject(activeProjectId);
    if (!result) return;
    if (result.error) {
      setProjectError(result.error);
      return;
    }
    if (result.data) setActiveProject(result.data);
  }, [activeProjectId, loadProject]);

  return {
    signedIn: userId !== null,
    summaries,
    listLoading,
    listError,
    activeProject,
    projectLoading,
    projectError,
    activeScreenId,
    selectProject,
    selectScreen: setActiveScreenId,
    refreshActiveProject,
  };
}
