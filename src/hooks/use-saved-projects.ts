"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserCloudProjects, type CloudProject } from "@/lib/cloud-projects";

export function useSavedProjects() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: loadError } = await getUserCloudProjects(userId);
    setProjects(data);
    setError(loadError);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) reload();
  }, [userId, reload]);

  return { signedIn: userId !== null, projects, loading, error, reload };
}
