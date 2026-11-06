"use client";

import { supabase } from "@/lib/supabase/client";

export interface PowerDataSettings {
  productId: string;
  processorId: string;
  circuitVoltage: string;
  circuitAmperage: string;
  safetyMargin: string;
  refreshRate: string;
  bitDepth: string;
}

type SaveResult<T> = { data: T | null; error: string | null };

export function parsePowerDataSettings(raw: unknown): PowerDataSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const keys = [
    "productId",
    "processorId",
    "circuitVoltage",
    "circuitAmperage",
    "safetyMargin",
    "refreshRate",
    "bitDepth",
  ] as const;
  if (!keys.every((k) => typeof s[k] === "string")) return null;
  return {
    productId: s.productId as string,
    processorId: s.processorId as string,
    circuitVoltage: s.circuitVoltage as string,
    circuitAmperage: s.circuitAmperage as string,
    safetyMargin: s.safetyMargin as string,
    refreshRate: s.refreshRate as string,
    bitDepth: s.bitDepth as string,
  };
}

export function powerDataSnapshot(s: PowerDataSettings): string {
  return JSON.stringify([
    s.productId,
    s.processorId,
    s.circuitVoltage,
    s.circuitAmperage,
    s.safetyMargin,
    s.refreshRate,
    s.bitDepth,
  ]);
}

export async function loadPowerDataSettings(
  projectId: string,
  screenId: string
): Promise<SaveResult<PowerDataSettings>> {
  const { data, error } = await supabase
    .from("power_data_settings")
    .select("settings")
    .eq("project_id", projectId)
    .eq("screen_id", screenId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: parsePowerDataSettings(data?.settings), error: null };
}

export async function savePowerDataSettings(
  projectId: string,
  screenId: string,
  settings: PowerDataSettings
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("power_data_settings")
    .upsert(
      { project_id: projectId, screen_id: screenId, settings, updated_at: new Date().toISOString() },
      { onConflict: "project_id,screen_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function loadRackDrawingSettings(projectId: string): Promise<SaveResult<unknown>> {
  const { data, error } = await supabase
    .from("rack_drawing_saves")
    .select("settings")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data?.settings ?? null, error: null };
}

export async function saveRackDrawingSettings(
  projectId: string,
  settings: unknown
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("rack_drawing_saves")
    .upsert(
      { project_id: projectId, settings, updated_at: new Date().toISOString() },
      { onConflict: "project_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export interface PreVisualSave {
  settings: unknown;
  screens: unknown[];
}

export async function loadPreVisualSave(projectId: string): Promise<SaveResult<PreVisualSave>> {
  const { data, error } = await supabase
    .from("pre_visual_saves")
    .select("settings, screens")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: { settings: data.settings, screens: Array.isArray(data.screens) ? data.screens : [] },
    error: null,
  };
}

export async function savePreVisualSave(
  projectId: string,
  save: PreVisualSave
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("pre_visual_saves")
    .upsert(
      {
        project_id: projectId,
        settings: save.settings,
        screens: save.screens,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
