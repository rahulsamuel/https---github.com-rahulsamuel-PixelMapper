
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
  previewImage?: string;
  rasterOffset: { x: number; y: number; };
}

interface RasterArgs {
  filename: string;
  outputWidth?: number;
  outputHeight?: number;
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
  generateRasterMap: (filename: string, outputWidth?: number, outputHeight?: number) => void;
  downloadRasterSlices: () => void;
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
  rasterOffset: { x: number; y: number; };
  setRasterOffset: Dispatch<SetStateAction<{ x: number; y: number; }>>;
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
  
  // Raster Map State
  const [rasterMapConfig, setRasterMapConfig] = useState<RasterMapConfig | null>(null);
  const [rasterOffset, setRasterOffset] = useState({ x: 0, y: 0 });
  const [lastRasterArgs, setLastRasterArgs] = useState<RasterArgs | null>(null);


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

  const regenerateRasterPreview = useCallback(() => {
    if (!activeBounds || !lastRasterArgs) {
        setRasterMapConfig(null);
        return;
    }
    const { filename, outputWidth, outputHeight } = lastRasterArgs;
    const { screenWidth, tileWidth, tileHeight } = dimensions;
    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * tileWidth;
    const contentHeight = (activeBounds.maxY - activeBounds.minY + 1) * tileHeight;

    if (contentWidth <= 0 || contentHeight <= 0) {
      setRasterMapConfig(null);
      return;
    }

    const finalOutputWidth = outputWidth || contentWidth;
    const finalOutputHeight = outputHeight || contentHeight;
    
    const slices: RasterSlice[] = [];
    const baseFilename = filename.replace('.png', '');

    // If we have a fixed output size (e.g. 1920x1080) and the content fits inside it,
    // we only need one slice that covers the entire output area.
    if (outputWidth && outputHeight && contentWidth <= outputWidth && contentHeight <= outputHeight) {
        slices.push({
            key: '0-0',
            filename: `${baseFilename}.png`,
            x: 0,
            y: 0,
            width: outputWidth,
            height: outputHeight,
        });
    } else {
        // Otherwise, if the content is larger than a single output, we slice it.
        const sliceTargetWidth = outputWidth || contentWidth;
        const sliceTargetHeight = outputHeight || contentHeight;
        
        const numCols = Math.ceil(contentWidth / sliceTargetWidth);
        const numRows = Math.ceil(contentHeight / sliceTargetHeight);

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const sliceX = col * sliceTargetWidth;
                const sliceY = row * sliceTargetHeight;
                
                // The size of this specific slice of content
                const sliceW = Math.min(sliceTargetWidth, contentWidth - sliceX);
                const sliceH = Math.min(sliceTargetHeight, contentHeight - sliceY);

                if (sliceW <= 0 || sliceH <= 0) continue;

                const sliceFilename = (numCols > 1 || numRows > 1)
                  ? `${baseFilename}-R${row + 1}-C${col + 1}.png`
                  : `${baseFilename}.png`;

                slices.push({
                    key: `${row}-${col}`,
                    filename: sliceFilename,
                    x: sliceX,
                    y: sliceY,
                    width: sliceW,
                    height: sliceH
                });
            }
        }
    }

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = finalOutputWidth;
    masterCanvas.height = finalOutputHeight;
    const masterCtx = masterCanvas.getContext('2d');

    if (!masterCtx) {
      setRasterMapConfig(null);
      return;
    }

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, finalOutputWidth, finalOutputHeight);

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
          masterCtx.fillRect(tileXPos + rasterOffset.x, tileYPos + rasterOffset.y, tileWidth, tileHeight);

          if (showLabels && labels[index]) {
            const currentLabelColor = onOffMode ? '#000000' : labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + rasterOffset.x + tileWidth / 2, tileYPos + rasterOffset.y + tileHeight / 2);
          }
        }
      }
    });
    
    const previewImage = masterCanvas.toDataURL('image/png');

    setRasterMapConfig({
        slices,
        totalWidth: finalOutputWidth,
        totalHeight: finalOutputHeight,
        outputWidth: finalOutputWidth,
        outputHeight: finalOutputHeight,
        previewImage,
        rasterOffset,
    });
  }, [activeBounds, lastRasterArgs, dimensions, tiles, onOffMode, tileColor, tileColorTwo, showLabels, labels, labelColor, labelFontSize, rasterOffset]);


  useEffect(() => {
    if (lastRasterArgs) {
      regenerateRasterPreview();
    }
  }, [regenerateRasterPreview]);
  
  const generateRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    setLastRasterArgs({ filename, outputWidth, outputHeight });
    setRasterOffset({ x: 0, y: 0 }); // Reset offset when generating a new map type
  }, []);

  useEffect(() => {
    // Set default raster map on initial load
    generateRasterMap('raster-map-hd.png', 1920, 1080);
  }, [generateRasterMap]);

  const createFullRasterCanvas = useCallback(() => {
    if (!rasterMapConfig || !activeBounds) return null;

    const { screenWidth, tileWidth, tileHeight } = dimensions;
    const { totalWidth, totalHeight, rasterOffset } = rasterMapConfig;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = totalWidth;
    masterCanvas.height = totalHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, totalWidth, totalHeight);

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
          masterCtx.fillRect(tileXPos + rasterOffset.x, tileYPos + rasterOffset.y, tileWidth, tileHeight);

          if (showLabels && labels[index]) {
            const currentLabelColor = onOffMode ? '#000000' : labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + rasterOffset.x + tileWidth / 2, tileYPos + rasterOffset.y + tileHeight / 2);
          }
        }
      }
    });

    return masterCanvas;
  }, [rasterMapConfig, activeBounds, dimensions, tiles, labels, showLabels, onOffMode, tileColor, tileColorTwo, labelColor, labelFontSize]);


  const downloadRasterSlices = useCallback(() => {
    if (!rasterMapConfig) {
        console.error("No raster map configuration available to download.");
        return;
    }
    
    const masterCanvas = createFullRasterCanvas();
    if (!masterCanvas) {
      console.error("Failed to create master canvas for download.");
      return;
    }

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
    
    for (const slice of rasterMapConfig.slices) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = slice.width;
        sliceCanvas.height = slice.height;
        const sliceCtx = sliceCanvas.getContext('2d');
        if (!sliceCtx) continue;
        
        sliceCtx.drawImage(
            masterCanvas,
            slice.x, slice.y, slice.width, slice.height,
            0, 0, slice.width, slice.height
        );
        
        // If the slice is smaller than the intended output, create a full-size canvas and place the slice
        if (slice.width < rasterMapConfig.outputWidth || slice.height < rasterMapConfig.outputHeight) {
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = rasterMapConfig.outputWidth;
            outputCanvas.height = rasterMapConfig.outputHeight;
            const outputCtx = outputCanvas.getContext('2d');
            if (!outputCtx) continue;
            outputCtx.fillStyle = 'black';
            outputCtx.fillRect(0,0, outputCanvas.width, outputCanvas.height);
            outputCtx.drawImage(sliceCanvas, 0, 0);
            downloadCanvas(outputCanvas, slice.filename);
        } else {
            downloadCanvas(sliceCanvas, slice.filename);
        }
    }
  }, [rasterMapConfig, createFullRasterCanvas]);


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
    generateRasterMap,
    downloadRasterSlices,
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
    rasterOffset,
    setRasterOffset,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
}
