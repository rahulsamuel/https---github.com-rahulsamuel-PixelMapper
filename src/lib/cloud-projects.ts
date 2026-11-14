"use client";

import { supabase } from "@/lib/supabase/client";
import type { ProjectData, Screen } from "@/contexts/pixel-map-context";

export interface CloudProject {
  id: string;
  userId: string;
  projectName: string;
  projectData: ProjectData;
  createdAt: string;
  updatedAt: string;
}

const projectCache = new Map<string, CloudProject>();
let summaryCache: { userId: string; items: CloudProjectSummary[] } | null = null;

export function getCachedCloudProject(projectId: string): CloudProject | null {
  return projectCache.get(projectId) ?? null;
}

export function getCachedCloudProjectSummaries(userId: string): CloudProjectSummary[] | null {
  return summaryCache?.userId === userId ? summaryCache.items : null;
}

export async function saveCloudProject(
  userId: string,
  projectName: string,
  projectData: ProjectData
): Promise<{ success: boolean; projectId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .insert({
      user_id: userId,
      project_name: projectName,
      project_data: projectData,
    })
    .select("id")
    .single();

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { success: false, projectId: null, error: 'Something went wrong. Please try again.' };
  }
  return { success: true, projectId: data.id, error: null };
}

export async function storedScreensMatch(
  projectId: string,
  screens: Screen[]
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("project_data")
    .eq("id", projectId)
    .maybeSingle();
  if (error) return { ok: false, error: 'Something went wrong. Please try again.' };
  const storedScreens = (data?.project_data?.screens ?? []) as Screen[];
  if (storedScreens.length === 0) return { ok: true, error: null };
  const storedIds = new Set(storedScreens.map(s => s.id));
  if (screens.some(s => storedIds.has(s.id))) return { ok: true, error: null };
  console.warn('src/lib/cloud-projects.ts: blocked save, screens do not belong to project', projectId);
  return { ok: false, error: 'This save was blocked because the open screens do not belong to the selected project. Reload the project and try again.' };
}

export async function updateCloudProject(
  projectId: string,
  projectName: string,
  projectData: ProjectData
): Promise<{ success: boolean; error: string | null }> {
  const match = await storedScreensMatch(projectId, projectData.screens);
  if (!match.ok) return { success: false, error: match.error };
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("pixel_map_projects")
    .update({
      project_name: projectName,
      project_data: projectData,
      updated_at: updatedAt,
    })
    .eq("id", projectId);

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
  const cached = projectCache.get(projectId);
  if (cached) {
    projectCache.set(projectId, {
      ...cached,
      projectName,
      projectData,
      updatedAt: updatedAt,
    });
  }
  return { success: true, error: null };
}

export async function getUserCloudProjects(
  userId: string
): Promise<{ data: CloudProject[]; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { data: [], error: 'Something went wrong. Please try again.' };
  }

  return {
    data: data.map((p) => ({
      id: p.id,
      userId: p.user_id,
      projectName: p.project_name,
      projectData: p.project_data as ProjectData,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    error: null,
  };
}

export interface CloudProjectSummary {
  id: string;
  projectName: string;
  updatedAt: string;
}

export async function getUserCloudProjectSummaries(
  userId: string
): Promise<{ data: CloudProjectSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("id, project_name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { data: [], error: 'Something went wrong. Please try again.' };
  }

  const items = data.map((p) => ({
    id: p.id,
    projectName: p.project_name,
    updatedAt: p.updated_at,
  }));
  summaryCache = { userId, items };
  return { data: items, error: null };
}

export async function getCloudProject(
  projectId: string
): Promise<{ data: CloudProject | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { data: null, error: 'Something went wrong. Please try again.' };
  }
  if (!data) return { data: null, error: null };

  const project: CloudProject = {
    id: data.id,
    userId: data.user_id,
    projectName: data.project_name,
    projectData: data.project_data as ProjectData,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  projectCache.set(project.id, project);
  return { data: project, error: null };
}

export async function deleteCloudProject(
  projectId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("pixel_map_projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
  projectCache.delete(projectId);
  return { success: true, error: null };
}

export interface ProjectVersionSummary {
  id: string;
  projectName: string;
  createdAt: string;
}

export async function listProjectVersions(
  projectId: string
): Promise<{ data: ProjectVersionSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_project_versions")
    .select("id, project_name, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { data: [], error: 'Something went wrong. Please try again.' };
  }

  return {
    data: data.map((v) => ({
      id: v.id,
      projectName: v.project_name,
      createdAt: v.created_at,
    })),
    error: null,
  };
}

export async function getProjectVersionData(
  versionId: string
): Promise<{ data: ProjectData | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_project_versions")
    .select("project_data")
    .eq("id", versionId)
    .maybeSingle();

  if (error) {
    console.error('src/lib/cloud-projects.ts:', error.message);
    return { data: null, error: 'Something went wrong. Please try again.' };
  }
  if (!data) return { data: null, error: 'This version could not be found.' };
  return { data: data.project_data as ProjectData, error: null };
}
