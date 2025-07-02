
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction } from "react";

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

type ActiveTool = 'delete' | 'label' | 'color';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style';

interface PixelMapperState {
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  dimensions: Dimensions;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  tiles: Tile[];
  labels: string[];
  handleTileClick: (index: number) => void;
  restoreAll: () => void;
  deletedCount: number;
  tileColor: string;
  setTileColor: Dispatch<SetStateAction<string>>;
  tileColorTwo: string;
  setTileColorTwo: Dispatch<SetStateAction<string>>;
  borderWidth: number;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  borderColor: string;
  setBorderColor: Dispatch<SetStateAction<string>>;
  handleDownloadPng: (filename: string) => void;
  handleDownloadRasterMap: (filename: string, outputWidth?: number, outputHeight?: number) => void;
  activeTool: ActiveTool;
  setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
  showLabels: boolean;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
  labelFormat: LabelFormat;
  setLabelFormat: Dispatch<SetStateAction<LabelFormat>>;
  labelFontSize: number;
  setLabelFontSize: Dispatch<SetStateAction<number>>;
  labelColor: string;
  setLabelColor: Dispatch<SetStateAction<string>>;
  onOffMode: boolean;
  setOnOffMode: Dispatch<SetStateAction<boolean>>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
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

  const [dimensions, setDimensions] = useState<Dimensions>({
    tileWidth: 200,
    tileHeight: 200,
    screenWidth: 5,
    screenHeight: 3,
  });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);

  const [tileColor, setTileColor] = useState("#3961b1");
  const [tileColorTwo, setTileColorTwo] = useState("#a7b8ec");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [activeTool, setActiveTool] = useState<ActiveTool>("delete");
  
  // Labeling state
  const [showLabels, setShowLabels] = useState(true);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('sequential');
  const [labelFontSize, setLabelFontSize] = useState(48);
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [labels, setLabels] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [onOffMode, setOnOffMode] = useState(false);


  useEffect(() => {
    const { screenWidth, screenHeight } = dimensions;
    const totalTiles = screenWidth * screenHeight;
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

  useEffect(() => {
    const { screenWidth, screenHeight } = dimensions;
    const totalTiles = screenWidth * screenHeight;
    if (totalTiles <= 0) {
        setLabels([]);
        return;
    }

    const newLabels = Array.from({ length: totalTiles }, (_, i) => {
      if (labelFormat === 'none') return '';

      switch (labelFormat) {
        case 'sequential':
          return String(i + 1);
        case 'row-col':
          const y = Math.floor(i / screenWidth) + 1;
          const x = (i % screenWidth) + 1;
          return `${y}-${x}`;
        case 'dmx-style':
            const universeSize = 170; // 512 channels / 3 colors ~ 170 pixels
            const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / universeSize));
            const address = (i % universeSize) + 1;
            return `${universe}${address}`;
        default:
          return '';
      }
    });
    setLabels(newLabels);
  }, [dimensions, labelFormat]);

  const toggleTile = useCallback((index: number) => {
    setTiles((prev) =>
      prev.map((tile, i) => (i === index ? { ...tile, deleted: !tile.deleted } : tile))
    );
  }, []);

  const handleTileClick = useCallback((index: number) => {
    switch (activeTool) {
      case 'delete':
        toggleTile(index);
        break;
      case 'color':
        // Placeholder for color functionality
        console.log(`Color tool clicked on tile ${index}`);
        break;
      default:
        break;
    }
  }, [activeTool, toggleTile]);

  const restoreAll = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, deleted: false })));
  }, []);

  const handleDownloadPng = useCallback((filename: string) => {
    if (gridRef.current === null) {
      return;
    }

    const node = gridRef.current;
    
    // The library can sometimes clip the right and bottom borders.
    // To fix this, we'll use the element's rendered size and add a small
    // 2px buffer to the capture area to ensure nothing is cut off.
    toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // For high-quality export
        width: node.offsetWidth + 2,
        height: node.offsetHeight + 2,
        style: {
            transform: 'none', // Reset any scaling/panning for the capture
            zoom: 1,
            margin: '0' // Ensure the element is flush against the top-left of the canvas
        }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Could not generate PNG.", err);
      });
  }, [gridRef]);

  const handleDownloadRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    const { screenWidth, screenHeight, tileWidth, tileHeight } = dimensions;
    const contentWidth = screenWidth * tileWidth;
    const contentHeight = screenHeight * tileHeight;

    if (contentWidth <= 0 || contentHeight <= 0) {
      console.error("Invalid dimensions for raster map.");
      return;
    }

    const finalWidth = outputWidth || contentWidth;
    const finalHeight = outputHeight || contentHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error("Could not get canvas context.");
      return;
    }

    // Fill background with black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Draw the white tiles
    ctx.fillStyle = 'white';
    tiles.forEach((tile, index) => {
      if (!tile.deleted) {
        const x = (index % screenWidth) * tileWidth;
        const y = Math.floor(index / screenWidth) * tileHeight;
        ctx.fillRect(x, y, tileWidth, tileHeight);
      }
    });

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Could not generate raster map.", err);
    }
  }, [dimensions, tiles]);

  const value = {
    appState,
    gridRef,
    dimensions,
    setDimensions,
    tiles,
    labels,
    handleTileClick,
    restoreAll,
    deletedCount,
    tileColor,
    setTileColor,
    tileColorTwo,
    setTileColorTwo,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    handleDownloadPng,
    handleDownloadRasterMap,
    activeTool,
    setActiveTool,
    showLabels,
    setShowLabels,
    labelFormat,
    setLabelFormat,
    labelFontSize,
    setLabelFontSize,
    labelColor,
    setLabelColor,
    onOffMode,
    setOnOffMode,
    zoom,
    setZoom,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
}
