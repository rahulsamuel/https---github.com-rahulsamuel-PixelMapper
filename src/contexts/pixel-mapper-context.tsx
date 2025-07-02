
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

interface ActiveBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type ActiveTool = 'delete' | 'label' | 'color';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style';

interface RasterSlice {
  key: string;
  filename: string;
  x: number; 
  y: number; 
  width: number; 
  height: number;
}

interface RasterMapConfig {
  slices: RasterSlice[];
  totalWidth: number; 
  totalHeight: number;
  outputWidth: number;
  outputHeight: number;
}


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
  activeBounds: ActiveBounds | null;
  rasterMapConfig: RasterMapConfig | null;
  setRasterMapConfig: Dispatch<SetStateAction<RasterMapConfig | null>>;
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
  const [activeBounds, setActiveBounds] = useState<ActiveBounds | null>(null);
  const [rasterMapConfig, setRasterMapConfig] = useState<RasterMapConfig | null>(null);


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
    const { screenWidth } = dimensions;
    const activeTiles = tiles.map((t, i) => ({...t, index: i})).filter(t => !t.deleted);

    if (activeTiles.length === 0) {
        setActiveBounds(null);
        return;
    }

    let minX = screenWidth;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;

    activeTiles.forEach(tile => {
        const x = tile.index % screenWidth;
        const y = Math.floor(tile.index / screenWidth);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });
    
    setActiveBounds({ minX, minY, maxX, maxY });
  }, [tiles, dimensions]);

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
      const x = i % screenWidth;
      const y = Math.floor(i / screenWidth);
      
      switch (labelFormat) {
        case 'sequential':
          return String(i + 1);
        case 'row-col':
          return `${y + 1}-${x + 1}`;
        case 'dmx-style':
            const universeSize = 170; // 512 channels / 3 colors ~ 170 pixels
            const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / universeSize));
            const address = (i % universeSize) + 1;
            return `${universe}${address}`;
        case 'none':
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
    if (gridRef.current === null || !activeBounds) {
      return;
    }

    const node = gridRef.current;
    
    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight;

    toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // For high-quality export
        width: node.scrollWidth + 2,
        height: node.scrollHeight + 2,
    })
      .then((dataUrl) => {
        // Create a temporary canvas to crop the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = cropWidth * 2;
            canvas.height = cropHeight * 2;

            // Calculate source coordinates, considering pixelRatio
            const sx = activeBounds.minX * dimensions.tileWidth * 2;
            const sy = activeBounds.minY * dimensions.tileHeight * 2;
            const sWidth = cropWidth * 2;
            const sHeight = cropHeight * 2;
            
            ctx?.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            
            const link = document.createElement("a");
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = dataUrl;
      })
      .catch((err) => {
        console.error("Could not generate PNG.", err);
      });
  }, [gridRef, activeBounds, dimensions]);

  const handleDownloadRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    if (!activeBounds) {
        console.error("No active tiles to generate a map from.");
        return;
    }

    const { screenWidth, tileWidth, tileHeight } = dimensions;
    const totalPixelWidth = (activeBounds.maxX - activeBounds.minX + 1) * tileWidth;
    const totalPixelHeight = (activeBounds.maxY - activeBounds.minY + 1) * tileHeight;

    if (totalPixelWidth <= 0 || totalPixelHeight <= 0) {
      console.error("Invalid dimensions for raster map.");
      return;
    }

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = totalPixelWidth;
    masterCanvas.height = totalPixelHeight;
    const masterCtx = masterCanvas.getContext('2d');

    if (!masterCtx) {
      console.error("Could not get master canvas context.");
      return;
    }

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, totalPixelWidth, totalPixelHeight);

    tiles.forEach((tile, index) => {
      if (!tile.deleted) {
        const x = index % screenWidth;
        const y = Math.floor(index / screenWidth);

        if (x >= activeBounds.minX && x <= activeBounds.maxX && y >= activeBounds.minY && y <= activeBounds.maxY) {
          const tileXPos = (x - activeBounds.minX) * tileWidth;
          const tileYPos = (y - activeBounds.minY) * tileHeight;
          
          let bgColor;
          if (onOffMode) {
            bgColor = '#FFFFFF';
          } else {
            bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, tileYPos, tileWidth, tileHeight);

          if (showLabels && labels[index]) {
            const currentLabelColor = onOffMode ? '#000000' : labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + tileWidth / 2, tileYPos + tileHeight / 2);
          }
        }
      }
    });
    
    const sliceWidth = outputWidth || totalPixelWidth;
    const sliceHeight = outputHeight || totalPixelHeight;
    
    const downloadCanvas = (canvas: HTMLCanvasElement, downloadFilename: string) => {
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement("a");
            link.download = downloadFilename;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Could not generate raster map file.", err);
        }
    };

    const slices: RasterSlice[] = [];
    const baseFilename = filename.replace('.png', '');

    const effectiveSliceWidth = outputWidth ? Math.floor(outputWidth / tileWidth) * tileWidth : totalPixelWidth;
    const effectiveSliceHeight = outputHeight ? Math.floor(outputHeight / tileHeight) * tileHeight : totalPixelHeight;

    if (effectiveSliceWidth <= 0 || effectiveSliceHeight <= 0) {
        setRasterMapConfig(null);
        return;
    }
    
    let col = 0;
    for (let sx = 0; sx < totalPixelWidth; sx += effectiveSliceWidth) {
        let row = 0;
        for (let sy = 0; sy < totalPixelHeight; sy += effectiveSliceHeight) {
            const sWidth = Math.min(effectiveSliceWidth, totalPixelWidth - sx);
            const sHeight = Math.min(effectiveSliceHeight, totalPixelHeight - sy);

            if (sWidth <= 0 || sHeight <= 0) continue;

            const sliceFilename = totalPixelWidth > sliceWidth || totalPixelHeight > sliceHeight
                ? `${baseFilename}-R${row + 1}-C${col + 1}.png`
                : `${baseFilename}.png`;

            slices.push({
                key: `${row}-${col}`,
                filename: sliceFilename,
                x: sx,
                y: sy,
                width: sWidth,
                height: sHeight,
            });
            row++;
        }
        col++;
    }

    setRasterMapConfig({
        slices,
        totalWidth: totalPixelWidth,
        totalHeight: totalPixelHeight,
        outputWidth: sliceWidth,
        outputHeight: sliceHeight,
    });

    for (const slice of slices) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = sliceWidth;
        sliceCanvas.height = sliceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');
        if (!sliceCtx) continue;
        sliceCtx.fillStyle = 'black';
        sliceCtx.fillRect(0, 0, sliceWidth, sliceHeight);

        sliceCtx.drawImage(
            masterCanvas,
            slice.x, slice.y, slice.width, slice.height,
            0, 0, slice.width, slice.height
        );
        downloadCanvas(sliceCanvas, slice.filename);
    }

  }, [dimensions, tiles, labels, showLabels, onOffMode, tileColor, tileColorTwo, labelColor, labelFontSize, activeBounds]);

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
    activeBounds,
    rasterMapConfig,
    setRasterMapConfig,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
}
