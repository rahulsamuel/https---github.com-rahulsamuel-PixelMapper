"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cable, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { usePixelMap, type CableRun } from "@/contexts/pixel-map-context";
import { WiringDiagram } from "./wiring-diagram";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

const toMeters = (c: CableRun) => (c.unit === "ft" ? c.length * 0.3048 : c.length);

function RunSummary({ label, cables }: { label: string; cables: CableRun[] }) {
  const totalM = cables.reduce((sum, c) => sum + toMeters(c), 0);
  return (
    <p className="text-sm text-muted-foreground">
      {label}: {cables.length} runs · {totalM.toFixed(1)} m total ({(totalM * 3.28084).toFixed(0)} ft)
    </p>
  );
}

export function EquipmentWiringPreview({ cables }: { cables: CableRun[] }) {
  const { currentScreen } = usePixelMap();
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const diagram = diagramRef.current;
    if (!viewport || !diagram) return;
    const update = () => {
      const width = diagram.offsetWidth;
      const height = diagram.offsetHeight;
      setDiagramSize({ width, height });
      if (width > 0 && height > 0) {
        setFitScale(Math.min(viewport.clientWidth / width, viewport.clientHeight / height));
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(diagram);
    update();
    return () => observer.disconnect();
  }, [currentScreen.id]);

  const scale = fitScale * userZoom;
  const dataCables = cables.filter(c => c.kind === "cat");
  const powerCables = cables.filter(c => c.kind === "power");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Wiring Preview</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Screen: {currentScreen.name}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setUserZoom(z => Math.max(MIN_ZOOM, z / ZOOM_STEP))}>
              <ZoomOut className="size-4" />
            </Button>
            <span className="w-14 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setUserZoom(z => Math.min(MAX_ZOOM, z * ZOOM_STEP))}>
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Fit to preview" onClick={() => setUserZoom(1)}>
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={viewportRef} className="h-[60vh] min-h-[360px] overflow-auto rounded-md border bg-background">
          <div style={{ width: diagramSize.width * scale, height: diagramSize.height * scale }}>
            <div ref={diagramRef} style={{ width: "max-content", transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <WiringDiagram />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <RunSummary label="Data" cables={dataCables} />
          <RunSummary label="Power" cables={powerCables} />
        </div>
      </CardContent>
    </Card>
  );
}
