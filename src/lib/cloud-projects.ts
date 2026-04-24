"use client";

import { supabase } from "@/lib/supabase/client";
import type { ProjectData } from "@/contexts/pixel-map-context";

export interface CloudProject {
  id: string;
  userId: string;
  projectName: string;
  projectData: ProjectData;
  createdAt: string;
  updatedAt: string;
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

  if (error) return { success: false, projectId: null, error: error.message };
  return { success: true, projectId: data.id, error: null };
}

export async function updateCloudProject(
  projectId: string,
  projectName: string,
  projectData: ProjectData
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("pixel_map_projects")
    .update({
      project_name: projectName,
      project_data: projectData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };
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

  if (error) return { data: [], error: error.message };

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

export async function deleteCloudProject(
  projectId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("pixel_map_projects")
    .delete()
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
