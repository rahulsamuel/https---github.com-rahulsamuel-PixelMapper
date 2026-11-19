"use client";

import { supabase } from "@/lib/supabase/client";
import { ensureTabIdentifier } from "@/lib/project-tab-identifiers";
import type { DeviceType, SignalFlowPort } from "@/lib/signal-flow-types";

export const TECH_DOC_IMAGE_BUCKET = "tech-doc-images";
export const DEFAULT_TECH_DOC_FOOTER_COLOR = "#0f1319";
export const DEFAULT_TECH_DOC_FOOTER_TEXT_COLOR = "#ffffff";

export type TechDocSectionType =
  | "pixel_map"
  | "data_wiring_front"
  | "data_wiring_rear"
  | "power_wiring_front"
  | "power_wiring_rear"
  | "raster_map"
  | "rack_drawing"
  | "signal_flow";

export interface TechDocScreenReference {
  id: string;
  name: string;
}

export interface TechDocDevice {
  id: string;
  type: DeviceType;
  name: string;
  width: number;
  height: number;
  color: string;
  ports: SignalFlowPort[];
  dataPortLabels?: Record<string, string>;
}

export interface TechDocSection {
  key: string;
  type: TechDocSectionType;
  screenId: string | null;
  title: string;
  storagePath: string | null;
  storagePaths: string[];
  includeInPdf: boolean;
  devices: TechDocDevice[];
}

export interface TechDocData {
  title: string;
  revision: string;
  date: string;
  logoStoragePath: string | null;
  footerColor: string;
  footerTextColor: string;
  sections: TechDocSection[];
}

export const SCREEN_SECTION_TYPES: TechDocSectionType[] = [
  "pixel_map",
  "data_wiring_front",
  "data_wiring_rear",
  "power_wiring_front",
  "power_wiring_rear",
];

export const PROJECT_SECTION_TYPES: TechDocSectionType[] = ["raster_map", "rack_drawing", "signal_flow"];

export const SECTION_LABELS: Record<TechDocSectionType, string> = {
  pixel_map: "Pixel Map",
  data_wiring_front: "Data Wiring — Front View",
  data_wiring_rear: "Data Wiring — Rear View",
  power_wiring_front: "Power Wiring — Front View",
  power_wiring_rear: "Power Wiring — Rear View",
  raster_map: "Raster Map",
  rack_drawing: "Rack Drawing",
  signal_flow: "Signal Flow Diagram",
};

export const DEFAULT_SECTION_ORDER = SCREEN_SECTION_TYPES;

export function getTechDocSectionImagePaths(section: TechDocSection): string[] {
  return section.storagePaths.length > 0 ? section.storagePaths : section.storagePath ? [section.storagePath] : [];
}

export function getTechDocImageKey(sectionKey: string, imageIndex: number): string {
  return `${sectionKey}:${imageIndex}`;
}

export function getSectionLabel(section: TechDocSection): string {
  return section.screenId ? `${SECTION_LABELS[section.type]} — ${section.title.split(" — ").pop()}` : SECTION_LABELS[section.type];
}

function makeSection(type: TechDocSectionType, screen: TechDocScreenReference | null): TechDocSection {
  const key = screen ? `${type}:${screen.id}` : type;
  return {
    key,
    type,
    screenId: screen?.id ?? null,
    title: screen ? `${SECTION_LABELS[type]} — ${screen.name}` : SECTION_LABELS[type],
    storagePath: null,
    storagePaths: [],
    includeInPdf: true,
    devices: [],
  };
}

export function buildDefaultSections(screens: TechDocScreenReference[]): TechDocSection[] {
  const screenSections = screens.flatMap((screen) => [
    makeSection("pixel_map", screen),
    makeSection("raster_map", screen),
    ...SCREEN_SECTION_TYPES
      .filter((type) => type !== "pixel_map")
      .map((type) => makeSection(type, screen)),
  ]);
  const projectSections = PROJECT_SECTION_TYPES
    .filter((type) => type !== "raster_map")
    .map((type) => makeSection(type, null));
  return [...screenSections, ...projectSections];
}

export function emptyTechDoc(projectName: string, screens: TechDocScreenReference[] = []): TechDocData {
  return {
    title: `${projectName} Technical Document`,
    revision: "1.0",
    date: new Date().toISOString().slice(0, 10),
    logoStoragePath: null,
    footerColor: DEFAULT_TECH_DOC_FOOTER_COLOR,
    footerTextColor: DEFAULT_TECH_DOC_FOOTER_TEXT_COLOR,
    sections: buildDefaultSections(screens),
  };
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function typeFromLegacyKey(key: string): TechDocSectionType | null {
  return key in SECTION_LABELS ? key as TechDocSectionType : null;
}

const DEVICE_TYPES: DeviceType[] = [
  "processor",
  "led-screen",
  "media-server",
  "power-supply",
  "network-switch",
  "matrix",
  "distribution",
  "converter",
  "custom",
];

function parseTechDocDevices(value: unknown): TechDocDevice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const device = item as Record<string, unknown>;
    const name = typeof device.name === "string" && device.name.trim() ? device.name.trim() : null;
    const ports = Array.isArray(device.ports)
      ? device.ports.flatMap((port) => {
          if (!port || typeof port !== "object") return [];
          const parsed = port as Record<string, unknown>;
          if (
            typeof parsed.id !== "string" ||
            typeof parsed.label !== "string" ||
            (parsed.direction !== "input" && parsed.direction !== "output") ||
            typeof parsed.portType !== "string"
          ) return [];
          return [{
            id: parsed.id,
            label: parsed.label,
            direction: parsed.direction,
            portType: parsed.portType,
          } satisfies SignalFlowPort];
        })
      : [];
    if (!name || ports.length === 0) return [];
    const type = DEVICE_TYPES.includes(device.type as DeviceType) ? device.type as DeviceType : "custom";
    const width = typeof device.width === "number" && Number.isFinite(device.width) ? Math.max(80, device.width) : 180;
    const height = typeof device.height === "number" && Number.isFinite(device.height) ? Math.max(60, device.height) : 120;
    const dataPortLabels = device.dataPortLabels && typeof device.dataPortLabels === "object"
      ? Object.fromEntries(Object.entries(device.dataPortLabels).flatMap(([portId, label]) => (
          typeof label === "string" && label.trim() ? [[portId, label.trim()]] : []
        )))
      : undefined;
    return [{
      id: typeof device.id === "string" && device.id ? device.id : `tech-doc-device-${index}`,
      type,
      name,
      width,
      height,
      color: isHexColor(device.color) ? device.color : "#475569",
      ports,
      ...(dataPortLabels && Object.keys(dataPortLabels).length > 0 ? { dataPortLabels } : {}),
    }];
  });
}

export function getTechDocDataPortLabel(
  device: TechDocDevice,
  portId: string,
  outputIndex: number,
  deviceIndex: number,
  deviceCount: number,
  dataPortLabels: { primary: string[]; backup: string[] },
): string {
  const manualLabel = device.dataPortLabels?.[portId]?.trim();
  if (manualLabel) return manualLabel;
  const labels = deviceIndex >= Math.ceil(deviceCount / 2) ? dataPortLabels.backup : dataPortLabels.primary;
  return labels[outputIndex] ?? "";
}

export function parseTechDoc(
  raw: unknown,
  projectName: string,
  screens: TechDocScreenReference[] = []
): TechDocData {
  const fallback = emptyTechDoc(projectName, screens);
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const sectionsRaw = Array.isArray(r.sections) ? r.sections : [];
  const sections: TechDocSection[] = [];
  for (const item of sectionsRaw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const key = typeof s.key === "string" ? s.key : "";
    const type = typeof s.type === "string" && s.type in SECTION_LABELS
      ? s.type as TechDocSectionType
      : typeFromLegacyKey(key);
    if (!type) continue;
    const screenId = typeof s.screenId === "string" ? s.screenId : null;
    const screen = screenId ? screens.find((candidate) => candidate.id === screenId) : null;
    const resolvedKey = screenId ? `${type}:${screenId}` : key || type;
    sections.push({
      key: resolvedKey,
      type,
      screenId,
      title: typeof s.title === "string" && s.title.trim()
        ? s.title
        : screen ? `${SECTION_LABELS[type]} — ${screen.name}` : SECTION_LABELS[type],
      storagePath: typeof s.storagePath === "string" && s.storagePath ? s.storagePath : null,
      storagePaths: (() => {
        const parsedPaths = Array.isArray(s.storagePaths)
          ? s.storagePaths.filter((path): path is string => typeof path === "string" && path.length > 0)
          : [];
        return parsedPaths.length > 0
          ? parsedPaths
          : typeof s.storagePath === "string" && s.storagePath ? [s.storagePath] : [];
      })(),
      includeInPdf: s.includeInPdf !== false,
      devices: parseTechDocDevices(s.devices),
    });
  }

  const savedKeys = new Set(sections.map((section) => section.key));
  for (const section of buildDefaultSections(screens)) {
    if (!savedKeys.has(section.key)) sections.push(section);
  }
  if (sections.length === 0) sections.push(...buildDefaultSections(screens));

  const legacyRaster = sections.find((section) => section.type === "raster_map" && !section.screenId);
  if (legacyRaster) {
    const legacyImages = getTechDocSectionImagePaths(legacyRaster);
    const firstScreenRaster = sections.find((section) => section.type === "raster_map" && section.screenId);
    if (firstScreenRaster && legacyImages.length > 0) {
      const mergedPaths = [...legacyImages, ...getTechDocSectionImagePaths(firstScreenRaster)];
      firstScreenRaster.storagePath = mergedPaths[0] ?? null;
      firstScreenRaster.storagePaths = mergedPaths;
    }
    sections.splice(sections.indexOf(legacyRaster), 1);
  }

  const rasterByScreen = new Map(
    sections
      .filter((section) => section.type === "raster_map" && section.screenId)
      .map((section) => [section.screenId, section])
  );
  const ordered: TechDocSection[] = [];
  const paired = new Set<TechDocSection>();
  for (const section of sections) {
    if (section.type === "raster_map" && section.screenId) continue;
    ordered.push(section);
    if (section.type === "pixel_map") {
      const raster = rasterByScreen.get(section.screenId);
      if (raster) {
        ordered.push(raster);
        paired.add(raster);
      }
    }
  }
  for (const section of sections) {
    if (section.type === "raster_map" && section.screenId && !paired.has(section)) ordered.push(section);
  }
  sections.splice(0, sections.length, ...ordered);

  return {
    title: typeof r.title === "string" && r.title.trim() ? r.title : fallback.title,
    revision: typeof r.revision === "string" ? r.revision : fallback.revision,
    date: typeof r.date === "string" && r.date ? r.date : fallback.date,
    logoStoragePath: typeof r.logoStoragePath === "string" && r.logoStoragePath ? r.logoStoragePath : null,
    footerColor: isHexColor(r.footerColor) ? r.footerColor : fallback.footerColor,
    footerTextColor: isHexColor(r.footerTextColor) ? r.footerTextColor : fallback.footerTextColor,
    sections,
  };
}

export async function loadTechDoc(
  projectId: string,
  projectName: string,
  screens: TechDocScreenReference[] = []
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
  return { data: parseTechDoc(data.doc, projectName, screens), error: null };
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
    .upsert({ project_id: projectId, doc, updated_at: new Date().toISOString() }, { onConflict: "project_id" });
  if (upsertError) {
    console.error("src/lib/tech-doc-saves.ts:", upsertError.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const { error: versionError } = await supabase.from("tech_doc_versions").insert({ project_id: projectId, doc });
  if (versionError) {
    console.error("src/lib/tech-doc-saves.ts version:", versionError.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  return { success: true, error: null };
}

export async function uploadTechDocImage(
  projectId: string,
  sectionKey: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "png";
  const safeKey = sectionKey.replace(/[^a-z0-9_-]/gi, "_");
  const path = `${projectId}/${safeKey}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(TECH_DOC_IMAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
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
  if (!TECH_DOC_ACCEPTED_TYPES.includes(file.type)) return "Only PNG, JPG, or WebP images are accepted.";
  if (file.size > TECH_DOC_MAX_BYTES) return "That image is larger than 15 MB. Please use a smaller file.";
  return null;
}
