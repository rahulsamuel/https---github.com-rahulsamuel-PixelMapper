"use client";

import { supabase } from "@/lib/supabase/client";
import { ensureTabIdentifier } from "@/lib/project-tab-identifiers";
import { DEFAULT_HARDWARE_CONFIG, type ScreenHardwareConfig, type MountingType, type HeaderBarType, type SandbagWeight } from "@/lib/hardware-list";

export interface HardwareListSave {
  screens: { screenId: string; config: ScreenHardwareConfig }[];
}

export function parseHardwareListSave(raw: unknown): HardwareListSave | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rawScreens = (raw as { screens?: unknown }).screens;
  if (!Array.isArray(rawScreens)) return null;
  const screens: HardwareListSave["screens"] = [];
  for (const entry of rawScreens) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.screenId !== "string") continue;
    const c = (e.config ?? {}) as Record<string, unknown>;
    const mountingType = c.mountingType as MountingType;
    const headerBarType = (c.headerBarType ?? c.riggingBarType) as HeaderBarType;
    const sandbagWeight = c.sandbagWeight as SandbagWeight;
    if (!["flown", "ground-stack", "floor"].includes(mountingType)) continue;
    if (!["auto", "double", "single"].includes(headerBarType)) continue;
    if (!["25", "35"].includes(sandbagWeight)) continue;
    const adjustments: Partial<Record<string, number>> = {};
    if (c.adjustments && typeof c.adjustments === "object") {
      for (const [k, v] of Object.entries(c.adjustments as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) adjustments[k] = v;
      }
    }
    screens.push({
      screenId: e.screenId,
      config: {
        mountingType,
        headerBarType,
        cornerBlocks: c.cornerBlocks === true,
        sandbagWeight,
        adjustments,
      },
    });
  }
  return { screens };
}

export async function loadHardwareListSave(projectId: string): Promise<SaveResult<HardwareListSave | null>> {
  const { data, error } = await supabase
    .from("hardware_list_saves")
    .select("screens")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    console.error('src/lib/hardware-list-saves.ts:', error.message);
    return { data: null, error: 'Something went wrong. Please try again.' };
  }
  return { data: data ? parseHardwareListSave(data.screens) : null, error: null };
}

export async function saveHardwareListSave(
  projectId: string,
  save: HardwareListSave
): Promise<{ success: boolean; error: string | null }> {
  const ensured = await ensureTabIdentifier(projectId, "hardware_list");
  if (ensured.error) return { success: false, error: ensured.error };
  const { error } = await supabase
    .from("hardware_list_saves")
    .upsert(
      { project_id: projectId, screens: save.screens, updated_at: new Date().toISOString() },
      { onConflict: "project_id" }
    );

  if (error) {
    console.error('src/lib/hardware-list-saves.ts:', error.message);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
  return { success: true, error: null };
}

type SaveResult<T> = { data: T | null; error: string | null };
