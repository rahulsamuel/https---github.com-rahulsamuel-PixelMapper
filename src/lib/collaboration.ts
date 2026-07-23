"use client";

import { supabase } from "@/lib/supabase/client";

export interface Collaborator {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
}

export interface SharedProject {
  id: string;
  projectName: string;
  ownerEmail: string;
  updatedAt: string;
  isOwner: boolean;
}

export async function inviteCollaborator(
  projectId: string,
  email: string
): Promise<{ success: boolean; error: string | null }> {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (userError) return { success: false, error: userError.message };
  if (!userData) return { success: false, error: "No user found with that email." };

  const { error } = await supabase
    .from("project_collaborators")
    .insert({ project_id: projectId, user_id: userData.id });

  if (error) {
    if (error.code === "23505") return { success: false, error: "User is already a collaborator." };
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

export async function removeCollaborator(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("project_collaborators")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function getCollaborators(
  projectId: string
): Promise<{ data: Collaborator[]; error: string | null }> {
  const { data, error } = await supabase
    .from("project_collaborators")
    .select(`
      id,
      user_id,
      role,
      users!inner (email, full_name)
    `)
    .eq("project_id", projectId);

  if (error) return { data: [], error: error.message };

  return {
    data: data.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      email: c.users.email,
      fullName: c.users.full_name,
      role: c.role,
    })),
    error: null,
  };
}

export async function getProjectOwner(
  projectId: string
): Promise<{ email: string | null; userId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("user_id, users!inner (email)")
    .eq("id", projectId)
    .maybeSingle();

  if (error) return { email: null, userId: null, error: error.message };
  if (!data) return { email: null, userId: null, error: "Project not found." };

  return { email: (data.users as any).email, userId: data.user_id, error: null };
}

export async function getSharedProjects(
  userId: string
): Promise<{ data: SharedProject[]; error: string | null }> {
  const { data: collabData, error: collabError } = await supabase
    .from("project_collaborators")
    .select(`
      project_id,
      pixel_map_projects!inner (
        id,
        project_name,
        updated_at,
        user_id,
        users!inner (email)
      )
    `)
    .eq("user_id", userId);

  if (collabError) return { data: [], error: collabError.message };

  return {
    data: (collabData as any[]).map((c) => {
      const p = c.pixel_map_projects;
      return {
        id: p.id,
        projectName: p.project_name,
        ownerEmail: p.users.email,
        updatedAt: p.updated_at,
        isOwner: false,
      };
    }),
    error: null,
  };
}

export async function getOwnedProjects(
  userId: string
): Promise<{ data: SharedProject[]; error: string | null }> {
  const { data, error } = await supabase
    .from("pixel_map_projects")
    .select("id, project_name, updated_at, users!inner (email)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  return {
    data: (data as any[]).map((p) => ({
      id: p.id,
      projectName: p.project_name,
      ownerEmail: p.users.email,
      updatedAt: p.updated_at,
      isOwner: true,
    })),
    error: null,
  };
}
