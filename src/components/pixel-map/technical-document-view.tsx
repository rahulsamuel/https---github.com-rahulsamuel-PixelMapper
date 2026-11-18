"use client";

import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTechnicalDocument } from "./technical-document-context";
import type { TechDocDevice } from "@/lib/tech-doc-saves";

const PAGE_ASPECT = 17 / 11;

function DeviceCards({ devices }: { devices: TechDocDevice[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-black/70 bg-white p-[0.6%] text-black">
      <div className="mb-[0.5%] shrink-0 text-[clamp(5px,0.65vw,9px)] font-bold uppercase tracking-wide">Signal Flow Devices</div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-[0.6%] overflow-hidden">
        {devices.map((device) => {
          const inputs = device.ports.filter((port) => port.direction === "input");
          const outputs = device.ports.filter((port) => port.direction === "output");
          return (
            <div key={device.id} className="min-h-0 overflow-hidden rounded border border-slate-300 bg-white">
              <div className="flex min-w-0 items-center gap-1 border-b border-slate-200 bg-slate-100 px-[1.5%] py-[1%]">
                <span className="h-[clamp(4px,0.55vw,8px)] w-[clamp(4px,0.55vw,8px)] shrink-0 rounded-full" style={{ backgroundColor: device.color }} />
                <span className="min-w-0 truncate text-[clamp(5px,0.7vw,10px)] font-bold">{device.name}</span>
              </div>
              <div className="grid min-h-0 grid-cols-2 gap-[2%] px-[1.5%] py-[1%]">
                {[{ label: "Inputs", ports: inputs }, { label: "Outputs", ports: outputs }].map((group) => (
                  <div key={group.label} className="min-w-0">
                    <div className="mb-[2%] text-[clamp(4px,0.5vw,7px)] font-semibold uppercase text-slate-500">{group.label}</div>
                    <div className="space-y-[2%]">
                      {group.ports.slice(0, 8).map((port) => (
                        <div key={port.id} className="flex min-w-0 items-center gap-1 text-[clamp(4px,0.5vw,7px)] leading-tight">
                          <span className="min-w-0 truncate">{port.label}</span>
                          <span className="h-px min-w-1 flex-1 bg-slate-300" />
                        </div>
                      ))}
                      {group.ports.length > 8 && <div className="text-[clamp(4px,0.45vw,6px)] text-slate-400">+{group.ports.length - 8} more</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.url} alt={section.title} className="max-h-full max-w-full object-contain" />
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
