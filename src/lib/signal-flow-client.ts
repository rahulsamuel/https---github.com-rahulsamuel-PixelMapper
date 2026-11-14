"use client";

import { supabase } from "@/lib/supabase/client";
import type { SignalFlowData } from "@/lib/signal-flow-types";
import { ensureTabIdentifier } from "@/lib/project-tab-identifiers";

export interface SignalFlowDiagram {
  id: string;
  projectId: string;
  userId: string;
  diagramName: string;
  diagramData: SignalFlowData;
  createdAt: string;
  updatedAt: string;
}

export async function getSignalFlowDiagram(
  projectId: string
): Promise<{ data: SignalFlowDiagram | null; error: string | null }> {
  const { data, error } = await supabase
    .from("signal_flow_diagrams")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return {
    data: {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      diagramName: data.diagram_name,
      diagramData: data.diagram_data as SignalFlowData,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    error: null,
  };
}

export async function saveSignalFlowDiagram(
  projectId: string,
  userId: string,
  diagramName: string,
  diagramData: SignalFlowData,
  existingId?: string
): Promise<{ success: boolean; id: string | null; error: string | null }> {
  const ensured = await ensureTabIdentifier(projectId, "signal_flow");
  if (ensured.error) return { success: false, id: null, error: ensured.error };

  if (existingId) {
    const { error } = await supabase
      .from("signal_flow_diagrams")
      .update({
        diagram_name: diagramName,
        diagram_data: diagramData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId)
      .eq("project_id", projectId);

    if (error) return { success: false, id: null, error: error.message };
    return { success: true, id: existingId, error: null };
  }

  const { data, error } = await supabase
    .from("signal_flow_diagrams")
    .insert({
      project_id: projectId,
      user_id: userId,
      diagram_name: diagramName,
      diagram_data: diagramData,
    })
    .select("id")
    .single();

  if (error) return { success: false, id: null, error: error.message };
  return { success: true, id: data.id, error: null };
}

export interface SignalFlowVersionSummary {
  id: string;
  diagramName: string;
  createdAt: string;
}

export async function listSignalFlowVersions(
  projectId: string
): Promise<{ data: SignalFlowVersionSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from("signal_flow_diagram_versions")
    .select("id, diagram_name, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error('src/lib/signal-flow-client.ts:', error.message);
    return { data: [], error: 'Something went wrong. Please try again.' };
  }

  return {
    data: data.map((v) => ({
      id: v.id,
      diagramName: v.diagram_name,
      createdAt: v.created_at,
    })),
    error: null,
  };
}

export async function getSignalFlowVersionData(
  versionId: string
): Promise<{ data: { diagramName: string; diagramData: SignalFlowData } | null; error: string | null }> {
  const { data, error } = await supabase
    .from("signal_flow_diagram_versions")
    .select("diagram_name, diagram_data")
    .eq("id", versionId)
    .maybeSingle();

  if (error) {
    console.error('src/lib/signal-flow-client.ts:', error.message);
    return { data: null, error: 'Something went wrong. Please try again.' };
  }
  if (!data) return { data: null, error: 'This version could not be found.' };
  return {
    data: { diagramName: data.diagram_name, diagramData: data.diagram_data as SignalFlowData },
    error: null,
  };
}

export async function deleteSignalFlowDiagram(
  diagramId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("signal_flow_diagrams")
    .delete()
    .eq("id", diagramId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
