"use client";

import { supabase } from "@/lib/supabase/client";
import type { SignalFlowData } from "@/lib/signal-flow-types";

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
  if (existingId) {
    const { error } = await supabase
      .from("signal_flow_diagrams")
      .update({
        diagram_name: diagramName,
        diagram_data: diagramData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId);

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
