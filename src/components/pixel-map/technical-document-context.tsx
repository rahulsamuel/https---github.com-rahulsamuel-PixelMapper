"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { jsPDF } from "jspdf";
import { useAuth } from "@/contexts/auth-context";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useToast } from "@/hooks/use-toast";
import { buildTechDocPdf, type TechDocPdfPage } from "@/lib/tech-doc-pdf";
import {
  deleteTechDocImage,
  emptyTechDoc,
  getTechDocImageUrl,
  loadTechDoc,
  parseTechDoc,
  saveTechDoc,
  uploadTechDocImage,
  validateTechDocImage,
  type TechDocData,
  type TechDocScreenReference,
  type TechDocSection,
} from "@/lib/tech-doc-saves";

interface SectionImageState {
  url: string | null;
  fileName: string | null;
  loading: boolean;
}

interface TechnicalDocumentContextValue {
  doc: TechDocData;
  imageUrls: Record<string, SectionImageState>;
  projectName: string;
  screens: TechDocScreenReference[];
  loading: boolean;
  loadError: string | null;
  saving: boolean;
  downloading: boolean;
  uploadingKey: string | null;
  updateDoc: (updater: (doc: TechDocData) => TechDocData) => void;
  handleFilePicked: (sectionKey: string, file: File) => Promise<void>;
  handleRemoveImage: (sectionKey: string) => void;
  moveSection: (index: number, direction: -1 | 1) => void;
  downloadPdf: () => Promise<void>;
  rasterMapImageUrl: string | null;
}

const TechnicalDocumentContext = createContext<TechnicalDocumentContextValue | null>(null);

export function useTechnicalDocument(): TechnicalDocumentContextValue {
  const context = useContext(TechnicalDocumentContext);
  if (!context) throw new Error("useTechnicalDocument must be used within TechnicalDocumentProvider");
  return context;
}

export function TechnicalDocumentProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const {
    screens: pixelMapScreens,
    activeProjectId: projectId,
    projectName,
    rasterMapConfigs,
    rasterOutputConfigs,
    activeRasterGroupId,
  } = usePixelMap();
  const screens = useMemo<TechDocScreenReference[]>(
    () => pixelMapScreens.map((screen) => ({ id: screen.id, name: screen.name })),
    [pixelMapScreens]
  );
  const [doc, setDoc] = useState<TechDocData>(() => emptyTechDoc(projectName, screens));
  const [imageUrls, setImageUrls] = useState<Record<string, SectionImageState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const rasterMapImageUrl = rasterOutputConfigs[activeRasterGroupId]?.previewImage ?? rasterMapConfigs[activeRasterGroupId]?.previewImage ?? null;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef(doc);
  const loadedProjectRef = useRef<string | null>(null);
  docRef.current = doc;

  useEffect(() => {
    let cancelled = false;
    loadedProjectRef.current = null;
    if (!projectId || !isAdmin) {
      setDoc(emptyTechDoc(projectName, screens));
      setImageUrls({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    loadTechDoc(projectId, projectName, screens).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error);
        setLoading(false);
        return;
      }
      setDoc(data ?? emptyTechDoc(projectName, screens));
      loadedProjectRef.current = projectId;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isAdmin, projectId, projectName]);

  useEffect(() => {
    if (!loadedProjectRef.current) return;
    setDoc((current) => parseTechDoc(current, projectName, screens));
  }, [projectName, screens]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const section of doc.sections) {
        if (!section.storagePath) continue;
        const existing = imageUrls[section.key];
        if (existing?.url || existing?.loading) continue;
        setImageUrls((previous) => ({
          ...previous,
          [section.key]: { url: null, fileName: section.storagePath, loading: true },
        }));
        const url = await getTechDocImageUrl(section.storagePath);
        if (cancelled) return;
        setImageUrls((previous) => ({
          ...previous,
          [section.key]: {
            url,
            fileName: section.storagePath?.split("/").pop() ?? null,
            loading: false,
          },
        }));
      }
    })();
    return () => { cancelled = true; };
    // The image map is intentionally read as a cache while sections change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.sections]);

  const scheduleSave = useCallback(() => {
    if (!projectId || !isAdmin) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const result = await saveTechDoc(projectId, docRef.current);
      setSaving(false);
      if (!result.success && result.error) toast({ title: "Save failed", description: result.error, variant: "destructive" });
    }, 900);
  }, [isAdmin, projectId, toast]);

  const updateDoc = useCallback((updater: (value: TechDocData) => TechDocData) => {
    setDoc((current) => updater(current));
    scheduleSave();
  }, [scheduleSave]);

  const handleFilePicked = useCallback(async (sectionKey: string, file: File) => {
    const invalid = validateTechDocImage(file);
    if (invalid) {
      toast({ title: "Unsupported image", description: invalid, variant: "destructive" });
      return;
    }
    if (!projectId) {
      toast({ title: "Save your project first", description: "Save the project to the cloud before uploading document images.", variant: "destructive" });
      return;
    }
    const section = docRef.current.sections.find((candidate) => candidate.key === sectionKey);
    const previousPath = section?.storagePath ?? null;
    setUploadingKey(sectionKey);
    const result = await uploadTechDocImage(projectId, sectionKey, file);
    setUploadingKey(null);
    if (result.error || !result.path) {
      toast({ title: "Upload failed", description: result.error ?? "Please try again.", variant: "destructive" });
      return;
    }
    const url = await getTechDocImageUrl(result.path);
    setImageUrls((previous) => ({ ...previous, [sectionKey]: { url, fileName: file.name, loading: false } }));
    updateDoc((current) => ({
      ...current,
      sections: current.sections.map((candidate) => candidate.key === sectionKey ? { ...candidate, storagePath: result.path } : candidate),
    }));
    if (previousPath && previousPath !== result.path) void deleteTechDocImage(previousPath);
  }, [projectId, toast, updateDoc]);

  const handleRemoveImage = useCallback((sectionKey: string) => {
    const section = docRef.current.sections.find((candidate) => candidate.key === sectionKey);
    if (section?.storagePath) void deleteTechDocImage(section.storagePath);
    setImageUrls((previous) => ({ ...previous, [sectionKey]: { url: null, fileName: null, loading: false } }));
    updateDoc((current) => ({
      ...current,
      sections: current.sections.map((candidate) => candidate.key === sectionKey ? { ...candidate, storagePath: null } : candidate),
    }));
  }, [updateDoc]);

  const moveSection = useCallback((index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= docRef.current.sections.length) return;
    updateDoc((current) => {
      const sections = [...current.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      return { ...current, sections };
    });
  }, [updateDoc]);

  const downloadPdf = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const selectedSections = docRef.current.sections.filter((section) => section.includeInPdf);
      if (selectedSections.length === 0) {
        toast({ title: "No pages selected", description: "Select at least one page before downloading the PDF.", variant: "destructive" });
        return;
      }
      const { default: JsPdfCtor } = await import("jspdf");
      const pages: TechDocPdfPage[] = selectedSections.map((section) => ({
        label: section.title,
        title: section.title,
        screenName: section.screenId ? screens.find((screen) => screen.id === section.screenId)?.name ?? "-" : "All Screens",
        imageUrl: section.type === "raster_map" ? rasterMapImageUrl : imageUrls[section.key]?.url ?? null,
      }));
      const pdf = await buildTechDocPdf(JsPdfCtor as unknown as typeof jsPDF, pages, {
        doc: docRef.current,
        projectName,
      });
      if (!pdf) return;
      const safeName = (projectName || "project").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      const safeRevision = (docRef.current.revision || "rev").replace(/[^a-z0-9]+/gi, "-");
      pdf.save(`${safeName}_tech_doc_${safeRevision}.pdf`);
      toast({ title: "Technical document downloaded" });
    } catch (error) {
      console.error("tech doc download failed:", error);
      toast({ title: "Download failed", description: "The PDF could not be generated. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }, [downloading, imageUrls, projectName, rasterMapImageUrl, screens, toast]);

  const value: TechnicalDocumentContextValue = {
    doc,
    imageUrls,
    projectName,
    screens,
    loading,
    loadError,
    saving,
    downloading,
    uploadingKey,
    updateDoc,
    handleFilePicked,
    handleRemoveImage,
    moveSection,
    downloadPdf,
    rasterMapImageUrl,
  };

  return <TechnicalDocumentContext.Provider value={value}>{children}</TechnicalDocumentContext.Provider>;
}
