import { readStoredSelection, SELECTED_PROJECT_STORAGE_KEY } from "@/hooks/use-saved-pixel-map-selection";
import { fetchTabIdentifiers, type TabKey } from "@/lib/project-tab-identifiers";

export function isSaveTargetCurrent(projectId: string): boolean {
  return readStoredSelection(SELECTED_PROJECT_STORAGE_KEY) === projectId;
}

export type SaveTargetCheck = "ok" | "mismatch" | "error";

export async function checkSaveTarget(
  projectId: string,
  tabKey: TabKey,
  expectedIdentifier: string | null
): Promise<SaveTargetCheck> {
  if (!isSaveTargetCurrent(projectId)) return "mismatch";
  const { data, error } = await fetchTabIdentifiers(projectId);
  if (error || !data) return "error";
  return (data[tabKey] ?? null) === expectedIdentifier ? "ok" : "mismatch";
}
