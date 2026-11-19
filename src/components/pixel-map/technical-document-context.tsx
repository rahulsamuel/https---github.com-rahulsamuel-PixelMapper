"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { jsPDF } from "jspdf";
import { useAuth } from "@/contexts/auth-context";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { dataLabelFor, portLabelOffsets } from "@/lib/device-wiring-layout";
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
  getTechDocImageKey,
  getTechDocSectionImagePaths,
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
  dataPortLabelsByScreen: Record<string, { primary: string[]; backup: string[] }>;
  loading: boolean;
  loadError: string | null;
  saving: boolean;
  downloading: boolean;
  uploadingKey: string | null;
  updateDoc: (updater: (doc: TechDocData) => TechDocData) => void;
  handleFilePicked: (sectionKey: string, imageIndex: number, file: File) => Promise<void>;
  handleRemoveImage: (sectionKey: string, imageIndex: number) => void;
  moveSection: (index: number, direction: -1 | 1) => void;
  downloadPdf: () => Promise<void>;
  rasterMapImageUrl: string | null;
  logoUrl: string | null;
  handleLogoPicked: (file: File) => Promise<void>;
  handleRemoveLogo: () => void;
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
  const dataPortLabelsByScreen = useMemo(() => Object.fromEntries(pixelMapScreens.map((screen) => {
    const offsets = portLabelOffsets(screen.devices);
    const labelsForRole = (isBackup: boolean) => screen.devices
      .filter((device) => (device.role === "backup") === isBackup)
      .flatMap((device) => Array.from({ length: device.portCount }, (_, index) => dataLabelFor(device, index + 1, offsets[device.id])));
    return [screen.id, { primary: labelsForRole(false), backup: labelsForRole(true) }];
  })), [pixelMapScreens]);
  const [doc, setDoc] = useState<TechDocData>(() => emptyTechDoc(projectName, screens));
  const [imageUrls, setImageUrls] = useState<Record<string, SectionImageState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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
      setLogoUrl(null);
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
    if (!doc.logoStoragePath) {
      setLogoUrl(null);
    } else {
      setLogoUrl(null);
      getTechDocImageUrl(doc.logoStoragePath).then((url) => {
        if (!cancelled) setLogoUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [doc.logoStoragePath]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const section of doc.sections) {
        const imagePaths = getTechDocSectionImagePaths(section);
        for (const [imageIndex, storagePath] of imagePaths.entries()) {
          const imageKey = getTechDocImageKey(section.key, imageIndex);
          const existing = imageUrls[imageKey];
          if (existing?.url || existing?.loading) continue;
          setImageUrls((previous) => ({
            ...previous,
            [imageKey]: { url: null, fileName: storagePath, loading: true },
          }));
          const url = await getTechDocImageUrl(storagePath);
          if (cancelled) return;
          setImageUrls((previous) => ({
            ...previous,
            [imageKey]: {
              url,
              fileName: storagePath.split("/").pop() ?? null,
              loading: false,
            },
          }));
        }
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

  const handleFilePicked = useCallback(async (sectionKey: string, imageIndex: number, file: File) => {
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
    const imagePaths = section ? getTechDocSectionImagePaths(section) : [];
    const previousPath = imagePaths[imageIndex] ?? null;
    const imageKey = getTechDocImageKey(sectionKey, imageIndex);
    setUploadingKey(imageKey);
    const result = await uploadTechDocImage(projectId, `${sectionKey}-${imageIndex + 1}`, file);
    setUploadingKey(null);
    if (result.error || !result.path) {
      toast({ title: "Upload failed", description: result.error ?? "Please try again.", variant: "destructive" });
      return;
    }
    const url = await getTechDocImageUrl(result.path);
    setImageUrls((previous) => ({ ...previous, [imageKey]: { url, fileName: file.name, loading: false } }));
    updateDoc((current) => ({
      ...current,
      sections: current.sections.map((candidate) => {
        if (candidate.key !== sectionKey) return candidate;
        const nextPaths = [...getTechDocSectionImagePaths(candidate)];
        nextPaths[imageIndex] = result.path!;
        return { ...candidate, storagePath: nextPaths[0] ?? null, storagePaths: nextPaths };
      }),
    }));
    if (previousPath && previousPath !== result.path) void deleteTechDocImage(previousPath);
  }, [projectId, toast, updateDoc]);

  const handleRemoveImage = useCallback((sectionKey: string, imageIndex: number) => {
    const section = docRef.current.sections.find((candidate) => candidate.key === sectionKey);
    const imagePaths = section ? getTechDocSectionImagePaths(section) : [];
    const previousPath = imagePaths[imageIndex];
    if (previousPath) void deleteTechDocImage(previousPath);
    const imageKey = getTechDocImageKey(sectionKey, imageIndex);
    setImageUrls((previous) => Object.fromEntries(
      Object.entries(previous).filter(([key]) => !key.startsWith(`${sectionKey}:`))
    ));
    updateDoc((current) => ({
      ...current,
      sections: current.sections.map((candidate) => {
        if (candidate.key !== sectionKey) return candidate;
        const nextPaths = getTechDocSectionImagePaths(candidate).filter((_, index) => index !== imageIndex);
        return { ...candidate, storagePath: nextPaths[0] ?? null, storagePaths: nextPaths };
      }),
    }));
  }, [updateDoc]);

  const handleLogoPicked = useCallback(async (file: File) => {
    const invalid = validateTechDocImage(file);
    if (invalid) {
      toast({ title: "Unsupported logo", description: invalid, variant: "destructive" });
      return;
    }
    if (!projectId) {
      toast({ title: "Save your project first", description: "Save the project to the cloud before uploading a document logo.", variant: "destructive" });
      return;
    }
    const previousPath = docRef.current.logoStoragePath;
    const uploadKey = "__tech-doc-logo__";
    setUploadingKey(uploadKey);
    const result = await uploadTechDocImage(projectId, "logo", file);
    setUploadingKey(null);
    if (result.error || !result.path) {
      toast({ title: "Logo upload failed", description: result.error ?? "Please try again.", variant: "destructive" });
      return;
    }
    const url = await getTechDocImageUrl(result.path);
    setLogoUrl(url);
    updateDoc((current) => ({ ...current, logoStoragePath: result.path }));
    if (previousPath && previousPath !== result.path) void deleteTechDocImage(previousPath);
  }, [projectId, toast, updateDoc]);

  const handleRemoveLogo = useCallback(() => {
    const previousPath = docRef.current.logoStoragePath;
    if (previousPath) void deleteTechDocImage(previousPath);
    setLogoUrl(null);
    updateDoc((current) => ({ ...current, logoStoragePath: null }));
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
        imageUrls: section.type === "raster_map"
          ? (getTechDocSectionImagePaths(section).length > 0
            ? getTechDocSectionImagePaths(section).map((_, imageIndex) => imageUrls[getTechDocImageKey(section.key, imageIndex)]?.url).filter((url): url is string => Boolean(url))
            : rasterMapImageUrl ? [rasterMapImageUrl] : [])
          : [imageUrls[getTechDocImageKey(section.key, 0)]?.url].filter((url): url is string => Boolean(url)),
        devices: section.devices,
        dataWiring: section.type === "data_wiring_front" || section.type === "data_wiring_rear",
        dataPortLabels: section.screenId ? dataPortLabelsByScreen[section.screenId] ?? { primary: [], backup: [] } : { primary: [], backup: [] },
      }));
      const pdf = await buildTechDocPdf(JsPdfCtor as unknown as typeof jsPDF, pages, {
        doc: docRef.current,
        projectName,
        logoUrl,
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
  }, [dataPortLabelsByScreen, downloading, imageUrls, logoUrl, projectName, rasterMapImageUrl, screens, toast]);

  const value: TechnicalDocumentContextValue = {
    doc,
    imageUrls,
    projectName,
    screens,
    dataPortLabelsByScreen,
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
    logoUrl,
    handleLogoPicked,
    handleRemoveLogo,
  };

  return <TechnicalDocumentContext.Provider value={value}>{children}</TechnicalDocumentContext.Provider>;
}
