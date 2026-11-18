"use client";

import { supabase } from "@/lib/supabase/client";
import { ensureTabIdentifier } from "@/lib/project-tab-identifiers";

export const TECH_DOC_IMAGE_BUCKET = "tech-doc-images";

export type TechDocSectionKey =
  | "pixel_map"
  | "data_wiring_front"
  | "data_wiring_rear"
  | "power_wiring_front"
  | "power_wiring_rear"
  | "rack_drawing"
  | "signal_flow";

export interface TechDocSection {
  key: TechDocSectionKey;
  title: string;
  storagePath: string | null;
}

export interface TechDocData {
  title: string;
  revision: string;
  date: string;
  sections: TechDocSection[];
}

export const DEFAULT_SECTION_ORDER: TechDocSectionKey[] = [
  "pixel_map",
  "data_wiring_front",
  "data_wiring_rear",
  "power_wiring_front",
  "power_wiring_rear",
  "rack_drawing",
  "signal_flow",
];

export const SECTION_LABELS: Record<TechDocSectionKey, string> = {
  pixel_map: "Pixel Map",
  data_wiring_front: "Data Wiring — Front View",
  data_wiring_rear: "Data Wiring — Rear View",
  power_wiring_front: "Power Wiring — Front View",
  power_wiring_rear: "Power Wiring — Rear View",
  rack_drawing: "Rack Drawing",
  signal_flow: "Signal Flow Diagram",
};

export function emptyTechDoc(projectName: string): TechDocData {
  return {
    title: `${projectName} Technical Document`,
    revision: "1.0",
    date: new Date().toISOString().slice(0, 10),
    sections: DEFAULT_SECTION_ORDER.map((key) => ({
      key,
      title: SECTION_LABELS[key],
      storagePath: null,
    })),
  };
}

export function parseTechDoc(raw: unknown, projectName: string): TechDocData {
  const fallback = emptyTechDoc(projectName);
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const sectionsRaw = Array.isArray(r.sections) ? r.sections : [];
  const sections: TechDocSection[] = [];
  for (const item of sectionsRaw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (typeof s.key !== "string" || !(s.key in SECTION_LABELS)) continue;
    sections.push({
      key: s.key as TechDocSectionKey,
      title: typeof s.title === "string" && s.title.trim() ? s.title : SECTION_LABELS[s.key as TechDocSectionKey],
      storagePath: typeof s.storagePath === "string" && s.storagePath ? s.storagePath : null,
    });
  }
  // Ensure every known section appears exactly once, keeping the saved order.
  for (const key of DEFAULT_SECTION_ORDER) {
    if (!sections.some((s) => s.key === key)) {
      sections.push({ key, title: SECTION_LABELS[key], storagePath: null });
    }
  }
  return {
    title: typeof r.title === "string" && r.title.trim() ? r.title : fallback.title,
    revision: typeof r.revision === "string" ? r.revision : fallback.revision,
    date: typeof r.date === "string" && r.date ? r.date : fallback.date,
    sections: sections.slice(0, DEFAULT_SECTION_ORDER.length),
  };
}

export async function loadTechDoc(
  projectId: string,
  projectName: string
): Promise<{ data: TechDocData | null; error: string | null }> {
  const { data, error } = await supabase
    .from("tech_doc_saves")
    .select("doc")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    console.error("src/lib/tech-doc-saves.ts:", error.message);
    return { data: null, error: "Something went wrong. Please try again." };
  }
  if (!data) return { data: null, error: null };
  return { data: parseTechDoc(data.doc, projectName), error: null };
}

async function createSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(TECH_DOC_IMAGE_BUCKET)
    .createSignedUrl(storagePath, 600);
  if (error || !data) {
    console.error("src/lib/tech-doc-saves.ts signed url:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export async function getTechDocImageUrl(storagePath: string): Promise<string | null> {
  return createSignedUrl(storagePath);
}

export async function saveTechDoc(
  projectId: string,
  doc: TechDocData
): Promise<{ success: boolean; error: string | null }> {
  const ensured = await ensureTabIdentifier(projectId, "tech_doc");
  if (ensured.error) return { success: false, error: ensured.error };

  const { error: upsertError } = await supabase
    .from("tech_doc_saves")
    .upsert(
      {
        project_id: projectId,
        doc,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    );
  if (upsertError) {
    console.error("src/lib/tech-doc-saves.ts:", upsertError.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const { error: versionError } = await supabase.from("tech_doc_versions").insert({
    project_id: projectId,
    doc,
  });
  if (versionError) {
    console.error("src/lib/tech-doc-saves.ts version:", versionError.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  return { success: true, error: null };
}

export async function uploadTechDocImage(
  projectId: string,
  sectionKey: TechDocSectionKey,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "png";
  const path = `${projectId}/${sectionKey}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(TECH_DOC_IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.error("src/lib/tech-doc-saves.ts upload:", error.message);
    return { path: null, error: "The image could not be uploaded. Please try again." };
  }
  return { path, error: null };
}

export async function deleteTechDocImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(TECH_DOC_IMAGE_BUCKET).remove([storagePath]);
  if (error) console.error("src/lib/tech-doc-saves.ts delete:", error.message);
}

export const TECH_DOC_MAX_BYTES = 15 * 1024 * 1024;
export const TECH_DOC_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateTechDocImage(file: File): string | null {
  if (!TECH_DOC_ACCEPTED_TYPES.includes(file.type)) {
    return "Only PNG, JPG, or WebP images are accepted.";
  }
  if (file.size > TECH_DOC_MAX_BYTES) {
    return "That image is larger than 15 MB. Please use a smaller file.";
  }
  return null;
}
