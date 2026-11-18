"use client";

import { useRef } from "react";
import { Download, Loader2, MoveDown, MoveUp, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    handleLogoPicked,
    handleRemoveLogo,
  } = useTechnicalDocument();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const logoInputKey = "__tech-doc-logo__";

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="w-full min-w-0 max-w-full pr-2">
        <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden break-words [overflow-wrap:anywhere]">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Document Details</h3>
              <p className="text-xs text-muted-foreground">Project and screen names fill automatically. These document fields remain editable.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tech-doc-title">Document Title</Label>
              <Input id="tech-doc-title" className="min-w-0 max-w-full truncate" value={doc.title} onChange={(event) => updateDoc((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="tech-doc-revision">Revision</Label>
                <Input id="tech-doc-revision" className="min-w-0 max-w-full truncate" value={doc.revision} onChange={(event) => updateDoc((current) => ({ ...current, revision: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-doc-date">Date</Label>
                <Input id="tech-doc-date" type="date" className="min-w-0 max-w-full truncate" value={doc.date} onChange={(event) => updateDoc((current) => ({ ...current, date: event.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Branding & Footer</h3>
              <p className="text-xs text-muted-foreground">Customize the logo and colors used on every document page.</p>
            </div>
            <div className="space-y-2">
              <Label>Document Logo</Label>
              <input
                ref={(element) => { fileInputs.current[logoInputKey] = element; }}
                type="file"
                accept={TECH_DOC_ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleLogoPicked(file);
                  event.target.value = "";
                }}
              />
              {doc.logoStoragePath ? (
                <div className="flex w-full min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{doc.logoStoragePath.split("/").pop()}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={uploadingKey === logoInputKey} onClick={() => fileInputs.current[logoInputKey]?.click()} aria-label="Replace logo">
                      {uploadingKey === logoInputKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleRemoveLogo} aria-label="Remove logo"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="h-9 w-full justify-start" disabled={uploadingKey === logoInputKey} onClick={() => fileInputs.current[logoInputKey]?.click()}>
                  {uploadingKey === logoInputKey ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                  Upload logo
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="tech-doc-footer-color">Footer color</Label>
                <Input id="tech-doc-footer-color" type="color" className="h-9 w-full cursor-pointer p-1" value={doc.footerColor} onChange={(event) => updateDoc((current) => ({ ...current, footerColor: event.target.value }))} aria-label="Footer color" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-doc-footer-text-color">Footer text</Label>
                <Input id="tech-doc-footer-text-color" type="color" className="h-9 w-full cursor-pointer p-1" value={doc.footerTextColor} onChange={(event) => updateDoc((current) => ({ ...current, footerTextColor: event.target.value }))} aria-label="Footer text color" />
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
                <div key={section.key} className="w-full min-w-0 max-w-[280px] space-y-2 overflow-hidden rounded-lg border bg-card p-3">
                  <div className="flex w-full min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 break-words text-xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">{section.title}</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label="Move page up"><MoveUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === doc.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label="Move page down"><MoveDown className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Input className="w-full min-w-0 max-w-[220px] truncate" value={section.title} onChange={(event) => updateDoc((current) => ({ ...current, sections: current.sections.map((candidate) => candidate.key === section.key ? { ...candidate, title: event.target.value } : candidate) }))} placeholder="Page title" />
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Include in PDF</Label>
                    <Switch checked={section.includeInPdf} onCheckedChange={(checked) => updateDoc((current) => ({ ...current, sections: current.sections.map((candidate) => candidate.key === section.key ? { ...candidate, includeInPdf: checked } : candidate) }))} aria-label={`Include ${section.title} in PDF`} />
                  </div>
                  {section.type === "raster_map" && !section.storagePath && (
                    <p className="text-xs text-muted-foreground">Generated from the current raster map unless you upload a custom image.</p>
                  )}
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
                    <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="min-w-0 max-w-[160px] flex-1 truncate">{section.storagePath.split("/").pop()}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={uploadingKey === inputKey} onClick={() => fileInputs.current[inputKey]?.click()} aria-label="Replace image">
                          {uploadingKey === inputKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveImage(inputKey)} aria-label="Remove image"><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={uploadingKey === inputKey} onClick={() => fileInputs.current[inputKey]?.click()} aria-label="Upload image">
                      {uploadingKey === inputKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-full min-w-0 space-y-2 border-t pt-3">
        <Button className="h-auto min-h-10 w-full min-w-0 max-w-full whitespace-normal break-words px-3 py-2 text-center leading-tight" onClick={() => void downloadPdf()} disabled={downloading}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : <Download className="mr-2 h-4 w-4 shrink-0" />}
          <span className="min-w-0 flex-1 whitespace-normal break-words">Download Technical Document PDF</span>
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Save className="h-3 w-3" /> {saving ? "Saving..." : "All changes saved"}
        </div>
      </div>
    </div>
  );
}
