"use client";

import { supabase } from "@/lib/supabase/client";

export type TestVideoPattern =
  | "smpte-bars"
  | "full-color-bars"
  | "color-bars-crosshair"
  | "moving-grid"
  | "frame-counter";

export interface TestVideoPresetSettings {
  resolution: "720p" | "1080p" | "4k" | "screen";
  frameRate: 30 | 60;
  durationSeconds: 10 | 20 | 30;
  pattern: TestVideoPattern;
}

export interface TestVideoPreset {
  id: string;
  name: string;
  settings: TestVideoPresetSettings;
}

interface TestVideoPresetRow {
  id: string;
  name: string;
  settings: unknown;
}

export function parsePresetSettings(raw: unknown): TestVideoPresetSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (!["720p", "1080p", "4k", "screen"].includes(s.resolution as string)) return null;
  if (![30, 60].includes(s.frameRate as number)) return null;
  if (![10, 20, 30].includes(s.durationSeconds as number)) return null;
  const rawPattern = s.pattern as string;
  const pattern = rawPattern === "bouncing-vertical-bar" || rawPattern === "bouncing-horizontal-bar"
    ? "color-bars-crosshair"
    : rawPattern;
  if (!["smpte-bars", "full-color-bars", "color-bars-crosshair", "moving-grid", "frame-counter"].includes(pattern)) return null;
  return {
    resolution: s.resolution as TestVideoPresetSettings["resolution"],
    frameRate: s.frameRate as TestVideoPresetSettings["frameRate"],
    durationSeconds: s.durationSeconds as TestVideoPresetSettings["durationSeconds"],
    pattern: pattern as TestVideoPresetSettings["pattern"],
  };
}

function parsePresetRows(rows: TestVideoPresetRow[]): TestVideoPreset[] {
  const presets: TestVideoPreset[] = [];
  for (const row of rows) {
    const settings = parsePresetSettings(row.settings);
    if (!settings) continue;
    presets.push({ id: row.id, name: row.name, settings });
  }
  return presets;
}

export async function loadTestVideoPresets(
  projectId: string
): Promise<{ data: TestVideoPreset[]; error: string | null }> {
  const { data, error } = await supabase
    .from("test_video_presets")
    .select("id, name, settings")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("src/lib/test-video-presets.ts:", error.message);
    return { data: [], error: "Something went wrong. Please try again." };
  }
  return { data: parsePresetRows((data ?? []) as TestVideoPresetRow[]), error: null };
}

export async function saveTestVideoPreset(
  projectId: string,
  name: string,
  settings: TestVideoPresetSettings
): Promise<{ success: boolean; error: string | null }> {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return { success: false, error: "Please give the preset a name." };
  const { error } = await supabase
    .from("test_video_presets")
    .insert({ project_id: projectId, name: trimmed, settings });

  if (error) {
    console.error("src/lib/test-video-presets.ts:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  return { success: true, error: null };
}

export async function renameTestVideoPreset(
  presetId: string,
  name: string
): Promise<{ success: boolean; error: string | null }> {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return { success: false, error: "Please give the preset a name." };
  const { error } = await supabase
    .from("test_video_presets")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", presetId);

  if (error) {
    console.error("src/lib/test-video-presets.ts:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  return { success: true, error: null };
}

export async function deleteTestVideoPreset(
  presetId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("test_video_presets")
    .delete()
    .eq("id", presetId);

  if (error) {
    console.error("src/lib/test-video-presets.ts:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  return { success: true, error: null };
}
