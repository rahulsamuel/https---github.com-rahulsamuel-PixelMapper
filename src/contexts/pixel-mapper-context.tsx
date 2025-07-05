
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction, useMemo } from "react";
import { getWiringData, type WiringPattern, getPathOrder } from "@/lib/wiring";
import { useToast } from "@/hooks/use-toast";
import { isColorDark } from "@/lib/utils";

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
type LabelPosition = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
type LabelColorMode = 'single' | 'auto';
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
  contentWidth: number;
  contentHeight: number;
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
  labelPosition: LabelPosition;
  labelColorMode: LabelColorMode;
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
  showSliceOffsetLabels: boolean;
  topHalfTile?: boolean;
  bottomHalfTile?: boolean;
}

interface PixelMapperState {
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  wiringDiagramRef: React.RefObject<HTMLDivElement>;
  dimensions: Dimensions;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  tiles: Tile[];
  labels: string[];
  sliceOffsetLabels: string[];
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
  labelPosition: LabelPosition;
  setLabelPosition: Dispatch<SetStateAction<LabelPosition>>;
  labelColorMode: LabelColorMode;
  setLabelColorMode: Dispatch<SetStateAction<LabelColorMode>>;
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
  calculateAndApplyOptimalOffset: () => void;
  showSliceOffsetLabels: boolean;
  setShowSliceOffsetLabels: Dispatch<SetStateAction<boolean>>;
  topHalfTile: boolean;
  setTopHalfTile: Dispatch<SetStateAction<boolean>>;
  bottomHalfTile: boolean;
  setBottomHalfTile: Dispatch<SetStateAction<boolean>>;
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

  const [tileColor, setTileColor] = useState("#273a5e");
  const [tileColorTwo, setTileColorTwo] = useState("#d1d9e6");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [activeTool, setActiveTool] = useState<ActiveTool>("delete");
  
  // Labeling state
  const [showLabels, setShowLabels] = useState(true);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('row-col');
  const [labelFontSize, setLabelFontSize] = useState(30);
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [labelPosition, setLabelPosition] = useState<LabelPosition>('center');
  const [labelColorMode, setLabelColorMode] = useState<LabelColorMode>('auto');
  const [labels, setLabels] = useState<string[]>([]);
  const [sliceOffsetLabels, setSliceOffsetLabels] = useState<string[]>([]);
  
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
  const [showSliceOffsetLabels, setShowSliceOffsetLabels] = useState(true);
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

  // Half-tile state
  const [topHalfTile, setTopHalfTile] = useState(false);
  const [bottomHalfTile, setBottomHalfTile] = useState(false);

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

    const newLabels = Array(totalTiles).fill('');
    const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);
    const pathOrder = getPathOrder(activeTileIndices, wiringPattern, screenWidth, screenHeight);

    if (labelFormat === 'sequential' || labelFormat === 'dmx-style') {
      pathOrder.forEach((originalIndex, pathIndex) => {
        if (labelFormat === 'sequential') {
          newLabels[originalIndex] = String(pathIndex + 1);
        } else { // dmx-style
          const universeSize = 170;
          const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(pathIndex / universeSize));
          const address = (pathIndex % universeSize) + 1;
          newLabels[originalIndex] = `${universe}${address}`;
        }
      });
    } else if (labelFormat !== 'none') {
      for (let i = 0; i < totalTiles; i++) {
        if (tiles[i] && !tiles[i].deleted) {
          const x = i % screenWidth;
          const y = Math.floor(i / screenWidth);
          
          switch (labelFormat) {
            case 'row-col':
              newLabels[i] = `${y + 1}-${x + 1}`;
              break;
            case 'row-letter-col-number':
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y);
              const colNumber = x + 1;
              newLabels[i] = `${rowLetter}${colNumber}`;
              break;
          }
        }
      }
    }
    
    setLabels(newLabels);
  }, [dimensions, labelFormat, tiles, wiringPattern]);

  // Effect to calculate slice offset labels
  useEffect(() => {
    if (!rasterMapConfig || !activeBounds || !rasterMapConfig.slices.length || !rasterOffset || !wiringPattern) {
      setSliceOffsetLabels([]);
      return;
    }

    const { screenWidth, screenHeight, tileWidth, tileHeight } = dimensions;
    const { slices, outputWidth, outputHeight } = rasterMapConfig;
    
    const newLabels = Array(screenWidth * screenHeight).fill('');
    const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);

    const tilesBySlice = new Map<string, number[]>();
    activeTileIndices.forEach(index => {
      const x = index % screenWidth;
      const y = Math.floor(index / screenWidth);

      if (x < activeBounds.minX || x > activeBounds.maxX || y < activeBounds.minY || y > activeBounds.maxY) {
                return;
              }
      
      const tileContentX = (x - activeBounds.minX) * tileWidth;
      const tileContentY = (() => {
        let height = 0;
        for (let i = activeBounds.minY; i < y; i++) {
          const isTopRow = i === 0;
          const isBottomRow = i === screenHeight - 1;
          let rowHeight = tileHeight;
          if (isTopRow && topHalfTile) {
            rowHeight /= 2;
          } else if (isBottomRow && bottomHalfTile) {
            rowHeight /= 2;
          }
          height += rowHeight;
        }
        return height;
      })();
      
      const absoluteContentX = tileContentX + rasterOffset.x;
      const absoluteContentY = tileContentY + rasterOffset.y;

      const sliceCol = Math.floor(absoluteContentX / outputWidth);
      const sliceRow = Math.floor(absoluteContentY / outputHeight);
      const sliceKey = `${sliceRow}-${sliceCol}`;
      
      if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
      tilesBySlice.get(sliceKey)!.push(index);
    });

    tilesBySlice.forEach((sliceIndices, sliceKey) => {
      const pathOrder = getPathOrder(sliceIndices, wiringPattern, screenWidth, screenHeight);
      const currentSlice = slices.find(s => s.key === sliceKey);
      
      if (currentSlice && pathOrder.length > 0) {
        const firstTileIndex = pathOrder[0];
        
        const x = firstTileIndex % screenWidth;
        const y = Math.floor(firstTileIndex / screenWidth);

        const tileContentX = (x - activeBounds.minX) * tileWidth;
        const tileContentY = (() => {
          let height = 0;
          for (let i = activeBounds.minY; i < y; i++) {
            const isTopRow = i === 0;
            const isBottomRow = i === screenHeight - 1;
            let rowHeight = tileHeight;
            if (isTopRow && topHalfTile) {
              rowHeight /= 2;
            } else if (isBottomRow && bottomHalfTile) {
              rowHeight /= 2;
            }
            height += rowHeight;
          }
          return height;
        })();

        const absoluteContentX = tileContentX + rasterOffset.x;
        const absoluteContentY = tileContentY + rasterOffset.y;

        const offsetXInSlice = absoluteContentX - currentSlice.x;
        const offsetYInSlice = absoluteContentY - currentSlice.y;

        newLabels[firstTileIndex] = `(${offsetXInSlice},${offsetYInSlice})`;
      }
    });

    setSliceOffsetLabels(newLabels);
  }, [tiles, dimensions, rasterMapConfig, activeBounds, rasterOffset, wiringPattern, topHalfTile, bottomHalfTile]);


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
    
    const rowYPositions = [0];
    let accumulator = 0;
    for (let i = 0; i < dimensions.screenHeight -1; i++) {
        const isTopRow = i === 0;
        const rowHeight = (isTopRow && topHalfTile) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
        accumulator += rowHeight;
        rowYPositions.push(accumulator);
    }

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopRow = y === 0;
          const isBottomRow = y === dimensions.screenHeight - 1;
          let rowHeight = dimensions.tileHeight;
          if (isTopRow && topHalfTile) {
            rowHeight /= 2;
          } else if (isBottomRow && bottomHalfTile) {
            rowHeight /= 2;
          }
          height += rowHeight;
        }
        return height;
      })();

    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = contentPixelHeight;
    const sx = activeBounds.minX * dimensions.tileWidth;
    const sy = rowYPositions[activeBounds.minY];

    toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: cropWidth,
        height: cropHeight,
        style: {
          transform: `translate(-${sx}px, -${sy}px) scale(1)`,
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
  }, [gridRef, activeBounds, dimensions, topHalfTile, bottomHalfTile]);

  const regenerateRasterPreview = useCallback(() => {
    if (!activeBounds || !lastRasterArgs) {
        setRasterMapConfig(null);
        return;
    }
    const { filename, outputWidth, outputHeight } = lastRasterArgs;
    const { screenWidth, tileWidth, tileHeight } = dimensions;

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopRow = y === 0;
          const isBottomRow = y === dimensions.screenHeight - 1;
          let rowHeight = dimensions.tileHeight;
          if (isTopRow && topHalfTile) {
            rowHeight /= 2;
          } else if (isBottomRow && bottomHalfTile) {
            rowHeight /= 2;
          }
          height += rowHeight;
        }
        return height;
      })();
      
    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * tileWidth;
    const contentHeight = contentPixelHeight;

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
    const numCols = Math.ceil((contentWidth + rasterOffset.x) / finalOutputWidth);
    const numRows = Math.ceil((contentHeight + rasterOffset.y) / finalOutputHeight);

    const totalPreviewWidth = numCols * finalOutputWidth;
    const totalPreviewHeight = numRows * finalOutputHeight;

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const sliceX = col * finalOutputWidth;
            const sliceY = row * finalOutputHeight;
            
            // Check if this slice actually contains any part of the content
            const contentRect = { x: rasterOffset.x, y: rasterOffset.y, width: contentWidth, height: contentHeight };
            const sliceRect = { x: sliceX, y: sliceY, width: finalOutputWidth, height: finalOutputHeight };

            const intersects = (contentRect.x < sliceRect.x + sliceRect.width &&
                                contentRect.x + contentRect.width > sliceRect.x &&
                                contentRect.y < sliceRect.y + sliceRect.height &&
                                contentRect.y + contentRect.height > sliceRect.y);
            
            if (!intersects) continue;

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

    let currentDrawY = 0;
    for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
      const isTopRow = y === 0;
      const isBottomRow = y === screenHeight - 1;
      let rowPixelHeight = tileHeight;
      if (isTopRow && topHalfTile) {
        rowPixelHeight /= 2;
      } else if (isBottomRow && bottomHalfTile) {
        rowPixelHeight /= 2;
      }

      for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
        const index = y * screenWidth + x;
        const tile = tiles[index];
        if (tile && !tile.deleted) {
          const tileXPos = (x - activeBounds.minX) * tileWidth;
          let bgColor;
          if (onOffMode) {
            bgColor = '#FFFFFF';
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, currentDrawY, tileWidth, rowPixelHeight);

          if (borderWidth > 0) {
              masterCtx.strokeStyle = borderColor;
              masterCtx.lineWidth = borderWidth;
              masterCtx.strokeRect(
                  tileXPos + borderWidth / 2, 
                  currentDrawY + borderWidth / 2, 
                  tileWidth - borderWidth, 
                  rowPixelHeight - borderWidth
              );
          }

          if (showLabels && labels[index]) {
            const currentLabelColor = labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + tileWidth / 2, currentDrawY + rowPixelHeight / 2);
          }
        }
      }
      currentDrawY += rowPixelHeight;
    }
    
    const previewImage = fullContentCanvas.toDataURL('image/png');

    setRasterMapConfig({
        slices,
        totalWidth: totalPreviewWidth,
        totalHeight: totalPreviewHeight,
        contentWidth,
        contentHeight,
        outputWidth: finalOutputWidth,
        outputHeight: finalOutputHeight,
        previewImage,
        rasterOffset,
        resolutionType,
    });
  }, [activeBounds, lastRasterArgs, dimensions, tiles, onOffMode, tileColor, tileColorTwo, showLabels, labels, labelColor, labelFontSize, rasterOffset, borderWidth, borderColor, labelColorMode, topHalfTile, bottomHalfTile]);


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
    const { screenHeight } = dimensions;

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopRow = y === 0;
          const isBottomRow = y === screenHeight - 1;
          let rowHeight = tileHeight;
          if (isTopRow && topHalfTile) {
            rowHeight /= 2;
          } else if (isBottomRow && bottomHalfTile) {
            rowHeight /= 2;
          }
          height += rowHeight;
        }
        return height;
    })();

    const contentWidth = (activeBounds.maxX - activeBounds.minX + 1) * tileWidth;
    const contentHeight = contentPixelHeight;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    let currentDrawY = 0;
    for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
      const isTopRow = y === 0;
      const isBottomRow = y === screenHeight - 1;
      let rowPixelHeight = tileHeight;
      if (isTopRow && topHalfTile) {
        rowPixelHeight /= 2;
      } else if (isBottomRow && bottomHalfTile) {
        rowPixelHeight /= 2;
      }

      for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
        const index = y * screenWidth + x;
        const tile = tiles[index];
        if (tile && !tile.deleted) {
          const tileXPos = (x - activeBounds.minX) * tileWidth;
          
          let bgColor;
          if (onOffMode) {
            bgColor = '#FFFFFF';
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, currentDrawY, tileWidth, rowPixelHeight);

          if (borderWidth > 0) {
            masterCtx.strokeStyle = borderColor;
            masterCtx.lineWidth = borderWidth;
            masterCtx.strokeRect(tileXPos + borderWidth / 2, currentDrawY + borderWidth / 2, tileWidth - borderWidth, rowPixelHeight - borderWidth);
          }


          if (showLabels && labels[index]) {
            const currentLabelColor = labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + tileWidth / 2, currentDrawY + rowPixelHeight / 2);
          }
        }
      }
      currentDrawY += rowPixelHeight;
    }

    return masterCanvas;
  }, [activeBounds, dimensions, tiles, labels, showLabels, onOffMode, tileColor, tileColorTwo, labelColor, labelFontSize, borderWidth, borderColor, labelColorMode, topHalfTile, bottomHalfTile]);


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
    
    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopRow = y === 0;
          const isBottomRow = y === dimensions.screenHeight - 1;
          let rowHeight = dimensions.tileHeight;
          if (isTopRow && topHalfTile) {
            rowHeight /= 2;
          } else if (isBottomRow && bottomHalfTile) {
            rowHeight /= 2;
          }
          height += rowHeight;
        }
        return height;
      })();
    
    const rowYPositions = [0];
    let accumulator = 0;
    for (let i = 0; i < dimensions.screenHeight -1; i++) {
        const isTopRow = i === 0;
        const rowHeight = (isTopRow && topHalfTile) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
        accumulator += rowHeight;
        rowYPositions.push(accumulator);
    }
    
    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = contentPixelHeight;
    const sx = isWiringMirrored 
        ? (dimensions.screenWidth - 1 - activeBounds.maxX) * dimensions.tileWidth
        : activeBounds.minX * dimensions.tileWidth;
    const sy = rowYPositions[activeBounds.minY];

    // Manually set colors before capturing
    const computedStyle = getComputedStyle(document.documentElement);
    const dataWiringColor = `hsl(${computedStyle.getPropertyValue('--data-wiring').trim()})`;
    const powerWiringColor = `hsl(${computedStyle.getPropertyValue('--power-wiring').trim()})`;

    const svgs = node.querySelectorAll('svg');
    const modifications: Array<{el: Element, attr: string, originalValue: string | null}> = [];

    svgs.forEach(svg => {
        const elementsToModify = svg.querySelectorAll('[stroke*="--data-wiring"], [fill*="--data-wiring"], [stroke*="--power-wiring"], [fill*="--power-wiring"]');

        elementsToModify.forEach(el => {
            const stroke = el.getAttribute('stroke');
            if (stroke) {
                modifications.push({ el, attr: 'stroke', originalValue: stroke });
                if (stroke.includes('--data-wiring')) el.setAttribute('stroke', dataWiringColor);
                if (stroke.includes('--power-wiring')) el.setAttribute('stroke', powerWiringColor);
            }
            const fill = el.getAttribute('fill');
            if (fill) {
                modifications.push({ el, attr: 'fill', originalValue: fill });
                if (fill.includes('--data-wiring')) el.setAttribute('fill', dataWiringColor);
                if (fill.includes('--power-wiring')) el.setAttribute('fill', powerWiringColor);
            }
        });
    });

    toPng(node, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      width: cropWidth,
      height: cropHeight,
      style: {
        transform: `translate(-${sx}px, -${sy}px) scale(1)`,
      }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `wiring-diagram${isWiringMirrored ? '-mirrored' : ''}.png`;
        link.href = dataUrl;
        link.click();
        
        toast({
          title: "Download Started",
          description: "Your wiring diagram is being downloaded.",
        });
      })
      .catch((err) => {
        console.error("Failed to generate wiring diagram image", err);
        toast({
          title: "Download Failed",
          description: "Could not generate the wiring diagram image.",
          variant: "destructive",
        });
      })
      .finally(() => {
        // Revert DOM changes
        modifications.forEach(({ el, attr, originalValue }) => {
            if (originalValue) {
                el.setAttribute(attr, originalValue);
            } else {
                el.removeAttribute(attr);
            }
        });
      });
  }, [wiringDiagramRef, isWiringMirrored, toast, activeBounds, dimensions, topHalfTile, bottomHalfTile]);

  const exportProject = useCallback(() => {
    const projectData: ProjectData = {
      version: "1.0.2",
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
      labelPosition,
      labelColorMode,
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
      showSliceOffsetLabels,
      topHalfTile,
      bottomHalfTile,
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
    showLabels, labelFormat, labelFontSize, labelColor, labelPosition, onOffMode, zoomLevels, activeTab, rasterOffset,
    lastRasterArgs, wiringPortConfig, showDataLabels, showPowerLabels, wiringPattern,
    powerWiringPattern, arrowheadSize, arrowheadLength, arrowGap,
    powerArrowheadSize, powerArrowheadLength, powerArrowGap, brushColor, 
    tilesPerPowerString, isWiringMirrored, dataLabelSize, powerLabelSize, toast, labelColorMode, showSliceOffsetLabels,
    topHalfTile, bottomHalfTile
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
        setLabelPosition(data.labelPosition || 'center');
        setLabelColorMode(data.labelColorMode || 'auto');
        setOnOffMode(data.onOffMode);
        
        if (data.zoomLevels) {
          setZoomLevels(data.zoomLevels);
        } else if (data.zoom) {
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
        setShowSliceOffsetLabels(data.showSliceOffsetLabels ?? true);
        setTopHalfTile(data.topHalfTile ?? false);
        setBottomHalfTile(data.bottomHalfTile ?? false);
        
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

  const calculateAndApplyOptimalOffset = useCallback(() => {
    if (!rasterMapConfig || !activeBounds) {
      toast({
          title: "Cannot Reset Offset",
          description: "Raster map and active grid are required.",
          variant: "destructive",
      });
      return;
    }
    
    setRasterOffset({ x: 0, y: 0 });
    toast({
      title: "Offset Reset",
      description: "Raster offset has been reset to (0, 0).",
    });
  }, [rasterMapConfig, activeBounds, toast]);


  const value = {
    appState,
    gridRef,
    wiringDiagramRef,
    dimensions,
    setDimensions,
    tiles,
    labels,
    sliceOffsetLabels,
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
    labelPosition,
    setLabelPosition,
    labelColorMode,
    setLabelColorMode,
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
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    topHalfTile,
    setTopHalfTile,
    bottomHalfTile,
    setBottomHalfTile,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
}
