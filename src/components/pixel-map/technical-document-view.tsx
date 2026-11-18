"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTechnicalDocument } from "./technical-document-context";

const PAGE_ASPECT = 17 / 11;

export function TechnicalDocumentView() {
  const { doc, imageUrls, projectName, screens, loading, loadError } = useTechnicalDocument();

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="space-y-2 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {doc.sections.map((section, index) => {
          const image = imageUrls[section.key];
          const sectionScreen = screens.find((screen) => screen.id === section.screenId);
          const screenName = sectionScreen?.name ?? "All Screens";
          return (
            <div key={section.key} className="space-y-1">
              <div className="relative w-full border-2 border-foreground/80 bg-white shadow-sm" style={{ aspectRatio: `${PAGE_ASPECT}` }}>
                <div className="absolute inset-0 flex flex-col p-[2%] text-black">
                  <div className="text-center font-bold" style={{ fontSize: "clamp(10px, 1.6vw, 22px)" }}>
                    {section.title.toUpperCase()}
                  </div>
                  <div className="my-[1%] flex flex-1 items-center justify-center overflow-hidden border border-black/70">
                    {image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.url} alt={section.title} className="max-h-full max-w-full object-contain" />
                    ) : image?.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-gray-400">No image uploaded for this section.</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 border-t border-black/70">
                    {[
                      { label: "PROJECT", value: projectName },
                      { label: "SCREEN", value: screenName },
                      { label: "REVISION", value: doc.revision || "-" },
                      { label: "DATE", value: doc.date || "-" },
                    ].map((cell) => (
                      <div key={cell.label} className="min-w-0 border-r border-black/70 px-2 py-1 last:border-r-0">
                        <div className="text-gray-500" style={{ fontSize: "clamp(4px, 0.55vw, 8px)" }}>{cell.label}</div>
                        <div className="truncate font-semibold" style={{ fontSize: "clamp(6px, 0.85vw, 12px)" }}>{cell.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-gray-500" style={{ fontSize: "clamp(4px, 0.55vw, 8px)" }}>
                    <span>{section.title}</span>
                    <span>Page {index + 1} of {doc.sections.length}</span>
                  </div>
                </div>
                <div className="absolute right-1 top-1"><Logo className="h-4 opacity-80" /></div>
              </div>
              <p className="text-center text-xs text-muted-foreground">{section.title} — page {index + 1}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
