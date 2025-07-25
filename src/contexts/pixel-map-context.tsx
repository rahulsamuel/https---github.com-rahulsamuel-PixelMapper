
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction, useMemo } from "react";
import { getWiringData, type WiringPattern, getPathOrder, type WiringInfo } from "@/lib/wiring";
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
type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';

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

interface Screen {
  id: string;
  name: string;
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
  zoomLevels: { grid: number; wiring: number; raster: number; };
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
  dataLabelSize: number;
  powerLabelSize: number;
  showSliceOffsetLabels: boolean;
  topHalfTile: boolean;
  bottomHalfTile: boolean;
  processorType: ProcessorType;
}

interface ProjectData {
  version: string;
  screens: Screen[];
  currentScreenId: string;
  activeTab: string;
}

// Omit functions and refs from the state, pass them separately
interface PixelMapState extends Omit<Screen, 'id' | 'name' | 'zoomLevels'> {
  screens: Screen[];
  currentScreen: Screen;
  currentScreenId: string;
  setCurrentScreenId: (id: string) => void;
  addNewScreen: () => void;
  renameScreen: (id: string, newName: string) => void;
  deleteScreen: (id: string) => void;
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  wiringDiagramRef: React.RefObject<HTMLDivElement>;
  rasterMapRef: React.RefObject<HTMLDivElement>;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  labels: string[];
  sliceOffsetLabels: string[];
  wiringData: WiringInfo[];
  handleTileClick: (tileId: number) => void;
  restoreDeletedTiles: () => void;
  resetAllColors: () => void;
  deletedCount: number;
  coloredCount: number;
  setTileColor: Dispatch<SetStateAction<string>>;
  setTileColorTwo: Dispatch<SetStateAction<string>>;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  setBorderColor: Dispatch<SetStateAction<string>>;
  handleDownloadPng: (filename: string) => void;
  handleDownloadWiringDiagram: () => void;
  handleDownloadFullRaster: () => void;
  generateRasterMap: (filename: string, outputWidth?: number, outputHeight?: number) => void;
  downloadRasterSlices: () => void;
  setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
  setLabelFormat: Dispatch<SetStateAction<LabelFormat>>;
  setLabelFontSize: Dispatch<SetStateAction<number>>;
  setLabelColor: Dispatch<SetStateAction<string>>;
  setLabelPosition: Dispatch<SetStateAction<LabelPosition>>;
  setLabelColorMode: Dispatch<SetStateAction<LabelColorMode>>;
  setOnOffMode: Dispatch<SetStateAction<boolean>>;
  zoom: number;
  setZoom: (value: number | ((prev: number) => number), applyToAllTabs?: boolean) => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  activeBounds: ActiveBounds | null;
  rasterMapConfig: RasterMapConfig | null;
  setRasterMapConfig: Dispatch<SetStateAction<RasterMapConfig | null>>;
  setRasterOffset: Dispatch<SetStateAction<{ x: number; y: number; }>>;
  setWiringPortConfig: Dispatch<SetStateAction<string>>;
  setShowDataLabels: (value: boolean) => void;
  setShowPowerLabels: (value: boolean) => void;
  setWiringPattern: Dispatch<SetStateAction<WiringPattern>>;
  setPowerWiringPattern: Dispatch<SetStateAction<WiringPattern>>;
  setArrowheadSize: Dispatch<SetStateAction<number>>;
  setArrowheadLength: Dispatch<SetStateAction<number>>;
  setArrowGap: Dispatch<SetStateAction<number>>;
  setPowerArrowheadSize: Dispatch<SetStateAction<number>>;
  setPowerArrowheadLength: Dispatch<SetStateAction<number>>;
  setPowerArrowGap: Dispatch<SetStateAction<number>>;
  exportProject: () => void;
  importProject: (file: File) => void;
  setBrushColor: Dispatch<SetStateAction<string>>;
  setIsWiringMirrored: Dispatch<SetStateAction<boolean>>;
  setTilesPerPowerString: Dispatch<SetStateAction<string>>;
  setDataLabelSize: Dispatch<SetStateAction<number>>;
  setPowerLabelSize: Dispatch<SetStateAction<number>>;
  calculateAndApplyOptimalOffset: () => void;
  setShowSliceOffsetLabels: Dispatch<SetStateAction<boolean>>;
  handleTopHalfTileChange: (add: boolean) => void;
  handleBottomHalfTileChange: (add: boolean) => void;
  effectiveScreenHeight: number;
  setProcessorType: Dispatch<SetStateAction<ProcessorType>>;
}

const PixelMapContext = createContext<PixelMapState | undefined>(undefined);

export const usePixelMap = () => {
  const context = useContext(PixelMapContext);
  if (!context) {
    throw new Error("usePixelMap must be used within a PixelMapProvider");
  }
  return context;
};

// Helper to track events
const trackEvent = async (eventType: string, eventData: any) => {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventType, eventData }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

const createNewScreen = (name: string): Screen => {
  const screenId = crypto.randomUUID();
  return {
    id: screenId,
    name,
    dimensions: { tileWidth: 200, tileHeight: 200, screenWidth: 5, screenHeight: 3 },
    tiles: Array.from({ length: 5 * 3 }, (_, i) => ({ id: i, deleted: false })),
    tileColor: "#273a5e",
    tileColorTwo: "#d1d9e6",
    borderWidth: 1,
    borderColor: "#ffffff",
    activeTool: 'delete',
    showLabels: true,
    labelFormat: 'row-col',
    labelFontSize: 30,
    labelColor: "#ffffff",
    labelPosition: 'center',
    labelColorMode: 'auto',
    onOffMode: false,
    zoomLevels: { grid: 1, wiring: 1, raster: 1 },
    rasterOffset: { x: 0, y: 0 },
    lastRasterArgs: null,
    wiringPortConfig: "4",
    tilesPerPowerString: "20",
    showDataLabels: true,
    showPowerLabels: false,
    wiringPattern: 'serpentine-horizontal',
    powerWiringPattern: 'left-right',
    arrowheadSize: 20,
    arrowheadLength: 30,
    arrowGap: 50,
    powerArrowheadSize: 20,
    powerArrowheadLength: 30,
    powerArrowGap: 50,
    brushColor: "#e11d48",
    isWiringMirrored: false,
    dataLabelSize: 100,
    powerLabelSize: 100,
    showSliceOffsetLabels: true,
    topHalfTile: false,
    bottomHalfTile: false,
    processorType: 'Brompton',
  };
};

export function PixelMapProvider({ children }: { children: ReactNode }) {
  const [appState] = useState("ready");
  const gridRef = useRef<HTMLDivElement>(null);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);
  const rasterMapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const nextTileId = useRef(0);
  const subscriptionStatus = 'pro';

  const [screens, setScreens] = useState<Screen[]>(() => [createNewScreen("Default Screen")]);
  const [currentScreenId, setCurrentScreenId] = useState<string>(screens[0].id);
  const [activeTab, setActiveTab] = useState('grid');
  const [rasterMapConfig, setRasterMapConfig] = useState<RasterMapConfig | null>(null);

  const currentScreen = useMemo(() => screens.find(s => s.id === currentScreenId) || screens[0], [screens, currentScreenId]);
  
  const updateCurrentScreen = useCallback((updater: (screen: Screen) => Screen) => {
    setScreens(prevScreens => prevScreens.map(s => s.id === currentScreenId ? updater(s) : s));
  }, [currentScreenId]);

  const setDimensions = (updater: SetStateAction<Dimensions>) => {
    updateCurrentScreen(screen => {
      const newDimensions = typeof updater === 'function' ? updater(screen.dimensions) : updater;
      const totalTiles = newDimensions.screenWidth * newDimensions.screenHeight;
      const newTiles = (totalTiles > 0 && totalTiles <= 4096)
        ? Array.from({ length: totalTiles }, (_, i) => ({ id: i, deleted: false }))
        : [];
      nextTileId.current = newTiles.length;
      return { ...screen, dimensions: newDimensions, tiles: newTiles, topHalfTile: false, bottomHalfTile: false };
    });
  };
  
  const setTiles = (updater: SetStateAction<Tile[]>) => {
    updateCurrentScreen(screen => ({
      ...screen,
      tiles: typeof updater === 'function' ? updater(screen.tiles) : updater,
    }));
  };

  const setTileColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, tileColor: typeof updater === 'function' ? updater(s.tileColor) : updater }));
  const setTileColorTwo = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, tileColorTwo: typeof updater === 'function' ? updater(s.tileColorTwo) : updater }));
  const setBorderWidth = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, borderWidth: typeof updater === 'function' ? updater(s.borderWidth) : updater }));
  const setBorderColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, borderColor: typeof updater === 'function' ? updater(s.borderColor) : updater }));
  const setActiveTool = (updater: SetStateAction<ActiveTool>) => updateCurrentScreen(s => ({ ...s, activeTool: typeof updater === 'function' ? updater(s.activeTool) : updater }));
  const setShowLabels = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showLabels: typeof updater === 'function' ? updater(s.showLabels) : updater }));
  const setLabelFormat = (updater: SetStateAction<LabelFormat>) => updateCurrentScreen(s => ({ ...s, labelFormat: typeof updater === 'function' ? updater(s.labelFormat) : updater }));
  const setLabelFontSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, labelFontSize: typeof updater === 'function' ? updater(s.labelFontSize) : updater }));
  const setLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, labelColor: typeof updater === 'function' ? updater(s.labelColor) : updater }));
  const setLabelPosition = (updater: SetStateAction<LabelPosition>) => updateCurrentScreen(s => ({ ...s, labelPosition: typeof updater === 'function' ? updater(s.labelPosition) : updater }));
  const setLabelColorMode = (updater: SetStateAction<LabelColorMode>) => updateCurrentScreen(s => ({ ...s, labelColorMode: typeof updater === 'function' ? updater(s.labelColorMode) : updater }));
  const setOnOffMode = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, onOffMode: typeof updater === 'function' ? updater(s.onOffMode) : updater }));
  const setRasterOffset = (updater: SetStateAction<{x: number, y: number}>) => updateCurrentScreen(s => ({ ...s, rasterOffset: typeof updater === 'function' ? updater(s.rasterOffset) : updater }));
  const setLastRasterArgs = (updater: SetStateAction<RasterArgs | null>) => updateCurrentScreen(s => ({ ...s, lastRasterArgs: typeof updater === 'function' ? updater(s.lastRasterArgs) : updater }));
  const setWiringPortConfig = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, wiringPortConfig: typeof updater === 'function' ? updater(s.wiringPortConfig) : updater }));
  const setTilesPerPowerString = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, tilesPerPowerString: typeof updater === 'function' ? updater(s.tilesPerPowerString) : updater }));
  const setShowDataLabelsState = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showDataLabels: typeof updater === 'function' ? updater(s.showDataLabels) : updater }));
  const setShowPowerLabelsState = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showPowerLabels: typeof updater === 'function' ? updater(s.showPowerLabels) : updater }));
  const setWiringPattern = (updater: SetStateAction<WiringPattern>) => updateCurrentScreen(s => ({ ...s, wiringPattern: typeof updater === 'function' ? updater(s.wiringPattern) : updater }));
  const setPowerWiringPattern = (updater: SetStateAction<WiringPattern>) => updateCurrentScreen(s => ({ ...s, powerWiringPattern: typeof updater === 'function' ? updater(s.powerWiringPattern) : updater }));
  const setArrowheadSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, arrowheadSize: typeof updater === 'function' ? updater(s.arrowheadSize) : updater }));
  const setArrowheadLength = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, arrowheadLength: typeof updater === 'function' ? updater(s.arrowheadLength) : updater }));
  const setArrowGap = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, arrowGap: typeof updater === 'function' ? updater(s.arrowGap) : updater }));
  const setPowerArrowheadSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, powerArrowheadSize: typeof updater === 'function' ? updater(s.powerArrowheadSize) : updater }));
  const setPowerArrowheadLength = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, powerArrowheadLength: typeof updater === 'function' ? updater(s.powerArrowheadLength) : updater }));
  const setPowerArrowGap = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, powerArrowGap: typeof updater === 'function' ? updater(s.powerArrowGap) : updater }));
  const setBrushColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, brushColor: typeof updater === 'function' ? updater(s.brushColor) : updater }));
  const setIsWiringMirrored = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, isWiringMirrored: typeof updater === 'function' ? updater(s.isWiringMirrored) : updater }));
  const setDataLabelSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, dataLabelSize: typeof updater === 'function' ? updater(s.dataLabelSize) : updater }));
  const setPowerLabelSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, powerLabelSize: typeof updater === 'function' ? updater(s.powerLabelSize) : updater }));
  const setShowSliceOffsetLabels = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showSliceOffsetLabels: typeof updater === 'function' ? updater(s.showSliceOffsetLabels) : updater }));
  const setProcessorType = (updater: SetStateAction<ProcessorType>) => updateCurrentScreen(s => ({ ...s, processorType: typeof updater === 'function' ? updater(s.processorType) : updater }));


  const addNewScreen = () => {
    const newScreen = createNewScreen(`Screen ${screens.length + 1}`);
    setScreens(prev => [...prev, newScreen]);
    setCurrentScreenId(newScreen.id);
  };

  const renameScreen = (id: string, newName: string) => {
    setScreens(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const deleteScreen = (id: string) => {
    setScreens(prev => {
      if (prev.length <= 1) {
        toast({ title: "Cannot delete the last screen", variant: "destructive" });
        return prev;
      }
      const newScreens = prev.filter(s => s.id !== id);
      if (currentScreenId === id) {
        setCurrentScreenId(newScreens[0].id);
      }
      return newScreens;
    });
  };

  const { dimensions, tiles, topHalfTile, bottomHalfTile } = currentScreen;

  const effectiveScreenHeight = useMemo(() => {
    let height = dimensions.screenHeight;
    if (topHalfTile) height++;
    if (bottomHalfTile) height++;
    return height;
  }, [dimensions.screenHeight, topHalfTile, bottomHalfTile]);

  const wiringData = useMemo(() => {
    if (!currentScreen) return [];
    return getWiringData({
      dimensions: { ...currentScreen.dimensions, screenHeight: effectiveScreenHeight }, 
      tiles: currentScreen.tiles, 
      wiringPortConfig: currentScreen.wiringPortConfig, 
      wiringPattern: currentScreen.wiringPattern, 
      powerWiringPattern: currentScreen.powerWiringPattern, 
      rasterMapConfig, 
      activeBounds: null, // This needs to be calculated per screen
      tilesPerPowerString: currentScreen.tilesPerPowerString, 
      rasterOffset: currentScreen.rasterOffset,
      topHalfTile: currentScreen.topHalfTile,
      bottomHalfTile: currentScreen.bottomHalfTile,
      processorType: currentScreen.processorType,
    })
  }, [currentScreen, effectiveScreenHeight, rasterMapConfig]);


  const zoom = currentScreen.zoomLevels[activeTab as keyof typeof currentScreen.zoomLevels] || 1;
  
  const setZoom = (value: number | ((prevZoom: number) => number), applyToAllTabs = false) => {
    updateCurrentScreen(screen => {
      const newZoomLevels = { ...screen.zoomLevels };
      const currentTabKey = activeTab as keyof typeof newZoomLevels;
      const currentZoom = newZoomLevels[currentTabKey];
      const newZoom = typeof value === 'function' ? value(currentZoom) : value;

      if (applyToAllTabs) {
        return { ...screen, zoomLevels: { grid: newZoom, wiring: newZoom, raster: newZoom } };
      }
      
      newZoomLevels[currentTabKey] = newZoom;
      return { ...screen, zoomLevels: newZoomLevels };
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

  const handleTopHalfTileChange = (add: boolean) => {
    updateCurrentScreen(screen => {
      const { screenWidth } = screen.dimensions;
      let newTiles;
      if (add) {
          const newRow = Array.from({ length: screenWidth }, () => ({ id: nextTileId.current++, deleted: false }));
          newTiles = [...newRow, ...screen.tiles];
      } else {
          newTiles = screen.tiles.slice(screenWidth);
      }
      return { ...screen, topHalfTile: add, tiles: newTiles };
    });
  };
  
  const handleBottomHalfTileChange = (add: boolean) => {
    updateCurrentScreen(screen => {
      const { screenWidth } = screen.dimensions;
      let newTiles;
      if (add) {
          const newRow = Array.from({ length: screenWidth }, () => ({ id: nextTileId.current++, deleted: false }));
          newTiles = [...screen.tiles, ...newRow];
      } else {
          newTiles = screen.tiles.slice(0, screen.tiles.length - screenWidth);
      }
      return { ...screen, bottomHalfTile: add, tiles: newTiles };
    });
  };
  
  const [activeBounds, setActiveBounds] = useState<ActiveBounds | null>(null);

  useEffect(() => {
    const { screenWidth } = currentScreen.dimensions;
    const activeTiles = currentScreen.tiles.map((t, i) => ({...t, index: i})).filter(t => !t.deleted);

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
  }, [currentScreen.tiles, currentScreen.dimensions]);

  const deletedCount = useMemo(() => currentScreen.tiles.filter((tile) => tile.deleted).length, [currentScreen.tiles]);
  const coloredCount = useMemo(() => currentScreen.tiles.filter((tile) => !!tile.color && !tile.deleted).length, [currentScreen.tiles]);

  const labels = useMemo(() => {
    const { screenWidth } = currentScreen.dimensions;
    const totalTiles = currentScreen.tiles.length;
    if (totalTiles <= 0) return [];

    const newLabels = Array(totalTiles).fill('');
    const activeTileIndices = currentScreen.tiles.map((_, i) => i).filter(i => !currentScreen.tiles[i].deleted);
    const pathOrder = getPathOrder(activeTileIndices, currentScreen.wiringPattern, screenWidth, effectiveScreenHeight);

    if (currentScreen.labelFormat === 'sequential' || currentScreen.labelFormat === 'dmx-style') {
      pathOrder.forEach((originalIndex, pathIndex) => {
        if (currentScreen.labelFormat === 'sequential') {
          newLabels[originalIndex] = String(pathIndex + 1);
        } else { // dmx-style
          const universeSize = 170;
          const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(pathIndex / universeSize));
          const address = (pathIndex % universeSize) + 1;
          newLabels[originalIndex] = `${universe}${address}`;
        }
      });
    } else if (currentScreen.labelFormat !== 'none') {
      for (let i = 0; i < totalTiles; i++) {
        if (currentScreen.tiles[i] && !currentScreen.tiles[i].deleted) {
          const x = i % screenWidth;
          const y = Math.floor(i / screenWidth);
          
          switch (currentScreen.labelFormat) {
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
    
    return newLabels;
  }, [currentScreen.dimensions, currentScreen.labelFormat, currentScreen.tiles, currentScreen.wiringPattern, effectiveScreenHeight]);

  // Effect to calculate slice offset labels
  const sliceOffsetLabels = useMemo(() => {
    if (!rasterMapConfig || !activeBounds || !rasterMapConfig.slices.length || !currentScreen.rasterOffset || !currentScreen.wiringPattern) {
      return [];
    }

    const { screenWidth, tileHeight, tileWidth } = currentScreen.dimensions;
    const { slices, outputWidth, outputHeight } = rasterMapConfig;
    
    const newLabels = Array(screenWidth * effectiveScreenHeight).fill('');
    const activeTileIndices = currentScreen.tiles.map((_, i) => i).filter(i => !currentScreen.tiles[i].deleted);

    const tilesBySlice = new Map<string, number[]>();
    activeTileIndices.forEach(index => {
      const x = index % screenWidth;
      const y = Math.floor(index / screenWidth);

      if (x < activeBounds.minX || x > activeBounds.maxX || y < activeBounds.minY || y > activeBounds.maxY) {
                return;
              }
      
      let tileContentY = 0;
      for (let i = activeBounds.minY; i < y; i++) {
        const isTopRow = topHalfTile && i === 0;
        const isBottomRow = bottomHalfTile && i === effectiveScreenHeight - 1;
        tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
      }

      const tileContentX = (x - activeBounds.minX) * tileWidth;
      const absoluteContentX = tileContentX + currentScreen.rasterOffset.x;
      const absoluteContentY = tileContentY + currentScreen.rasterOffset.y;

      const sliceCol = Math.floor(absoluteContentX / outputWidth);
      const sliceRow = Math.floor(absoluteContentY / outputHeight);
      const sliceKey = `${sliceRow}-${sliceCol}`;
      
      if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
      tilesBySlice.get(sliceKey)!.push(index);
    });

    tilesBySlice.forEach((sliceIndices, sliceKey) => {
      const pathOrder = getPathOrder(sliceIndices, currentScreen.wiringPattern, screenWidth, effectiveScreenHeight);
      const currentSlice = slices.find(s => s.key === sliceKey);
      
      if (currentSlice && pathOrder.length > 0) {
        const firstTileIndex = pathOrder[0];
        
        const x = firstTileIndex % screenWidth;
        const y = Math.floor(firstTileIndex / screenWidth);

        let tileContentY = 0;
        for (let i = activeBounds.minY; i < y; i++) {
            const isTopRow = topHalfTile && i === 0;
            const isBottomRow = bottomHalfTile && i === effectiveScreenHeight - 1;
            tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
        }

        const tileContentX = (x - activeBounds.minX) * tileWidth;
        const absoluteContentX = tileContentX + currentScreen.rasterOffset.x;
        const absoluteContentY = tileContentY + currentScreen.rasterOffset.y;

        const offsetXInSlice = absoluteContentX - currentSlice.x;
        const offsetYInSlice = absoluteContentY - currentSlice.y;

        newLabels[firstTileIndex] = `(${offsetXInSlice},${offsetYInSlice})`;
      }
    });

    return newLabels;
  }, [currentScreen, rasterMapConfig, activeBounds, effectiveScreenHeight, topHalfTile, bottomHalfTile]);


  const handleTileClick = useCallback((tileId: number) => {
    switch (currentScreen.activeTool) {
      case 'delete':
        setTiles(prev =>
          prev.map(tile => (tile.id === tileId ? { ...tile, deleted: !tile.deleted } : tile))
        );
        break;
      case 'color':
        setTiles(prev =>
          prev.map(tile => (tile.id === tileId ? { ...tile, color: currentScreen.brushColor, deleted: false } : tile))
        );
        break;
      default:
        break;
    }
  }, [currentScreen.activeTool, currentScreen.brushColor]);


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
    
    let yPosOfMinY = 0;
    for (let i = 0; i < activeBounds.minY; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        yPosOfMinY += isTopHalfRow ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopHalf = topHalfTile && y === 0;
          const isBottomHalf = bottomHalfTile && y === (effectiveScreenHeight - 1);
          height += (isTopHalf || isBottomHalf) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
        }
        return height;
      })();

    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = contentPixelHeight;
    const sx = activeBounds.minX * dimensions.tileWidth;
    const sy = yPosOfMinY;

    toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 1,
        width: cropWidth,
        height: cropHeight,
        style: {
          transform: `translate(-${sx}px, -${sy}px) scale(1)`,
        }
    })
      .then((dataUrl) => {
        if (subscriptionStatus === 'trial') {
            return addWatermark(dataUrl);
        }
        return dataUrl;
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        trackEvent('download', { type: 'grid-png', filename });
      })
      .catch((err) => {
        console.error("Could not generate PNG.", err);
      });
  }, [gridRef, activeBounds, dimensions, topHalfTile, bottomHalfTile, effectiveScreenHeight, subscriptionStatus]);

  const regenerateRasterPreview = useCallback(() => {
    if (!activeBounds || !currentScreen.lastRasterArgs) {
        setRasterMapConfig(null);
        return;
    }
    const { filename, outputWidth, outputHeight } = currentScreen.lastRasterArgs;
    const { screenWidth, tileWidth, tileHeight } = currentScreen.dimensions;

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopHalf = topHalfTile && y === 0;
          const isBottomHalf = bottomHalfTile && y === (effectiveScreenHeight - 1);
          height += (isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight;
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
    const numCols = Math.ceil((contentWidth + currentScreen.rasterOffset.x) / finalOutputWidth);
    const numRows = Math.ceil((contentHeight + currentScreen.rasterOffset.y) / finalOutputHeight);

    const totalPreviewWidth = numCols * finalOutputWidth;
    const totalPreviewHeight = numRows * finalOutputHeight;

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const sliceX = col * finalOutputWidth;
            const sliceY = row * finalOutputHeight;
            
            const contentRect = { x: currentScreen.rasterOffset.x, y: currentScreen.rasterOffset.y, width: contentWidth, height: contentHeight };
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
                width: finalOutputWidth,
                height: finalOutputHeight
            });
        }
    }

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
      const isTopHalfRow = topHalfTile && y === 0;
      const isBottomHalfRow = bottomHalfTile && y === (effectiveScreenHeight - 1);
      const rowPixelHeight = (isTopHalfRow || isBottomHalfRow) ? tileHeight / 2 : tileHeight;

      for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
        const index = y * screenWidth + x;
        const tile = tiles[index];
        if (tile && !tile.deleted) {
          const tileXPos = (x - activeBounds.minX) * tileWidth;
          let bgColor;
          if (currentScreen.onOffMode) {
            bgColor = '#FFFFFF';
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? currentScreen.tileColor : currentScreen.tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, currentDrawY, tileWidth, rowPixelHeight);

          if (currentScreen.borderWidth > 0) {
              masterCtx.strokeStyle = currentScreen.borderColor;
              masterCtx.lineWidth = currentScreen.borderWidth;
              masterCtx.strokeRect(
                  tileXPos + currentScreen.borderWidth / 2, 
                  currentDrawY + currentScreen.borderWidth / 2, 
                  tileWidth - currentScreen.borderWidth, 
                  rowPixelHeight - currentScreen.borderWidth
              );
          }

          if (currentScreen.showLabels && labels[index]) {
            const currentLabelColor = currentScreen.labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : currentScreen.labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${currentScreen.labelFontSize}px sans-serif`;
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
        rasterOffset: currentScreen.rasterOffset,
        resolutionType,
    });
  }, [activeBounds, currentScreen, effectiveScreenHeight, labels, tiles, topHalfTile, bottomHalfTile]);


  useEffect(() => {
    if (currentScreen.lastRasterArgs) {
      regenerateRasterPreview();
    }
  }, [regenerateRasterPreview, currentScreen.lastRasterArgs]);
  
  const generateRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    setLastRasterArgs({ filename, outputWidth, outputHeight });
    setRasterOffset({ x: 0, y: 0 });
  }, [setLastRasterArgs, setRasterOffset]);

  useEffect(() => {
    if (activeBounds && !currentScreen.lastRasterArgs) {
        generateRasterMap('raster-map-content.png');
    }
  }, [generateRasterMap, activeBounds, currentScreen.lastRasterArgs]);

  const createFullRasterCanvas = useCallback(() => {
    if (!activeBounds) return null;

    const { screenWidth, tileWidth, tileHeight } = currentScreen.dimensions;

    const contentPixelHeight = (() => {
        if (!activeBounds) return 0;
        let height = 0;
        for (let y = activeBounds.minY; y <= activeBounds.maxY; y++) {
          const isTopHalf = topHalfTile && y === 0;
          const isBottomHalf = bottomHalfTile && y === (effectiveScreenHeight - 1);
          height += (isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight;
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
        const isTopHalfRow = topHalfTile && y === 0;
        const isBottomHalfRow = bottomHalfTile && y === (effectiveScreenHeight - 1);
        const rowPixelHeight = (isTopHalfRow || isBottomHalfRow) ? tileHeight / 2 : tileHeight;

      for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
        const index = y * screenWidth + x;
        const tile = tiles[index];
        if (tile && !tile.deleted) {
          const tileXPos = (x - activeBounds.minX) * tileWidth;
          
          let bgColor;
          if (currentScreen.onOffMode) {
            bgColor = '#FFFFFF';
          } else if (tile.color) {
            bgColor = tile.color;
          } else {
            bgColor = (x + y) % 2 === 0 ? currentScreen.tileColor : currentScreen.tileColorTwo;
          }

          masterCtx.fillStyle = bgColor;
          masterCtx.fillRect(tileXPos, currentDrawY, tileWidth, rowPixelHeight);

          if (currentScreen.borderWidth > 0) {
            masterCtx.strokeStyle = currentScreen.borderColor;
            masterCtx.lineWidth = currentScreen.borderWidth;
            masterCtx.strokeRect(tileXPos + currentScreen.borderWidth / 2, currentDrawY + currentScreen.borderWidth / 2, tileWidth - currentScreen.borderWidth, rowPixelHeight - currentScreen.borderWidth);
          }


          if (currentScreen.showLabels && labels[index]) {
            const currentLabelColor = currentScreen.labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : currentScreen.labelColor;
            masterCtx.fillStyle = currentLabelColor;
            masterCtx.font = `bold ${currentScreen.labelFontSize}px sans-serif`;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.fillText(labels[index], tileXPos + tileWidth / 2, currentDrawY + rowPixelHeight / 2);
          }
          
          if (currentScreen.showSliceOffsetLabels && sliceOffsetLabels[index]) {
            const labelText = sliceOffsetLabels[index];
            const FONT_SIZE = 12;
            const PADDING_X = 4;
            const PADDING_Y = 2;
            const OFFSET_X = 4;
            const OFFSET_Y = 4;
            
            masterCtx.font = `${FONT_SIZE}px monospace`;
            masterCtx.textBaseline = 'top';
            masterCtx.textAlign = 'left';

            const textMetrics = masterCtx.measureText(labelText);
            const textWidth = textMetrics.width;
            
            masterCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            masterCtx.fillRect(
                tileXPos + OFFSET_X,
                currentDrawY + OFFSET_Y, 
                textWidth + PADDING_X * 2, 
                FONT_SIZE + PADDING_Y * 2
            );
            
            masterCtx.fillStyle = 'white';
            masterCtx.fillText(
                labelText, 
                tileXPos + OFFSET_X + PADDING_X, 
                currentDrawY + OFFSET_Y + PADDING_Y
            );
          }
        }
      }
      currentDrawY += rowPixelHeight;
    }

    return masterCanvas;
  }, [activeBounds, currentScreen, tiles, labels, effectiveScreenHeight, topHalfTile, bottomHalfTile, sliceOffsetLabels]);


  const downloadRasterSlices = useCallback(() => {
    if (subscriptionStatus !== 'pro') {
      toast({
        title: "Pro Feature",
        description: "Please subscribe to download raster slices.",
        variant: "destructive",
      });
      return;
    }
    if (!rasterMapConfig) {
        console.error("No raster map configuration available to download.");
        return;
    }
    
    const masterContentCanvas = createFullRasterCanvas();
    if (!masterContentCanvas) {
      console.error("Failed to create master canvas for download.");
      return;
    }

    trackEvent('download', { type: 'raster-slices', filenames: rasterMapConfig.slices.map(s => s.filename) });


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
        
        const destX = currentScreen.rasterOffset.x - slice.x;
        const destY = currentScreen.rasterOffset.y - slice.y;

        outputCtx.drawImage(
            masterContentCanvas,
            destX, 
            destY
        );
        
        downloadCanvas(outputCanvas, slice.filename);
    }
  }, [rasterMapConfig, createFullRasterCanvas, currentScreen.rasterOffset, subscriptionStatus, toast]);
  
  const addWatermark = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0);

            ctx.globalAlpha = 0.4;
            ctx.font = `bold ${Math.max(30, canvas.width / 15)}px sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText('TRIAL', 0, 0);
            ctx.restore();

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
  };

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
            const isTopHalf = topHalfTile && y === 0;
            const isBottomHalf = bottomHalfTile && y === (effectiveScreenHeight - 1);
            height += (isTopHalf || isBottomHalf) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
        }
        return height;
    })();
    
    let yPosOfMinY = 0;
    for (let i = 0; i < activeBounds.minY; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        yPosOfMinY += isTopHalfRow ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }
    
    const cropWidth = (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth;
    const cropHeight = contentPixelHeight;
    const sx = currentScreen.isWiringMirrored 
        ? (dimensions.screenWidth - 1 - activeBounds.maxX) * dimensions.tileWidth
        : activeBounds.minX * dimensions.tileWidth;
    const sy = yPosOfMinY;

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
      pixelRatio: 1,
      width: cropWidth,
      height: cropHeight,
      style: {
        transform: `translate(-${sx}px, -${sy}px) scale(1)`,
      }
    })
      .then((dataUrl) => {
        if (subscriptionStatus === 'trial') {
            return addWatermark(dataUrl);
        }
        return dataUrl;
      })
      .then((dataUrl) => {
        const downloadFilename = `wiring-diagram${currentScreen.isWiringMirrored ? '-mirrored' : ''}.png`;
        const link = document.createElement("a");
        link.download = downloadFilename;
        link.href = dataUrl;
        link.click();
        
        toast({
          title: "Download Started",
          description: "Your wiring diagram is being downloaded.",
        });

        trackEvent('download', { type: 'wiring-diagram', filename: downloadFilename });
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
        modifications.forEach(({ el, attr, originalValue }) => {
            if (originalValue) {
                el.setAttribute(attr, originalValue);
            } else {
                el.removeAttribute(attr);
            }
        });
      });
  }, [wiringDiagramRef, currentScreen.isWiringMirrored, toast, activeBounds, dimensions, topHalfTile, bottomHalfTile, effectiveScreenHeight, subscriptionStatus]);

  const handleDownloadFullRaster = useCallback(() => {
    if (subscriptionStatus !== 'pro') {
      toast({
        title: "Pro Feature",
        description: "Please subscribe to download the full raster map.",
        variant: "destructive",
      });
      return;
    }
    if (rasterMapRef.current === null || !rasterMapConfig) {
      toast({
        title: "Download Failed",
        description: "Raster map preview is not ready.",
        variant: "destructive",
      });
      return;
    }

    const node = rasterMapRef.current;
    const { totalWidth, totalHeight } = rasterMapConfig;
    const downloadFilename = `full-raster-map.png`;

    trackEvent('download', { type: 'full-raster-map', filename: downloadFilename });

    toPng(node, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 1,
      width: totalWidth,
      height: totalHeight,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = downloadFilename;
        link.href = dataUrl;
        link.click();
        
        toast({
          title: "Download Started",
          description: "Your full raster map is being downloaded.",
        });
      })
      .catch((err) => {
        console.error("Failed to generate full raster map image", err);
        toast({
          title: "Download Failed",
          description: "Could not generate the full raster map image.",
          variant: "destructive",
        });
      })
      .finally(() => {
      });
  }, [rasterMapRef, rasterMapConfig, toast, subscriptionStatus]);


  const exportProject = useCallback(() => {
    const projectData: ProjectData = {
      version: "1.3.0",
      screens,
      currentScreenId,
      activeTab,
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = "mapmyled-project.json";
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Project saved to ${filename}`,
    });
    trackEvent('download', { type: 'project-file', filename, projectData: { screensCount: screens.length } });
  }, [screens, currentScreenId, activeTab, toast]);
  
  const importProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error("Could not read file");
        
        const data: ProjectData = JSON.parse(result);

        if (!data.version || !data.screens || !data.currentScreenId) {
          throw new Error("Invalid project file format.");
        }
        
        // Handle legacy project import
        if (!data.screens && (data as any).dimensions) {
          const legacyData = data as any;
          const screen = createNewScreen("Imported Screen");
          
          Object.assign(screen, {
            ...legacyData,
            zoomLevels: legacyData.zoomLevels || { grid: legacyData.zoom || 1, wiring: legacyData.zoom || 1, raster: legacyData.zoom || 1 }
          });
          
          setScreens([screen]);
          setCurrentScreenId(screen.id);
          setActiveTab(legacyData.activeTab || 'grid');
        } else {
          setScreens(data.screens);
          setCurrentScreenId(data.currentScreenId);
          setActiveTab(data.activeTab);
        }

        // Make sure all screens have all properties
        setScreens(currentScreens => currentScreens.map(s => ({ ...createNewScreen(""), ...s })));
        
        toast({
          title: "Import Successful",
          description: "Your project has been loaded.",
        });

      } catch (error) {
        console.error("Failed to parse project file:", error);
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid project file.",
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
  }, [rasterMapConfig, activeBounds, toast, setRasterOffset]);

  const value: PixelMapState = {
    appState,
    gridRef,
    wiringDiagramRef,
    rasterMapRef,
    screens,
    currentScreen,
    currentScreenId,
    setCurrentScreenId,
    addNewScreen,
    renameScreen,
    deleteScreen,
    dimensions: currentScreen.dimensions,
    setDimensions,
    tiles: currentScreen.tiles,
    labels,
    sliceOffsetLabels,
    wiringData,
    handleTileClick,
    restoreDeletedTiles,
    resetAllColors,
    deletedCount,
    coloredCount,
    tileColor: currentScreen.tileColor,
    setTileColor,
    tileColorTwo: currentScreen.tileColorTwo,
    setTileColorTwo,
    borderWidth: currentScreen.borderWidth,
    setBorderWidth,
    borderColor: currentScreen.borderColor,
    setBorderColor,
    handleDownloadPng,
    handleDownloadWiringDiagram,
    handleDownloadFullRaster,
    generateRasterMap,
    downloadRasterSlices,
    activeTool: currentScreen.activeTool,
    setActiveTool,
    showLabels: currentScreen.showLabels,
    setShowLabels,
    labelFormat: currentScreen.labelFormat,
    setLabelFormat,
    labelFontSize: currentScreen.labelFontSize,
    setLabelFontSize,
    labelColor: currentScreen.labelColor,
    setLabelColor,
    labelPosition: currentScreen.labelPosition,
    setLabelPosition,
    labelColorMode: currentScreen.labelColorMode,
    setLabelColorMode,
    onOffMode: currentScreen.onOffMode,
    setOnOffMode,
    zoom,
    setZoom,
    activeTab,
    setActiveTab,
    activeBounds,
    rasterMapConfig,
    setRasterMapConfig,
    rasterOffset: currentScreen.rasterOffset,
    setRasterOffset,
    wiringPortConfig: currentScreen.wiringPortConfig,
    setWiringPortConfig,
    tilesPerPowerString: currentScreen.tilesPerPowerString,
    setTilesPerPowerString,
    showDataLabels: currentScreen.showDataLabels,
    setShowDataLabels,
    showPowerLabels: currentScreen.showPowerLabels,
    setShowPowerLabels,
    wiringPattern: currentScreen.wiringPattern,
    setWiringPattern,
    powerWiringPattern: currentScreen.powerWiringPattern,
    setPowerWiringPattern,
    arrowheadSize: currentScreen.arrowheadSize,
    setArrowheadSize,
    arrowheadLength: currentScreen.arrowheadLength,
    setArrowheadLength,
    arrowGap: currentScreen.arrowGap,
    setArrowGap,
    powerArrowheadSize: currentScreen.powerArrowheadSize,
    setPowerArrowheadSize,
    powerArrowheadLength: currentScreen.powerArrowheadLength,
    setPowerArrowheadLength,
    powerArrowGap: currentScreen.powerArrowGap,
    setPowerArrowGap,
    exportProject,
    importProject,
    brushColor: currentScreen.brushColor,
    setBrushColor,
    isWiringMirrored: currentScreen.isWiringMirrored,
    setIsWiringMirrored,
    dataLabelSize: currentScreen.dataLabelSize,
    setDataLabelSize,
    powerLabelSize: currentScreen.powerLabelSize,
    setPowerLabelSize,
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels: currentScreen.showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    topHalfTile: currentScreen.topHalfTile,
    handleTopHalfTileChange,
    bottomHalfTile: currentScreen.bottomHalfTile,
    handleBottomHalfTileChange,
    effectiveScreenHeight,
    processorType: currentScreen.processorType,
    setProcessorType,
  };

  return (
    <PixelMapContext.Provider value={value}>
      {children}
    </PixelMapContext.Provider>
  );
}
