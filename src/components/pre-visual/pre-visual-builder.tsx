"use client";

import { useRef, useState } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { ScreenPreview } from "./screen-preview";
import { PreVisualControls } from "./pre-visual-controls";
import type { PreVisualScreenData, PreVisualSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { supabase } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  tileWidthMm: number | null;
  tileHeightMm: number | null;
  tileDepthMm: number | null;
  productImageUrl: string | null;
}

interface Screen {
  id: string;
  name: string;
  dimensions: {
    tileWidth: number;
    tileHeight: number;
    screenWidth: number;
    screenHeight: number;
    moduleWidth: number;
    moduleHeight: number;
  };
  tiles: { id: number; deleted: boolean; color?: string }[];
  sections: {
    id: string;
    productId: string;
    columnCount: number;
    tileWidthPx: number;
    tileHeightPx: number;
    tileWidthMm: number;
    tileHeightMm: number;
  }[];
  tileColor: string;
  tileColorTwo: string;
  borderColor: string;
  borderWidth: number;
  selectedProductId: string | null;
  customTileWidthMm: number;
  customTileHeightMm: number;
}

function buildScreenData(screen: Screen, products: Product[]): PreVisualScreenData {
  const product = products.find(p => p.id === screen.selectedProductId) ?? null;
  const tileWidthMm = product?.tileWidthMm ?? screen.customTileWidthMm ?? 0;
  const tileHeightMm = product?.tileHeightMm ?? screen.customTileHeightMm ?? 0;
  const tileDepthMm = product?.tileDepthMm ?? 80;

  return {
    id: screen.id,
    name: screen.name,
    screenWidthTiles: screen.dimensions.screenWidth,
    screenHeightTiles: screen.dimensions.screenHeight,
    tileWidthMm,
    tileHeightMm,
    tileDepthMm,
    tileWidthPx: screen.dimensions.tileWidth,
    tileHeightPx: screen.dimensions.tileHeight,
    tileColor: screen.tileColor,
    tileColorTwo: screen.tileColorTwo,
    borderColor: screen.borderColor,
    borderWidth: screen.borderWidth,
    curveRadiusMm: 0,
    curveAngleDeg: 0,
    productImageUrl: product?.productImageUrl ?? null,
    productName: product?.productName ?? null,
    manufacturer: product?.manufacturer ?? null,
    sections: screen.sections.map(s => ({
      productId: s.productId,
      columnCount: s.columnCount,
      tileWidthPx: s.tileWidthPx,
      tileHeightPx: s.tileHeightPx,
      tileWidthMm: s.tileWidthMm,
      tileHeightMm: s.tileHeightMm,
    })),
  };
}

export function PreVisualBuilder() {
  const [settings, setSettings] = usePersistentState<PreVisualSettings>("pre-visual:settings", DEFAULT_SETTINGS);
  const [panelOpen, setPanelOpen] = useState(true);
  const [screens, setScreens] = useState<PreVisualScreenData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  // Load screens from localStorage autosave and products from Supabase
  const loadedRef = useRef(false);
  if (!loadedRef.current) {
    loadedRef.current = true;
    (async () => {
      try {
        const raw = localStorage.getItem("pixel-mapper-autosave");
        if (raw) {
          const data = JSON.parse(raw);
          if (data.screens && data.screens.length > 0) {
            const mapped = data.screens.map((s: Screen) => buildScreenData(s, []));
            setScreens(mapped);
            setSettings(prev => ({ ...prev, selectedScreenId: mapped[0]?.id ?? null }));
          }
        }
      } catch { /* ignore */ }

      try {
        const { data, error } = await supabase.from("led_products").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          const mapped: Product[] = data.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            manufacturer: p.manufacturer as string,
            productName: p.product_name as string,
            tileWidthPx: Number(p.tile_width_px),
            tileHeightPx: Number(p.tile_height_px),
            tileWidthMm: p.tile_width_mm as number | null,
            tileHeightMm: p.tile_height_mm as number | null,
            tileDepthMm: p.tile_depth_mm as number | null,
            productImageUrl: p.product_image_url as string | null,
          }));
          setProducts(mapped);
          // Rebuild screens with product data
          try {
            const raw = localStorage.getItem("pixel-mapper-autosave");
            if (raw) {
              const data2 = JSON.parse(raw);
              if (data2.screens && data2.screens.length > 0) {
                const mapped2 = data2.screens.map((s: Screen) => buildScreenData(s, mapped));
                setScreens(mapped2);
              }
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }

      setLoading(false);
    })();
  }

  const selectedScreen = screens.find(s => s.id === settings.selectedScreenId) ?? screens[0] ?? null;

  const handleExport = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: settings.backgroundColor, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pre-visual-${selectedScreen?.name ?? "screen"}.png`;
      a.click();
    } catch { /* ignore */ }
  };

  const handleResetView = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const updateSettings = (patch: Partial<PreVisualSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  return (
    <div className="flex h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Left controls panel */}
      <div
        className={cn(
          "flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden transition-[width] duration-200 ease-linear",
          panelOpen ? "w-72" : "w-0"
        )}
      >
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <PreVisualControls
              settings={settings}
              onChange={updateSettings}
              onReset={handleResetView}
              screens={screens.map(s => ({ id: s.id, name: s.name }))}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
        <header className="flex-shrink-0 border-b bg-background px-4 py-2 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPanelOpen(o => !o)}
            aria-label="Toggle controls panel"
          >
            {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            Pre-Visual
            {selectedScreen && <span className="ml-2 text-foreground">{selectedScreen.name}</span>}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export PNG
            </Button>
          </div>
        </header>

        <div
          className="flex-1 overflow-auto flex items-center justify-center"
          style={{ backgroundColor: settings.backgroundColor }}
          ref={exportRef}
        >
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading project data...</div>
          ) : selectedScreen ? (
            <ScreenPreview screen={selectedScreen} settings={settings} />
          ) : (
            <div className="text-center space-y-2 text-muted-foreground">
              <p className="text-sm">No screens found.</p>
              <p className="text-xs">Create a screen in the Pixel Map first, then come back here to preview it in 3D.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
