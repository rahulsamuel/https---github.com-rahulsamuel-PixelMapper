"use client";

import { getProjectVersionData, listProjectVersions, updateCloudProject } from "@/lib/cloud-projects";
import {
  getSignalFlowDiagram,
  getSignalFlowVersionData,
  listSignalFlowVersions,
  saveSignalFlowDiagram,
} from "@/lib/signal-flow-client";

export type ProjectHistoryKind = "pixel_map" | "signal_flow";

export interface ProjectHistoryEntry {
  id: string;
  kind: ProjectHistoryKind;
  name: string;
  createdAt: string;
}

export async function listProjectHistory(
  projectId: string
): Promise<{ data: ProjectHistoryEntry[]; error: string | null }> {
  const [pixelMap, signalFlow] = await Promise.all([
    listProjectVersions(projectId),
    listSignalFlowVersions(projectId),
  ]);

  const error = pixelMap.error ?? signalFlow.error;
  if (error) return { data: [], error };

  const entries: ProjectHistoryEntry[] = [
    ...pixelMap.data.map((v) => ({ id: v.id, kind: "pixel_map" as const, name: v.projectName, createdAt: v.createdAt })),
    ...signalFlow.data.map((v) => ({ id: v.id, kind: "signal_flow" as const, name: v.diagramName, createdAt: v.createdAt })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { data: entries, error: null };
}

export async function restoreProjectHistoryEntry(
  entry: ProjectHistoryEntry,
  project: { id: string; userId: string }
): Promise<{ success: boolean; error: string | null }> {
  if (entry.kind === "pixel_map") {
    const version = await getProjectVersionData(entry.id);
    if (version.error || !version.data) {
      return { success: false, error: version.error ?? "This version could not be found." };
    }
    return updateCloudProject(project.id, entry.name, version.data);
  }

  const version = await getSignalFlowVersionData(entry.id);
  if (version.error || !version.data) {
    return { success: false, error: version.error ?? "This version could not be found." };
  }
  const current = await getSignalFlowDiagram(project.id);
  if (current.error) return { success: false, error: current.error };

  const saved = await saveSignalFlowDiagram(
    project.id,
    project.userId,
    version.data.diagramName,
    version.data.diagramData,
    current.data?.id
  );
  return { success: saved.success, error: saved.error };
}
