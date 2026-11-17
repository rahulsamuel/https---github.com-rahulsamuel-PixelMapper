"use client";

import { supabase } from "@/lib/supabase/client";

export type TestVideoBackground = "black" | "smpte-bars" | "full-color-bars" | "moving-grid" | "frame-counter";
export type TestVideoBarMode = "none" | "bouncing-crosshair";
export type TestVideoAudioSampleRate = 8000 | 16000 | 24000 | 44100 | 48000 | 96000;
export type TestVideoCodec = "h264-high" | "h264-main" | "h264-baseline";

export interface TestVideoPresetSettings {
  resolution: "720p" | "1080p" | "4k" | "screen";
  frameRate: 30 | 60;
  durationSeconds: 10 | 20 | 30;
  background: TestVideoBackground;
  bars: TestVideoBarMode;
  barWidth: number;
  audioEnabled: boolean;
  sampleRate: TestVideoAudioSampleRate;
  videoCodec: TestVideoCodec;
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
  const legacyPattern = s.pattern as string | undefined;
  const background = s.background as string ?? (
    legacyPattern === "smpte-bars" ? "smpte-bars"
      : legacyPattern === "full-color-bars" || legacyPattern === "color-bars-crosshair" ? "full-color-bars"
      : legacyPattern === "moving-grid" ? "moving-grid"
      : legacyPattern === "frame-counter" ? "frame-counter"
      : "black"
  );
  const bars = s.bars as string ?? (legacyPattern === "color-bars-crosshair" || legacyPattern === "bouncing-vertical-bar" || legacyPattern === "bouncing-horizontal-bar" ? "bouncing-crosshair" : "none");
  if (!["black", "smpte-bars", "full-color-bars", "moving-grid", "frame-counter"].includes(background)) return null;
  if (!["none", "bouncing-crosshair"].includes(bars)) return null;
  const sampleRate = s.sampleRate as number ?? 48000;
  if (![8000, 16000, 24000, 44100, 48000, 96000].includes(sampleRate)) return null;
  const videoCodec = s.videoCodec as string ?? "h264-high";
  if (!["h264-high", "h264-main", "h264-baseline"].includes(videoCodec)) return null;
  return {
    resolution: s.resolution as TestVideoPresetSettings["resolution"],
    frameRate: s.frameRate as TestVideoPresetSettings["frameRate"],
    durationSeconds: s.durationSeconds as TestVideoPresetSettings["durationSeconds"],
    background: background as TestVideoPresetSettings["background"],
    bars: bars as TestVideoPresetSettings["bars"],
    barWidth: typeof s.barWidth === "number" ? Math.max(1, Math.min(200, Math.round(s.barWidth))) : 8,
    audioEnabled: typeof s.audioEnabled === "boolean" ? s.audioEnabled : true,
    sampleRate: sampleRate as TestVideoPresetSettings["sampleRate"],
    videoCodec: videoCodec as TestVideoPresetSettings["videoCodec"],
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
