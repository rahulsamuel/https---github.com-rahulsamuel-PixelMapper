"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cable, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { usePixelMap, type CableRun } from "@/contexts/pixel-map-context";
import { WiringDiagram, type DataPortAnchor } from "./wiring-diagram";
import { DevicePortMap } from "./device-port-map";
import { DeviceOverlay } from "./device-overlay";
import { DeviceCableList } from "./device-cable-list";
import { useDeviceLayout } from "./use-device-layout";
import { buildDeviceRoutes, type PxPerMm } from "@/lib/device-wiring-layout";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;
const DEFAULT_TILE_MM = 500;

type WiringLayer = "data" | "power";

const toMeters = (c: CableRun) => (c.unit === "ft" ? c.length * 0.3048 : c.length);

function RunSummary({ cables }: { cables: CableRun[] }) {
  const totalM = cables.reduce((sum, c) => sum + toMeters(c), 0);
  return (
    <p className="text-sm text-muted-foreground">
      {cables.length} runs · {totalM.toFixed(1)} m total ({(totalM * 3.28084).toFixed(0)} ft)
    </p>
  );
}

export function EquipmentWiringPreview({ cables }: { cables: CableRun[] }) {
  const { currentScreen, devices, products } = usePixelMap();
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<WiringLayer>("data");
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [portAnchors, setPortAnchors] = useState<DataPortAnchor[]>([]);

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
  const { origins, onDragStart, onDragMove, onDragEnd } = useDeviceLayout(scale);

  const selectedProduct = products.find(p => p.id === currentScreen.selectedProductId);
  const section = currentScreen.sections[0];
  const tilePx = {
    w: section?.tileWidthPx ?? currentScreen.dimensions.tileWidth,
    h: section?.tileHeightPx ?? currentScreen.dimensions.tileHeight,
  };
  const pxPerMm: PxPerMm = {
    x: tilePx.w / (selectedProduct?.tileWidthMm || DEFAULT_TILE_MM),
    y: tilePx.h / (selectedProduct?.tileHeightMm || DEFAULT_TILE_MM),
  };
  const routes = buildDeviceRoutes({ devices, origins, anchors: portAnchors, pxPerMm });
  const layerCables = cables.filter(c => c.kind === (layer === "data" ? "cat" : "power"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Wiring Preview</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Screen: {currentScreen.name}</p>
            <Tabs value={layer} onValueChange={v => setLayer(v as WiringLayer)}>
              <TabsList>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="power">Power</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
            <div ref={diagramRef} style={{ width: "max-content", position: "relative", transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <WiringDiagram layer={layer} readOnly onDataPortAnchors={setPortAnchors} />
              <DeviceOverlay origins={origins} routes={routes} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} />
            </div>
          </div>
        </div>
        <RunSummary cables={layerCables} />
        <DeviceCableList routes={routes} />
        <DevicePortMap />
      </CardContent>
    </Card>
  );
}
