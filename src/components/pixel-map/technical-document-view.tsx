"use client";

import { useState } from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTechnicalDocument } from "./technical-document-context";
import type { TechDocDevice } from "@/lib/tech-doc-saves";

const PAGE_ASPECT = 17 / 11;
const TECH_DOC_IMAGE_PATH = "/storage/v1/object/sign/tech-doc-images/";

function getPreviewImageUrl(url: string | null): string | null {
  if (!url || !/^https?:\/\//i.test(url) || !url.includes(TECH_DOC_IMAGE_PATH)) return url;
  return `/api/tech-doc-image?url=${encodeURIComponent(url)}`;
}

function DocumentImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-xs text-gray-400">Image could not be loaded.</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={getPreviewImageUrl(url) ?? url} alt={alt} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />
  );
}

const PORT_COLORS: Record<string, string> = {
  hdmi: "#ef4444",
  sdi: "#3b82f6",
  rj45: "#10b981",
  dvi: "#f59e0b",
  fiber: "#06b6d4",
  power: "#f97316",
  custom: "#94a3b8",
};

function DeviceNode({ device }: { device: TechDocDevice }) {
  const inputs = device.ports.filter((port) => port.direction === "input");
  const outputs = device.ports.filter((port) => port.direction === "output");
  const rows = Math.max(inputs.length, outputs.length);
  const nodeHeight = Math.max(device.height, 70 + rows * 22);

  return (
    <div className="h-full max-h-full min-h-0 w-auto max-w-full min-w-0 self-start overflow-y-auto rounded-xl border-2 border-sky-400 bg-[#294c7a] text-white shadow-[0_0_8px_rgba(14,165,233,0.6)]" style={{ aspectRatio: `${device.width} / ${nodeHeight}`, scrollbarColor: "#38bdf8 #0f172a", scrollbarWidth: "thin" }}>
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/25 bg-[#31598c] px-[3%] py-[2%]">
        <span className="min-w-0 truncate text-[clamp(6px,0.8vw,12px)] font-bold">{device.name}</span>
        <span className="shrink-0 text-[clamp(4px,0.5vw,7px)] uppercase text-white/70">{device.type.replaceAll("-", " ")}</span>
      </div>
      <div className="grid min-h-0 grid-cols-2 gap-[5%] px-[3%] py-[3%]">
        <div className="min-w-0 space-y-[2%]">
          {Array.from({ length: rows }, (_, index) => {
            const port = inputs[index];
            return (
              <div key={port?.id ?? `input-${index}`} className="flex min-w-0 items-center gap-1 text-[clamp(5px,0.62vw,9px)] leading-tight">
                <span className="h-[clamp(5px,0.65vw,9px)] w-[clamp(5px,0.65vw,9px)] shrink-0 rounded-full border-2 border-slate-950" style={{ backgroundColor: port ? PORT_COLORS[port.portType] ?? PORT_COLORS.custom : "transparent" }} />
                <span className="min-w-0 truncate">{port?.label ?? ""}</span>
              </div>
            );
          })}
        </div>
        <div className="min-w-0 space-y-[2%]">
          {Array.from({ length: rows }, (_, index) => {
            const port = outputs[index];
            return (
              <div key={port?.id ?? `output-${index}`} className="flex min-w-0 items-center justify-end gap-1 text-[clamp(5px,0.62vw,9px)] leading-tight">
                <span className="min-w-0 truncate text-right">{port?.label ?? ""}</span>
                <span className="h-[clamp(5px,0.65vw,9px)] w-[clamp(5px,0.65vw,9px)] shrink-0 rounded-full border-2 border-slate-950" style={{ backgroundColor: port ? PORT_COLORS[port.portType] ?? PORT_COLORS.custom : "transparent" }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeviceCards({ devices }: { devices: TechDocDevice[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-slate-700 bg-[#0b1220] p-[0.6%] text-white">
      <div className="grid min-h-0 flex-1 grid-cols-2 items-start justify-items-start gap-[1%] overflow-hidden">
        {devices.map((device) => <DeviceNode key={device.id} device={device} />)}
      </div>
    </div>
  );
}

export function TechnicalDocumentView() {
  const { doc, imageUrls, rasterMapImageUrl, logoUrl, projectName, screens, loading, loadError, downloadPdf, downloading } = useTechnicalDocument();

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
        <div className="no-print flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void downloadPdf()} disabled={downloading}>
            <FileText className="mr-2 h-4 w-4" /> {downloading ? "Generating..." : "Technical Document PDF"}
          </Button>
        </div>
        {doc.sections.map((section, index) => {
          const uploadedImage = imageUrls[section.key];
          const image = section.type === "raster_map"
            ? { url: uploadedImage?.url ?? rasterMapImageUrl, loading: uploadedImage?.loading ?? false }
            : uploadedImage;
          const sectionScreen = screens.find((screen) => screen.id === section.screenId);
          const screenName = sectionScreen?.name ?? "All Screens";
          const hasDevices = (section.type === "data_wiring_front" || section.type === "data_wiring_rear") && section.devices.length > 0;
          return (
            <div key={section.key} className="space-y-1">
              <div className="relative w-full border-2 border-foreground/80 bg-white shadow-sm" style={{ aspectRatio: `${PAGE_ASPECT}` }}>
                <div className="absolute inset-0 flex flex-col p-[2%] text-black">
                  <div className="text-center font-bold" style={{ fontSize: "clamp(10px, 1.6vw, 22px)" }}>
                    {section.title.toUpperCase()}
                  </div>
                  <div className="my-[1%] flex min-h-0 items-center justify-center overflow-hidden border border-black/70" style={{ flex: hasDevices ? 3 : 1 }}>
                    {image?.url ? (
                      <DocumentImage url={image.url} alt={section.title} />
                    ) : image?.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-gray-400">No image uploaded for this section.</span>
                    )}
                  </div>
                  {hasDevices && (
                    <div className="mb-[1%] min-h-0 overflow-hidden" style={{ flex: 2 }}>
                      <DeviceCards devices={section.devices} />
                    </div>
                  )}
                  <div className="grid grid-cols-4 border-t border-black/70" style={{ backgroundColor: doc.footerColor, color: doc.footerTextColor, borderColor: doc.footerTextColor }}>
                    {[
                      { label: "PROJECT", value: projectName },
                      { label: "SCREEN", value: screenName },
                      { label: "REVISION", value: doc.revision || "-" },
                      { label: "DATE", value: doc.date || "-" },
                    ].map((cell) => (
                      <div key={cell.label} className="min-w-0 border-r border-black/70 px-2 py-1 last:border-r-0" style={{ borderColor: doc.footerTextColor }}>
                        <div style={{ color: doc.footerTextColor, opacity: 0.7, fontSize: "clamp(4px, 0.55vw, 8px)" }}>{cell.label}</div>
                        <div className="truncate font-semibold" style={{ color: doc.footerTextColor, fontSize: "clamp(6px, 0.85vw, 12px)" }}>{cell.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between" style={{ color: doc.footerTextColor, opacity: 0.7, fontSize: "clamp(4px, 0.55vw, 8px)" }}>
                    <span>{section.title}</span>
                    <span>Page {index + 1} of {doc.sections.length}</span>
                  </div>
                </div>
                <div className="absolute right-1 top-1">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Document logo" className="h-4 max-w-24 object-contain" />
                  ) : (
                    <Logo className="h-4 opacity-80" />
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">{section.title} — page {index + 1}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
