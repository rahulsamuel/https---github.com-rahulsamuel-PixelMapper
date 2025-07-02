"use client";

import { generateRasterMap, GenerateRasterMapInput } from "@/ai/flows/generate-raster-map";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

interface Dimensions {
  tileWidth: number;
  tileHeight: number;
  screenWidth: number;
  screenHeight: number;
}

interface Tile {
  id: number;
  deleted: boolean;
}

interface PixelMapperState {
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  dimensions: Dimensions;
  setDimensions: (dims: Dimensions) => void;
  tiles: Tile[];
  toggleTile: (index: number) => void;
  restoreAll: () => void;
  deletedCount: number;
  tileColor: string;
  setTileColor: (color: string) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  handleDownloadPng: (filename: string) => void;
  handleDownloadText: (content: string, filename: string) => void;
  mapType: 'pixel' | 'raster';
  setMapType: (type: 'pixel' | 'raster') => void;
  resolution: 'HD' | '4K' | 'DCI';
  setResolution: (res: 'HD' | '4K' | 'DCI') => void;
  aiResult: string | null;
  isGenerating: boolean;
  generateMap: () => Promise<void>;
}

const PixelMapperContext = createContext<PixelMapperState | undefined>(undefined);

export const usePixelMapper = () => {
  const context = useContext(PixelMapperContext);
  if (!context) {
    throw new Error("usePixelMapper must be used within a PixelMapperProvider");
  }
  return context;
};

export function PixelMapperProvider({ children }: { children: ReactNode }) {
  const [appState] = useState("ready");
  const gridRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [dimensions, setDimensions] = useState<Dimensions>({
    tileWidth: 32,
    tileHeight: 32,
    screenWidth: 16,
    screenHeight: 9,
  });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);

  const [tileColor, setTileColor] = useState("#8f00ff");
  const [borderWidth, setBorderWidth] = useState(1);

  const [mapType, setMapType] = useState<'pixel' | 'raster'>('pixel');
  const [resolution, setResolution] = useState<'HD' | '4K' | 'DCI'>('HD');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const totalTiles = dimensions.screenWidth * dimensions.screenHeight;
    if (totalTiles > 0 && totalTiles <= 4096) { // Safety limit
        setTiles(
            Array.from({ length: totalTiles }, (_, i) => ({ id: i, deleted: false }))
        );
    } else {
        setTiles([]);
    }
  }, [dimensions]);

  useEffect(() => {
    setDeletedCount(tiles.filter((tile) => tile.deleted).length);
  }, [tiles]);

  const toggleTile = useCallback((index: number) => {
    setTiles((prev) =>
      prev.map((tile, i) => (i === index ? { ...tile, deleted: !tile.deleted } : tile))
    );
  }, []);

  const restoreAll = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, deleted: false })));
     toast({ title: "Grid Restored", description: "All tiles have been restored to their original state." });
  }, []);

  const handleDownloadPng = useCallback((filename: string) => {
    if (gridRef.current === null) {
        toast({ variant: 'destructive', title: "Error", description: "Grid element not found." });
        return;
    }

    toPng(gridRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'hsl(var(--background))' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        toast({ title: "Download Started", description: `Downloading ${filename}...` });
      })
      .catch((err) => {
        console.error(err);
        toast({ variant: 'destructive', title: "Download Failed", description: "Could not generate PNG." });
      });
  }, [gridRef, toast]);

  const handleDownloadText = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Download Started", description: `Downloading ${filename}...` });
  }, [toast]);
  

  const generateMap = useCallback(async () => {
    if (mapType === 'pixel') {
        toast({ title: "Pixel Map Generated", description: "You can download the pixel map as a PNG." });
        return;
    }

    setIsGenerating(true);
    setAiResult(null);
    try {
        const input: GenerateRasterMapInput = {
            tileWidth: dimensions.tileWidth,
            tileHeight: dimensions.tileHeight,
            screenWidthTiles: dimensions.screenWidth,
            screenHeightTiles: dimensions.screenHeight,
            outputResolution: resolution,
        };
      const result = await generateRasterMap(input);
      setAiResult(result.rasterMapDescription);
      toast({ title: "AI Raster Map Generated", description: "The result is displayed below." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "AI Generation Failed", description: "Could not generate the raster map." });
    } finally {
      setIsGenerating(false);
    }
  }, [mapType, dimensions, resolution, toast]);

  const value = {
    appState,
    gridRef,
    dimensions,
    setDimensions,
    tiles,
    toggleTile,
    restoreAll,
    deletedCount,
    tileColor,
    setTileColor,
    borderWidth,
    setBorderWidth,
    handleDownloadPng,
    handleDownloadText,
    mapType,
    setMapType,
    resolution,
    setResolution,
    aiResult,
    isGenerating,
    generateMap,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
};
