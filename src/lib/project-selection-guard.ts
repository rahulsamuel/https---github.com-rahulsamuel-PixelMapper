import { readStoredSelection, SELECTED_PROJECT_STORAGE_KEY } from "@/hooks/use-saved-pixel-map-selection";

export function isSaveTargetCurrent(projectId: string): boolean {
  return readStoredSelection(SELECTED_PROJECT_STORAGE_KEY) === projectId;
}
