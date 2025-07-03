
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction } from "react";
import type { WiringPattern } from "@/lib/wiring";
import { useToast } from "@/hooks/use-toast";

interface Dimensions {
  tileWidth: number;
  tileHeight: number;
  screenWidth: number;
  screenHeight: number;
}

interface Tile {
  id: number;
  deleted: boolean;
  color?: string;
}

interface ActiveBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type ActiveTool = 'delete' | 'label' | 'color';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style' | 'row-letter-col-number';
type ResolutionType = 'content' | 'hd' | '4k-uhd' | '4k-dci';

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
  resolutionType: ResolutionType;
}

interface RasterArgs {
  filename: string;
  outputWidth?: number;
  outputHeight?: number;
}

interface ProjectData {
  version: string;
  dimensions: Dimensions;
  tiles: Tile[];
  tileColor: string;
  tileColorTwo: string;
  borderWidth: number;
  borderColor: string;
  activeTool: ActiveTool;
  showLabels: boolean;
  labelFormat: LabelFormat;
  labelFontSize: number;
  labelColor: string;
  onOffMode: boolean;
  zoom?: number; // For backwards compatibility
  zoomLevels: { grid: number; wiring: number; raster: number; };
  activeTab: string;
  rasterOffset: { x: number; y: number; };
  lastRasterArgs: RasterArgs | null;
  wiringPortConfig: string;
  showDataLabels: boolean;
  showPowerLabels: boolean;
  wiringPattern: WiringPattern;
  powerWiringPattern: WiringPattern;
  arrowheadSize: number;
  arrowheadLength: number;
  arrowGap: number;
  powerArrowheadSize: number;
  powerArrowheadLength: number;
  powerArrowGap: number;
  brushColor: string;
  tilesPerPowerString: string;
  isWiringMirrored: boolean;
  dataLabelSize?: number;
  powerLabelSize?: number;
}

interface PixelMapperState {
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  wiringDiagramRef: React.RefObject<HTMLDivElement>;
  dimensions: Dimensions;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  tiles: Tile[];
  labels: string[];
  handleTileClick: (index: number) => void;
  restoreDeletedTiles: () => void;
  resetAllColors: () => void;
  deletedCount: number;
  coloredCount: number;
  tileColor: string;
  setTileColor: Dispatch<SetStateAction<string>>;
  tileColorTwo: string;
  setTileColorTwo: Dispatch<SetStateAction<string>>;
  borderWidth: number;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  borderColor: string;
  setBorderColor: Dispatch<SetStateAction<string>>;
  handleDownloadPng: (filename: string) => void;
  handleDownloadWiringDiagram: () => void;
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
  setZoom: (value: number | ((prev: number) => number)) => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  activeBounds: ActiveBounds | null;
  rasterMapConfig: RasterMapConfig | null;
  setRasterMapConfig: Dispatch<SetStateAction<RasterMapConfig | null>>;
  rasterOffset: { x: number; y: number; };
  setRasterOffset: Dispatch<SetStateAction<{ x: number; y: number; }>>;
  wiringPortConfig: string;
  setWiringPortConfig: Dispatch<SetStateAction<string>>;
  showDataLabels: boolean;
  setShowDataLabels: (value: boolean) => void;
  showPowerLabels: boolean;
  setShowPowerLabels: (value: boolean) => void;
  wiringPattern: WiringPattern;
  setWiringPattern: Dispatch<SetStateAction<WiringPattern>>;
  powerWiringPattern: WiringPattern;
  setPowerWiringPattern: Dispatch<SetStateAction<WiringPattern>>;
  arrowheadSize: number;
  setArrowheadSize: Dispatch<SetStateAction<number>>;
  arrowheadLength: number;
  setArrowheadLength: Dispatch<SetStateAction<number>>;
  arrowGap: number;
  setArrowGap: Dispatch<SetStateAction<number>>;
  powerArrowheadSize: number;
  setPowerArrowheadSize: Dispatch<SetStateAction<number>>;
  powerArrowheadLength: number;
  setPowerArrowheadLength: Dispatch<SetStateAction<number>>;
  powerArrowGap: number;
  setPowerArrowGap: Dispatch<SetStateAction<number>>;
  exportProject: () => void;
  importProject: (file: File) => void;
  brushColor: string;
  setBrushColor: Dispatch<SetStateAction<string>>;
  isWiringMirrored: boolean;
  setIsWiringMirrored: Dispatch<SetStateAction<boolean>>;
  tilesPerPowerString: string;
  setTilesPerPowerString: Dispatch<SetStateAction<string>>;
  dataLabelSize: number;
  setDataLabelSize: Dispatch<SetStateAction<number>>;
  powerLabelSize: number;
  setPowerLabelSize: Dispatch<SetStateAction<number>>;
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
  const wiringDiagramRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [dimensions, setDimensions] = useState<Dimensions>({
    tileWidth: 200,
    tileHeight: 200,
    screenWidth: 5,
    screenHeight: 3,
  });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [coloredCount, setColoredCount] = useState(0);

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
  
  const [zoomLevels, setZoomLevels] = useState({ grid: 1, wiring: 1, raster: 1 });
  const [activeTab, setActiveTab] = useState('grid');
  
  const [onOffMode, setOnOffMode] = useState(false);
  const [activeBounds, setActiveBounds] = useState<ActiveBounds | null>(null);
  const [brushColor, setBrushColor] = useState<string>("#e11d48");
  
  // Raster Map State
  const [rasterMapConfig, setRasterMapConfig] = useState<RasterMapConfig | null>(null);
  const [rasterOffset, setRasterOffset] = useState({ x: 0, y: 0 });
  const [lastRasterArgs, setLastRasterArgs] = useState<RasterArgs | null>(null);

  // Wiring state
  const [wiringPortConfig, setWiringPortConfig] = useState("4");
  const [tilesPerPowerString, setTilesPerPowerString] = useState("20");
  const [showDataLabels, setShowDataLabelsState] = useState(true);
  const [showPowerLabels, setShowPowerLabelsState] = useState(false);
  const [wiringPattern, setWiringPattern] = useState<WiringPattern>('serpentine-horizontal');
  const [powerWiringPattern, setPowerWiringPattern] = useState<WiringPattern>('left-right');
  const [arrowheadSize, setArrowheadSize] = useState(20);
  const [arrowheadLength, setArrowheadLength] = useState(30);
  const [arrowGap, setArrowGap] = useState(50);
  const [powerArrowheadSize, setPowerArrowheadSize] = useState(20);
  const [powerArrowheadLength, setPowerArrowheadLength] = useState(30);
  const [powerArrowGap, setPowerArrowGap] = useState(50);
  const [isWiringMirrored, setIsWiringMirrored] = useState(false);
  const [dataLabelSize, setDataLabelSize] = useState(100);
  const [powerLabelSize, setPowerLabelSize] = useState(100);

  const zoom = zoomLevels[activeTab as keyof typeof zoomLevels] || 1;
  
  const setZoom = (value: number | ((prevZoom: number) => number)) => {
    setZoomLevels(prevLevels => {
      const currentTabKey = activeTab as keyof typeof prevLevels;
      const currentZoom = prevLevels[currentTabKey];
      const newZoom = typeof value === 'function' ? value(currentZoom) : value;
      return {
        ...prevLevels,
        [currentTabKey]: newZoom,
      };
    });
  };

  const setShowDataLabels = (value: boolean) => {
    setShowDataLabelsState(value);
    if (value) {
      setShowPowerLabelsState(false);
    }
  };

  const setShowPowerLabels = (value: boolean) => {
    setShowPowerLabelsState(value);
    if (value) {
      setShowDataLabelsState(false);
    }
  };


  useEffect(() => {
    const { screenWidth, screenHeight } = dimensions;
    const totalTiles = screenWidth * screenHeight;

    if (tiles.length === totalTiles) {
      return;
    }

    if (totalTiles > 0 && totalTiles <= 4096) { // Safety limit
      setTiles(
        Array.from({ length: totalTiles }, (_, i) => ({ id: i, deleted: false }))
      );
    } else {
      setTiles([]);
    }
  }, [dimensions, tiles.length]);

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
    setColoredCount(tiles.filter((tile) => !!tile.color && !tile.deleted).length);
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
        case 'row-letter-col-number':
            const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y);
            const colNumber = x + 1;
            return `${rowLetter}${colNumber}`;
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
        setTiles((prev) =>
            prev.map((tile, i) =>
                i === index ? { ...tile, color: brushColor, deleted: false } : tile
            )
        );
        break;
      default:
        break;
    }
  }, [activeTool, toggleTile, brushColor]);

  const restoreDeletedTiles = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, deleted: false })));
  }, []);
  
  const resetAllColors = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, color: undefined })));
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
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          transform: 'none',
        }
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
    
    let resolutionType: ResolutionType = 'content';
    if (outputWidth === 1920 && outputHeight === 1080) resolutionType = 'hd';
    else if (outputWidth === 3840 && outputHeight === 2160) resolutionType = '4k-uhd';
    else if (outputWidth === 4096 && outputHeight === 2160) resolutionType = '4k-dci';

    // Calculate slices
    const slices: RasterSlice[] = [];
    const baseFilename = filename.replace('.png', '');
    const numCols = Math.ceil(contentWidth / finalOutputWidth);
    const numRows = Math.ceil(contentHeight / finalOutputHeight);

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const sliceX = col * finalOutputWidth;
            const sliceY = row * finalOutputHeight;
            
            const sliceContentWidth = Math.min(finalOutputWidth, contentWidth - sliceX);
            const sliceContentHeight = Math.min(finalOutputHeight, contentHeight - sliceY);

            if (sliceContentWidth <= 0 || sliceContentHeight <= 0) continue;

            const sliceFilename = (numCols > 1 || numRows > 1)
              ? `${baseFilename}-R${row + 1}-C${col + 1}.png`
              : `${baseFilename}.png`;

            slices.push({
                key: `${row}-${col}`,
                filename: sliceFilename,
                x: sliceX,
                y: sliceY,
                width: finalOutputWidth, // The output file is always the full size
                height: finalOutputHeight
            });
        }
    }

    // Generate the FULL content preview image
    const fullContentCanvas = document.createElement('canvas');
    fullContentCanvas.width = contentWidth;
    fullContentCanvas.height = contentHeight;
    const masterCtx = fullContentCanvas.getContext('2d');

    if (!masterCtx) {
      setRasterMapConfig(null);
      return;
    }

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, fullContentCanvas.width, fullContentCanvas.height);

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
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, tileYPos, tileWidth, tileHeight);

          if (borderWidth > 0) {
              masterCtx.strokeStyle = borderColor;
              masterCtx.lineWidth = borderWidth;
              masterCtx.strokeRect(
                  tileXPos + borderWidth / 2, 
                  tileYPos + borderWidth / 2, 
                  tileWidth - borderWidth, 
                  tileHeight - borderWidth
              );
          }

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
    
    const previewImage = fullContentCanvas.toDataURL('image/png');

    setRasterMapConfig({
        slices,
        totalWidth: contentWidth,
        totalHeight: contentHeight,
        outputWidth: finalOutputWidth,
        outputHeight: finalOutputHeight,
        previewImage,
        rasterOffset,
        resolutionType,
    });
  }, [activeBounds, lastRasterArgs, dimensions, tiles, onOffMode, tileColor, tileColorTwo, showLabels, labels, labelColor, labelFontSize, rasterOffset, borderWidth, borderColor]);


  useEffect(() => {
    if (lastRasterArgs) {
      regenerateRasterPreview();
    }
  }, [regenerateRasterPreview, lastRasterArgs]);
  
  const generateRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    setLastRasterArgs({ filename, outputWidth, outputHeight });
    setRasterOffset({ x: 0, y: 0 }); // Reset offset when generating a new map type
  }, []);

  useEffect(() => {
    // Set default raster map on initial load
    if (activeBounds && !lastRasterArgs) {
        generateRasterMap('raster-map-content.png');
    }
  }, [generateRasterMap, activeBounds, lastRasterArgs]);

  const createFullRasterCanvas = useCallback(() => {
    if (!activeBounds) return null;

    const { screenWidth, tileWidth, tileHeight } = dimensions;

    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * tileWidth;
    const contentHeight = (activeBounds.maxY - activeBounds.minY + 1) * tileHeight;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

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
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, tileYPos, tileWidth, tileHeight);

          if (borderWidth > 0) {
            masterCtx.strokeStyle = borderColor;
            masterCtx.lineWidth = borderWidth;
            masterCtx.strokeRect(tileXPos + borderWidth / 2, tileYPos + borderWidth / 2, tileWidth - borderWidth, tileHeight - borderWidth);
          }


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

    return masterCanvas;
  }, [activeBounds, dimensions, tiles, labels, showLabels, onOffMode, tileColor, tileColorTwo, labelColor, labelFontSize, borderWidth, borderColor]);


  const downloadRasterSlices = useCallback(() => {
    if (!rasterMapConfig) {
        console.error("No raster map configuration available to download.");
        return;
    }
    
    const masterContentCanvas = createFullRasterCanvas();
    if (!masterContentCanvas) {
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
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = slice.width;
        outputCanvas.height = slice.height;
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) continue;
        
        outputCtx.fillStyle = 'black';
        outputCtx.fillRect(0,0, outputCanvas.width, outputCanvas.height);
        
        // Calculate the destination coordinates for the full content canvas
        // relative to the current slice's origin.
        const destX = rasterOffset.x - slice.x;
        const destY = rasterOffset.y - slice.y;

        // Draw the entire content canvas. The destination canvas acts as a viewport/clipper.
        outputCtx.drawImage(
            masterContentCanvas,
            destX, 
            destY
        );
        
        downloadCanvas(outputCanvas, slice.filename);
    }
  }, [rasterMapConfig, createFullRasterCanvas, rasterOffset]);
  
  const handleDownloadWiringDiagram = useCallback(() => {
    if (wiringDiagramRef.current === null || !activeBounds) {
      toast({
        title: "Download Failed",
        description: "Wiring diagram component or active grid is not ready.",
        variant: "destructive",
      });
      return;
    }

    const node = wiringDiagramRef.current;
    
    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight;

    toPng(node, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      width: node.scrollWidth,
      height: node.scrollHeight,
      style: {
        transform: 'none',
      }
    })
      .then((dataUrl) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = cropWidth * 2;
            canvas.height = cropHeight * 2;

            const sWidth = cropWidth * 2;
            const sHeight = cropHeight * 2;
            const sy = activeBounds.minY * dimensions.tileHeight * 2;
            
            const sx = isWiringMirrored 
                ? (dimensions.screenWidth - 1 - activeBounds.maxX) * dimensions.tileWidth * 2
                : activeBounds.minX * dimensions.tileWidth * 2;

            ctx?.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            
            const link = document.createElement("a");
            link.download = `wiring-diagram${isWiringMirrored ? '-mirrored' : ''}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            toast({
              title: "Download Started",
              description: "Your wiring diagram is being downloaded.",
            });
        };
        img.src = dataUrl;
      })
      .catch((err) => {
        console.error("Failed to generate wiring diagram image", err);
        toast({
          title: "Download Failed",
          description: "Could not generate the wiring diagram image.",
          variant: "destructive",
        });
      });
  }, [wiringDiagramRef, isWiringMirrored, toast, activeBounds, dimensions]);

  const exportProject = useCallback(() => {
    const projectData: ProjectData = {
      version: "1.0.1",
      dimensions,
      tiles,
      tileColor,
      tileColorTwo,
      borderWidth,
      borderColor,
      activeTool,
      showLabels,
      labelFormat,
      labelFontSize,
      labelColor,
      onOffMode,
      zoomLevels,
      activeTab,
      rasterOffset,
      lastRasterArgs,
      wiringPortConfig,
      showDataLabels,
      showPowerLabels,
      wiringPattern,
      powerWiringPattern,
      arrowheadSize,
      arrowheadLength,
      arrowGap,
      powerArrowheadSize,
      powerArrowheadLength,
      powerArrowGap,
      brushColor,
      tilesPerPowerString,
      isWiringMirrored,
      dataLabelSize,
      powerLabelSize,
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "pixel-mapper-project.json";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Project saved to pixel-mapper-project.json",
    });
  }, [
    dimensions, tiles, tileColor, tileColorTwo, borderWidth, borderColor, activeTool,
    showLabels, labelFormat, labelFontSize, labelColor, onOffMode, zoomLevels, activeTab, rasterOffset,
    lastRasterArgs, wiringPortConfig, showDataLabels, showPowerLabels, wiringPattern,
    powerWiringPattern, arrowheadSize, arrowheadLength, arrowGap,
    powerArrowheadSize, powerArrowheadLength, powerArrowGap, brushColor, 
    tilesPerPowerString, isWiringMirrored, dataLabelSize, powerLabelSize, toast
  ]);
  
  const importProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          toast({
            title: "Import Failed",
            description: "Could not read the selected file.",
            variant: "destructive",
          });
          return;
        }
        const data: ProjectData = JSON.parse(result);

        // Basic validation
        if (!data.version || !data.dimensions || !data.tiles) {
          throw new Error("Invalid project file format.");
        }

        // Apply state
        setDimensions(data.dimensions);
        // Important: Set tiles *after* dimensions, and don't rely on the useEffect.
        // This preserves the `deleted` state from the imported file.
        setTiles(data.tiles); 
        setTileColor(data.tileColor);
        setTileColorTwo(data.tileColorTwo);
        setBorderWidth(data.borderWidth);
        setBorderColor(data.borderColor);
        setActiveTool(data.activeTool);
        setShowLabels(data.showLabels);
        setLabelFormat(data.labelFormat);
        setLabelFontSize(data.labelFontSize);
        setLabelColor(data.labelColor);
        setOnOffMode(data.onOffMode);
        
        if (data.zoomLevels) {
          setZoomLevels(data.zoomLevels);
        } else if (data.zoom) {
          // Handle legacy projects with a single zoom value
          const legacyZoom = data.zoom;
          setZoomLevels({ grid: legacyZoom, wiring: legacyZoom, raster: legacyZoom });
        }
        
        setActiveTab(data.activeTab || 'grid');
        setRasterOffset(data.rasterOffset);
        setLastRasterArgs(data.lastRasterArgs);
        setWiringPortConfig(data.wiringPortConfig);
        setShowDataLabelsState(data.showDataLabels);
        setShowPowerLabelsState(data.showPowerLabels);
        setWiringPattern(data.wiringPattern);
        setPowerWiringPattern(data.powerWiringPattern || 'left-right');
        setArrowheadSize(data.arrowheadSize || 20);
        setArrowheadLength(data.arrowheadLength || 30);
        setArrowGap(data.arrowGap || 50);
        setPowerArrowheadSize(data.powerArrowheadSize || 20);
        setPowerArrowheadLength(data.powerArrowheadLength || 30);
        setPowerArrowGap(data.powerArrowGap || 50);
        setBrushColor(data.brushColor || "#e11d48");
        setTilesPerPowerString(data.tilesPerPowerString || "20");
        setIsWiringMirrored(data.isWiringMirrored || false);
        setDataLabelSize(data.dataLabelSize || 100);
        setPowerLabelSize(data.powerLabelSize || 100);
        
        toast({
          title: "Import Successful",
          description: "Your project has been loaded.",
        });

      } catch (error) {
        console.error("Failed to parse project file:", error);
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid PixelMapper project file.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
       toast({
        title: "Import Failed",
        description: "An error occurred while reading the file.",
        variant: "destructive",
      });
    }
    reader.readAsText(file);
  }, [toast]);


  const value = {
    appState,
    gridRef,
    wiringDiagramRef,
    dimensions,
    setDimensions,
    tiles,
    labels,
    handleTileClick,
    restoreDeletedTiles,
    resetAllColors,
    deletedCount,
    coloredCount,
    tileColor,
    setTileColor,
    tileColorTwo,
    setTileColorTwo,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    handleDownloadPng,
    handleDownloadWiringDiagram,
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
    activeTab,
    setActiveTab,
    activeBounds,
    rasterMapConfig,
    setRasterMapConfig,
    rasterOffset,
    setRasterOffset,
    wiringPortConfig,
    setWiringPortConfig,
    tilesPerPowerString,
    setTilesPerPowerString,
    showDataLabels,
    setShowDataLabels,
    showPowerLabels,
    setShowPowerLabels,
    wiringPattern,
    setWiringPattern,
    powerWiringPattern,
    setPowerWiringPattern,
    arrowheadSize,
    setArrowheadSize,
    arrowheadLength,
    setArrowheadLength,
    arrowGap,
    setArrowGap,
    powerArrowheadSize,
    setPowerArrowheadSize,
    powerArrowheadLength,
    setPowerArrowheadLength,
    powerArrowGap,
    setPowerArrowGap,
    exportProject,
    importProject,
    brushColor,
    setBrushColor,
    isWiringMirrored,
    setIsWiringMirrored,
    dataLabelSize,
    setDataLabelSize,
    powerLabelSize,
    setPowerLabelSize,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
}
