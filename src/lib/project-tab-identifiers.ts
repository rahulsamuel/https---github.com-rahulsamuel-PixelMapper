"use client";

import { supabase } from "@/lib/supabase/client";

export type TabKey = "power_data" | "rack_drawing" | "pre_visual" | "signal_flow";

export const TAB_IDENTIFIER_LABELS: Record<TabKey, string> = {
  power_data: "Power & Data",
  rack_drawing: "Rack Drawing",
  pre_visual: "Pre-Visual",
  signal_flow: "Signal Flow",
};

export type TabIdentifiers = Partial<Record<TabKey, string>>;

export async function fetchTabIdentifiers(
  projectId: string
): Promise<{ data: TabIdentifiers | null; error: string | null }> {
  const { data, error } = await supabase
    .from("project_tab_identifiers")
    .select("tab_key, identifier")
    .eq("project_id", projectId);

  if (error) {
    console.error("src/lib/project-tab-identifiers.ts:", error.message);
    return { data: null, error: "Something went wrong. Please try again." };
  }
  const result: TabIdentifiers = {};
  for (const row of data ?? []) {
    result[row.tab_key as TabKey] = row.identifier;
  }
  return { data: result, error: null };
}

export async function ensureTabIdentifier(
  projectId: string,
  tabKey: TabKey
): Promise<{ identifier: string | null; error: string | null }> {
  const { error: upsertError } = await supabase
    .from("project_tab_identifiers")
    .upsert(
      { project_id: projectId, tab_key: tabKey },
      { onConflict: "project_id,tab_key", ignoreDuplicates: true }
    );

  if (upsertError) {
    console.error("src/lib/project-tab-identifiers.ts:", upsertError.message);
    return { identifier: null, error: "Something went wrong. Please try again." };
  }

  const { data, error } = await fetchTabIdentifiers(projectId);
  if (error || !data) return { identifier: null, error: error ?? "Something went wrong. Please try again." };
  return { identifier: data[tabKey] ?? null, error: null };
}
