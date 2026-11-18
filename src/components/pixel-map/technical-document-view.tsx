"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/logo";
import {
  Download,
  Loader2,
  MoveDown,
  MoveUp,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
  TECH_DOC_ACCEPTED_TYPES,
  deleteTechDocImage,
  emptyTechDoc,
  getTechDocImageUrl,
  loadTechDoc,
  parseTechDoc,
  saveTechDoc,
  uploadTechDocImage,
  validateTechDocImage,
  type TechDocData,
  type TechDocSection,
} from "@/lib/tech-doc-saves";
import { buildTechDocPdf } from "@/lib/tech-doc-pdf";

interface SectionImageState {
  url: string | null;
  fileName: string | null;
  loading: boolean;
}

const PAGE_ASPECT = 17 / 11;

export function TechnicalDocumentView() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { screens, currentScreenId, activeProjectId: projectId, projectName } = usePixelMap();
  const screenName = useMemo(
    () => screens.find((s) => s.id === currentScreenId)?.name ?? "Default Screen",
    [screens, currentScreenId]
  );

  const [doc, setDoc] = useState<TechDocData>(() => emptyTechDoc(projectName));
  const [imageUrls, setImageUrls] = useState<Record<string, SectionImageState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;

  // Load saved doc when project changes
  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setDoc(emptyTechDoc(projectName));
      setImageUrls({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    loadTechDoc(projectId, projectName).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error);
        setLoading(false);
        return;
      }
      const loaded = data ?? parseTechDoc(null, projectName);
      setDoc(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, projectName]);

  // Resolve signed URLs for any stored images
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const section of doc.sections) {
        if (!section.storagePath) continue;
        const existing = imageUrls[section.key];
        if (existing?.url || existing?.loading) continue;
        setImageUrls((prev) => ({
          ...prev,
          [section.key]: { url: null, fileName: section.storagePath, loading: true },
        }));
        const url = await getTechDocImageUrl(section.storagePath);
        if (cancelled) return;
        setImageUrls((prev) => ({
          ...prev,
          [section.key]: {
            url,
            fileName: section.storagePath?.split("/").pop() ?? null,
            loading: false,
          },
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.sections]);

  // Debounced autosave
  const scheduleSave = useCallback(() => {
    if (!projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const { success, error } = await saveTechDoc(projectId, docRef.current);
      setSaving(false);
      if (!success && error) {
        toast({ title: "Save failed", description: error, variant: "destructive" });
      }
    }, 1200);
  }, [projectId, toast]);

  const updateDoc = (updater: (d: TechDocData) => TechDocData) => {
    setDoc((d) => updater(d));
    scheduleSave();
  };

  const handleSectionTitle = (key: string, title: string) => {
    updateDoc((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.key === key ? { ...s, title } : s)),
    }));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= doc.sections.length) return;
    updateDoc((d) => {
      const sections = [...d.sections];
      [sections[index], sections[next]] = [sections[next], sections[index]];
      return { ...d, sections };
    });
  };

  const handleFilePicked = async (sectionKey: string, file: File) => {
    const invalid = validateTechDocImage(file);
    if (invalid) {
      toast({ title: "Unsupported image", description: invalid, variant: "destructive" });
      return;
    }
    if (!projectId) {
      toast({
        title: "Save your project first",
        description: "Save the project to the cloud before uploading document images.",
        variant: "destructive",
      });
      return;
    }
    const section = doc.sections.find((s) => s.key === sectionKey);
    const previousPath = section?.storagePath ?? null;
    setUploadingKey(sectionKey);
    const { path, error } = await uploadTechDocImage(projectId, sectionKey as TechDocSection["key"], file);
    setUploadingKey(null);
    if (error || !path) {
      toast({ title: "Upload failed", description: error ?? "Please try again.", variant: "destructive" });
      return;
    }
    const url = await getTechDocImageUrl(path);
    setImageUrls((prev) => ({
      ...prev,
      [sectionKey]: { url, fileName: file.name, loading: false },
    }));
    updateDoc((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.key === sectionKey ? { ...s, storagePath: path } : s
      ),
    }));
    if (previousPath && previousPath !== path) {
      deleteTechDocImage(previousPath);
    }
  };

  const handleRemoveImage = (sectionKey: string) => {
    const section = doc.sections.find((s) => s.key === sectionKey);
    if (section?.storagePath) deleteTechDocImage(section.storagePath);
    setImageUrls((prev) => ({
      ...prev,
      [sectionKey]: { url: null, fileName: null, loading: false },
    }));
    updateDoc((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.key === sectionKey ? { ...s, storagePath: null } : s
      ),
    }));
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const { default: JsPdfCtor } = await import("jspdf");
      const pages: { label: string; title: string; imageUrl: string | null }[] = [];
      for (const section of doc.sections) {
        const state = imageUrls[section.key];
        pages.push({
          label: SECTION_LABELS[section.key],
          title: section.title,
          imageUrl: state?.url ?? null,
        });
      }
      const pdf = await buildTechDocPdf(JsPdfCtor as unknown as typeof jsPDF, pages, {
        doc,
        projectName,
        screenName,
      });
      if (!pdf) {
        toast({ title: "Nothing to export", description: "Add at least one section.", variant: "destructive" });
        return;
      }
      const safeName = (projectName || "project").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      const safeRev = (doc.revision || "rev").replace(/[^a-z0-9]+/gi, "-");
      pdf.save(`${safeName}_tech_doc_${safeRev}.pdf`);
      toast({ title: "Technical document downloaded" });
    } catch (err) {
      console.error("tech doc download failed:", err);
      toast({
        title: "Download failed",
        description: "The PDF could not be generated. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          This area is restricted to administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-4 p-4">
      {/* Left: setup controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Document Details</h3>
              <div className="space-y-2">
                <Label htmlFor="tech-doc-title">Document Title</Label>
                <Input
                  id="tech-doc-title"
                  value={doc.title}
                  onChange={(e) => updateDoc((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Technical Document"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="tech-doc-revision">Revision</Label>
                  <Input
                    id="tech-doc-revision"
                    value={doc.revision}
                    onChange={(e) => updateDoc((d) => ({ ...d, revision: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tech-doc-date">Date</Label>
                  <Input
                    id="tech-doc-date"
                    type="date"
                    value={doc.date}
                    onChange={(e) => updateDoc((d) => ({ ...d, date: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Project and screen names come from the project automatically. Sections save
                automatically when changed.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Sections</h3>
              <p className="text-xs text-muted-foreground">
                Upload an image for each section. Sections appear in the PDF in this order.
              </p>
              {doc.sections.map((section, idx) => {
                const state = imageUrls[section.key];
                return (
                  <div key={section.key} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {SECTION_LABELS[section.key]}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move section up"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(idx, 1)}
                          disabled={idx === doc.sections.length - 1}
                          aria-label="Move section down"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionTitle(section.key, e.target.value)}
                      placeholder="Section title on the page"
                    />
                    {state?.url ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={state.url}
                          alt={section.title}
                          className="w-full h-28 object-contain rounded border bg-muted/40"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {state.fileName ?? "image"}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              ref={(el) => { fileInputs.current[section.key] = el; }}
                              type="file"
                              accept={TECH_DOC_ACCEPTED_TYPES.join(",")}
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFilePicked(section.key, f);
                                e.target.value = "";
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7"
                              onClick={() => fileInputs.current[section.key]?.click()}
                              disabled={uploadingKey === section.key}
                            >
                              {uploadingKey === section.key ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="mr-1 h-3 w-3" />
                              )}
                              Replace
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveImage(section.key)}
                              aria-label="Remove image"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        ref={(el) => { fileInputs.current[section.key] = el; }}
                        type="file"
                        accept={TECH_DOC_ACCEPTED_TYPES.join(",")}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFilePicked(section.key, f);
                          e.target.value = "";
                        }}
                      />
                    )}
                    {!state?.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => fileInputs.current[section.key]?.click()}
                        disabled={uploadingKey === section.key}
                      >
                        {uploadingKey === section.key ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-3.5 w-3.5" />
                        )}
                        {section.storagePath ? "Loading image..." : "Upload Image"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
        <div className="pt-3 border-t space-y-2">
          <Button onClick={handleDownload} disabled={downloading} className="w-full">
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Technical Document PDF
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {saving ? (
              <>
                <Save className="h-3 w-3" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" /> All changes saved
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: live page previews */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          {doc.sections.map((section, idx) => {
            const state = imageUrls[section.key];
            return (
              <div key={section.key} className="space-y-1">
                <div
                  className="relative w-full border-2 border-foreground/80 bg-white shadow-sm"
                  style={{ aspectRatio: `${PAGE_ASPECT}` }}
                >
                  <div className="absolute inset-0 flex flex-col p-[2%]">
                    <div className="text-center font-bold text-black" style={{ fontSize: "clamp(10px, 1.6vw, 22px)" }}>
                      {section.title.toUpperCase()}
                    </div>
                    <div className="flex-1 border border-black/70 my-[1%] flex items-center justify-center overflow-hidden">
                      {state?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={state.url} alt={section.title} className="max-w-full max-h-full object-contain" />
                      ) : state?.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-gray-400">No image uploaded for this section.</span>
                      )}
                    </div>
                    <div className="border-t border-black/70 grid grid-cols-4 text-black">
                      {[
                        { label: "PROJECT", value: projectName },
                        { label: "SCREEN", value: screenName },
                        { label: "REVISION", value: doc.revision || "-" },
                        { label: "DATE", value: doc.date || "-" },
                      ].map((cell) => (
                        <div key={cell.label} className="border-r last:border-r-0 border-black/70 px-2 py-1 min-w-0">
                          <div className="text-gray-500" style={{ fontSize: "clamp(4px, 0.55vw, 8px)" }}>
                            {cell.label}
                          </div>
                          <div className="font-semibold truncate" style={{ fontSize: "clamp(6px, 0.85vw, 12px)" }}>
                            {cell.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-gray-500" style={{ fontSize: "clamp(4px, 0.55vw, 8px)" }}>
                      <span>{SECTION_LABELS[section.key]}</span>
                      <span>Page {idx + 1} of {doc.sections.length}</span>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1">
                    <Logo className="h-4 opacity-80" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {section.title} — page {idx + 1}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
