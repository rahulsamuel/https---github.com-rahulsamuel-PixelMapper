"use client";

import { useRef } from "react";
import { Download, Loader2, MoveDown, MoveUp, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TECH_DOC_ACCEPTED_TYPES } from "@/lib/tech-doc-saves";
import { useTechnicalDocument } from "./technical-document-context";

export function TechnicalDocumentControls() {
  const {
    doc,
    loading,
    saving,
    downloading,
    uploadingKey,
    updateDoc,
    handleFilePicked,
    handleRemoveImage,
    moveSection,
    downloadPdf,
  } = useTechnicalDocument();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <ScrollArea className="max-h-[calc(100vh-190px)] pr-2">
        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Document Details</h3>
              <p className="text-xs text-muted-foreground">Project and screen names fill automatically. These document fields remain editable.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tech-doc-title">Document Title</Label>
              <Input id="tech-doc-title" value={doc.title} onChange={(event) => updateDoc((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="tech-doc-revision">Revision</Label>
                <Input id="tech-doc-revision" value={doc.revision} onChange={(event) => updateDoc((current) => ({ ...current, revision: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-doc-date">Date</Label>
                <Input id="tech-doc-date" type="date" value={doc.date} onChange={(event) => updateDoc((current) => ({ ...current, date: event.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Pages</h3>
              <p className="text-xs text-muted-foreground">Each screen gets its own pixel map and wiring pages. Reorder pages before exporting.</p>
            </div>
            {doc.sections.map((section, index) => {
              const inputKey = section.key;
              return (
                <div key={section.key} className="space-y-2 rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label="Move page up"><MoveUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === doc.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label="Move page down"><MoveDown className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Input value={section.title} onChange={(event) => updateDoc((current) => ({ ...current, sections: current.sections.map((candidate) => candidate.key === section.key ? { ...candidate, title: event.target.value } : candidate) }))} placeholder="Page title" />
                  <input
                    ref={(element) => { fileInputs.current[inputKey] = element; }}
                    type="file"
                    accept={TECH_DOC_ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFilePicked(inputKey, file);
                      event.target.value = "";
                    }}
                  />
                  {section.storagePath ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{section.storagePath.split("/").pop()}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7" disabled={uploadingKey === inputKey} onClick={() => fileInputs.current[inputKey]?.click()}>
                          {uploadingKey === inputKey ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Replace
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveImage(inputKey)} aria-label="Remove image"><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled={uploadingKey === inputKey} onClick={() => fileInputs.current[inputKey]?.click()}>
                      {uploadingKey === inputKey ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />} Upload Image
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      <div className="space-y-2 border-t pt-3">
        <Button className="w-full" onClick={() => void downloadPdf()} disabled={downloading}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download Technical Document PDF
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Save className="h-3 w-3" /> {saving ? "Saving..." : "All changes saved"}
        </div>
      </div>
    </div>
  );
}
