

"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction, useMemo } from "react";
import { getWiringData, type WiringPattern, getPathOrder, type WiringInfo } from "@/lib/wiring";
import { useToast } from "@/hooks/use-toast";
import { isColorDark } from "@/lib/utils";
import { getProducts } from "@/app/calculator/actions";

interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    [key: string]: any;
}

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

type ActiveTool = 'delete' | 'label' | 'color' | 'power';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style' | 'row-letter-col-number';
type LabelPosition = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
type LabelColorMode = 'single' | 'auto';
type ResolutionType = 'content' | 'hd' | '4k-uhd' | '4k-dci' | 'custom';
type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';

interface RasterSlice {
  key: string;
  filename: string;
  x: number; 
  y: number; 
  width: number; 
  height: number;
}

interface ScreenArrangement {
  screenId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  activeBounds: ActiveBounds;
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
  resolutionType: ResolutionType;
  screenArrangement: ScreenArrangement[];
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
  labelStartNumber: number;
  onOffMode: boolean;
  zoomLevels: { grid: number; wiring: number; raster: number; };
  rasterOffset: { x: number; y: number; };
  lastRasterArgs: RasterArgs | null;
  wiringPortConfig: string;
  dataPortStartNumber: number;
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
  selectedProductId: string | null;
}

interface ProjectData {
  version: string;
  screens: Screen[];
  currentScreenId: string;
  activeTab: string;
  lastRasterArgs?: RasterArgs | null; // For backward compatibility
}

// Omit functions and refs from the state, pass them separately
interface PixelMapState extends Omit<Screen, 'id' | 'name' | 'zoomLevels'> {
  screens: Screen[];
  products: LedProduct[];
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
  handleDownloadCompositeWiringDiagram: () => void;
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
  setLabelStartNumber: Dispatch<SetStateAction<number>>;
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
  setDataPortStartNumber: Dispatch<SetStateAction<number>>;
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
  setSelectedProductId: Dispatch<SetStateAction<string | null>>;
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
    labelStartNumber: 1,
    onOffMode: false,
    zoomLevels: { grid: 1, wiring: 1, raster: 1 },
    rasterOffset: { x: 0, y: 0 },
    lastRasterArgs: null,
    wiringPortConfig: "4",
    dataPortStartNumber: 1,
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
    selectedProductId: 'custom',
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
  const [products, setProducts] = useState<LedProduct[]>([]);

  useEffect(() => {
      async function fetchProducts() {
          const { data, error } = await getProducts();
          if (data) {
              setProducts(data as LedProduct[]);
              if (data.length > 0 && !currentScreen.selectedProductId) {
                  // Don't auto-select here to avoid race conditions, let user select.
              }
          }
          if (error) {
              console.error("Failed to fetch LED products:", error);
          }
      }
      fetchProducts();
  }, []);

  const currentScreen = useMemo(() => screens.find(s => s.id === currentScreenId) || screens[0], [screens, currentScreenId]);
  
  const updateCurrentScreen = useCallback((updater: (screen: Screen) => Screen) => {
    setScreens(prevScreens => prevScreens.map(s => s.id === currentScreenId ? updater(s) : s));
  }, [currentScreenId]);
  
  const setDimensions = (updater: SetStateAction<Dimensions>) => {
      updateCurrentScreen(screen => {
          const newDimensions = typeof updater === 'function' ? updater(screen.dimensions) : updater;
          // When manually setting dimensions, clear the selected product if it's not custom
          const updatedScreen = { ...screen, dimensions: newDimensions };
          if (screen.selectedProductId !== 'custom') {
            updatedScreen.selectedProductId = 'custom';
          }
          
          const totalTiles = newDimensions.screenWidth * newDimensions.screenHeight;
          const newTiles = (totalTiles > 0 && totalTiles <= 4096)
              ? Array.from({ length: totalTiles }, (_, i) => ({ id: i, deleted: false }))
              : [];
          nextTileId.current = newTiles.length;

          return { ...updatedScreen, tiles: newTiles, topHalfTile: false, bottomHalfTile: false };
      });
  };

  const setSelectedProductId = (updater: SetStateAction<string | null>) => {
    updateCurrentScreen(screen => {
        const newId = typeof updater === 'function' ? updater(screen.selectedProductId) : updater;
        if (newId === 'custom') {
          return { ...screen, selectedProductId: 'custom' };
        }
        const product = products.find(p => p.id === newId);
        if (product) {
            return {
                ...screen,
                selectedProductId: newId,
                dimensions: {
                    ...screen.dimensions,
                    tileWidth: product.tileWidthPx,
                    tileHeight: product.tileHeightPx,
                }
            };
        }
        return { ...screen, selectedProductId: newId };
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
  const setLabelStartNumber = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, labelStartNumber: typeof updater === 'function' ? updater(s.labelStartNumber) : updater }));
  const setOnOffMode = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, onOffMode: typeof updater === 'function' ? updater(s.onOffMode) : updater }));
  const setRasterOffset = (updater: SetStateAction<{x: number, y: number}>) => updateCurrentScreen(s => ({ ...s, rasterOffset: typeof updater === 'function' ? updater(s.rasterOffset) : updater }));
  const setLastRasterArgs = (updater: SetStateAction<RasterArgs | null>) => updateCurrentScreen(s => ({ ...s, lastRasterArgs: typeof updater === 'function' ? updater(s.lastRasterArgs) : updater }));
  const setWiringPortConfig = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, wiringPortConfig: typeof updater === 'function' ? updater(s.wiringPortConfig) : updater }));
  const setDataPortStartNumber = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, dataPortStartNumber: typeof updater === 'function' ? updater(s.dataPortStartNumber) : updater }));
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
      dataPortStartNumber: currentScreen.dataPortStartNumber,
      wiringPattern: currentScreen.wiringPattern, 
      powerWiringPattern: currentScreen.powerWiringPattern, 
      rasterMapConfig, 
      tilesPerPowerString: currentScreen.tilesPerPowerString, 
      topHalfTile: currentScreen.topHalfTile,
      bottomHalfTile: currentScreen.bottomHalfTile,
      processorType: currentScreen.processorType,
      screenId: currentScreen.id
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
    
    const startNumber = currentScreen.labelStartNumber || 1;

    if (currentScreen.labelFormat === 'sequential' || currentScreen.labelFormat === 'dmx-style') {
      pathOrder.forEach((originalIndex, pathIndex) => {
        if (currentScreen.labelFormat === 'sequential') {
          newLabels[originalIndex] = String(pathIndex + startNumber);
        } else { // dmx-style
          const universeSize = 170;
          const dmxIndex = pathIndex + startNumber - 1;
          const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(dmxIndex / universeSize));
          const address = (dmxIndex % universeSize) + 1;
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
              newLabels[i] = `${y + startNumber}-${x + 1}`;
              break;
            case 'row-letter-col-number':
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1);
              const colNumber = x + 1;
              newLabels[i] = `${rowLetter}${colNumber}`;
              break;
          }
        }
      }
    }
    
    return newLabels;
  }, [currentScreen, effectiveScreenHeight]);

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
      case 'power':
        // TODO: Implement manual power circuit creation
        console.log("Power tool clicked on tile", tileId);
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
        trackEvent('download', { type: 'grid-png', filename, thumbnail: dataUrl });
      })
      .catch((err) => {
        console.error("Could not generate PNG.", err);
      });
  }, [gridRef, activeBounds, dimensions, topHalfTile, bottomHalfTile, effectiveScreenHeight, subscriptionStatus]);

  const createScreenContentCanvas = useCallback((screen: Screen, screenActiveBounds: ActiveBounds | null) => {
    if (!screenActiveBounds) return null;

    const screenLabels = (() => {
        const { screenWidth } = screen.dimensions;
        const totalTiles = screen.tiles.length;
        if (totalTiles <= 0) return [];
        const newLabels = Array(totalTiles).fill('');
        const activeTileIndices = screen.tiles.map((_, i) => i).filter(i => !screen.tiles[i].deleted);
        
        const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
        
        const pathOrder = getPathOrder(activeTileIndices, screen.wiringPattern, screenWidth, screenEffectiveHeight);
        const startNumber = screen.labelStartNumber || 1;

        if (screen.labelFormat === 'sequential' || screen.labelFormat === 'dmx-style') {
          pathOrder.forEach((originalIndex, pathIndex) => {
            if (screen.labelFormat === 'sequential') {
              newLabels[originalIndex] = String(pathIndex + startNumber);
            } else { // dmx-style
              const universeSize = 170;
              const dmxIndex = pathIndex + startNumber - 1;
              const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(dmxIndex / universeSize));
              const address = (dmxIndex % universeSize) + 1;
              newLabels[originalIndex] = `${universe}${address}`;
            }
          });
        } else if (screen.labelFormat !== 'none') {
            for (let i = 0; i < totalTiles; i++) {
                if (screen.tiles[i] && !screen.tiles[i].deleted) {
                    const x = i % screenWidth;
                    const y = Math.floor(i / screenWidth);
                    if (screen.labelFormat === 'row-col') {
                      newLabels[i] = `${y + startNumber}-${x + 1}`;
                    } else if (screen.labelFormat === 'row-letter-col-number') {
                      const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1);
                      newLabels[i] = `${rowLetter}${x + 1}`;
                    }
                }
            }
        }
        return newLabels;
    })();

    const { tileWidth, tileHeight, screenWidth } = screen.dimensions;

    const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
    
    const contentPixelHeight = (() => {
        let height = 0;
        for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
            const isTopHalf = screen.topHalfTile && y === 0;
            const isBottomHalf = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
            height += (isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight;
        }
        return height;
    })();

    const contentWidth = (screenActiveBounds.maxX - screenActiveBounds.minX + 1) * tileWidth;
    const contentHeight = contentPixelHeight;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    let currentDrawY = 0;
    for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
        const isTopHalfRow = screen.topHalfTile && y === 0;
        const isBottomHalfRow = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
        const rowPixelHeight = (isTopHalfRow || isBottomHalfRow) ? tileHeight / 2 : tileHeight;

        for (let x = screenActiveBounds.minX; x <= screenActiveBounds.maxX; x++) {
            const index = y * screenWidth + x;
            const tile = screen.tiles[index];
            if (tile && !tile.deleted) {
                const tileXPos = (x - screenActiveBounds.minX) * tileWidth;
                let bgColor = (x + y) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
                if (screen.onOffMode) bgColor = '#FFFFFF';
                else if (tile.color) bgColor = tile.color;

                masterCtx.fillStyle = bgColor;
                masterCtx.fillRect(tileXPos, currentDrawY, tileWidth, rowPixelHeight);

                if (screen.borderWidth > 0) {
                    masterCtx.strokeStyle = screen.borderColor;
                    masterCtx.lineWidth = screen.borderWidth;
                    masterCtx.strokeRect(tileXPos + screen.borderWidth / 2, currentDrawY + screen.borderWidth / 2, tileWidth - screen.borderWidth, rowPixelHeight - screen.borderWidth);
                }

                if (screen.showLabels && screenLabels[index]) {
                    const currentLabelColor = screen.labelColorMode === 'auto' ? (isColorDark(bgColor) ? '#FFFFFF' : '#000000') : screen.labelColor;
                    masterCtx.fillStyle = currentLabelColor;
                    masterCtx.font = `bold ${screen.labelFontSize}px sans-serif`;
                    masterCtx.textAlign = 'center';
                    masterCtx.textBaseline = 'middle';
                    masterCtx.fillText(screenLabels[index], tileXPos + tileWidth / 2, currentDrawY + rowPixelHeight / 2);
                }
            }
        }
        currentDrawY += rowPixelHeight;
    }
    return masterCanvas;
  }, []);

  const regenerateRasterPreview = useCallback(() => {
    if (!currentScreen.lastRasterArgs) {
        setRasterMapConfig(null);
        return;
    }
    const { filename, outputWidth, outputHeight } = currentScreen.lastRasterArgs;
    const PADDING = 20;

    const screenArrangement: ScreenArrangement[] = [];
    let totalContentWidth = 0;
    let totalContentHeight = 0;

    for (const screen of screens) {
        const activeTiles = screen.tiles.map((t, i) => ({...t, index: i})).filter(t => !t.deleted);
        if (activeTiles.length === 0) continue;

        let minX = screen.dimensions.screenWidth, minY = Infinity, maxX = -1, maxY = -1;
        activeTiles.forEach(tile => {
            const x = tile.index % screen.dimensions.screenWidth;
            const y = Math.floor(tile.index / screen.dimensions.screenWidth);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        const screenActiveBounds = { minX, minY, maxX, maxY };
        const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);

        const contentWidth = (maxX - minX + 1) * screen.dimensions.tileWidth;
        const contentHeight = Array.from({ length: maxY - minY + 1 }, (_, i) => {
            const y = minY + i;
            const isTopHalf = screen.topHalfTile && y === 0;
            const isBottomHalf = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
            return (isTopHalf || isBottomHalf) ? screen.dimensions.tileHeight / 2 : screen.dimensions.tileHeight;
        }).reduce((a, b) => a + b, 0);

        screenArrangement.push({
            screenId: screen.id,
            x: screen.rasterOffset.x,
            y: screen.rasterOffset.y,
            width: contentWidth,
            height: contentHeight,
            activeBounds: screenActiveBounds,
        });

        if (screen.rasterOffset.x + contentWidth > totalContentWidth) {
          totalContentWidth = screen.rasterOffset.x + contentWidth;
        }
        if (screen.rasterOffset.y + contentHeight > totalContentHeight) {
          totalContentHeight = screen.rasterOffset.y + contentHeight;
        }
    }

    const finalOutputWidth = outputWidth || totalContentWidth;
    const finalOutputHeight = outputHeight || totalContentHeight;
    
    let resolutionType: ResolutionType = 'content';
    if (outputWidth === 1920 && outputHeight === 1080) resolutionType = 'hd';
    else if (outputWidth === 3840 && outputHeight === 2160) resolutionType = '4k-uhd';
    else if (outputWidth === 4096 && outputHeight === 2160) resolutionType = '4k-dci';
    else if(outputWidth && outputHeight) resolutionType = 'custom';

    const slices: RasterSlice[] = [];
    const baseFilename = filename.replace('.png', '');

    const effectiveTotalContentWidth = screenArrangement.reduce((max, s) => Math.max(max, s.x + s.width), 0);
    const effectiveTotalContentHeight = screenArrangement.reduce((max, s) => Math.max(max, s.y + s.height), 0);
    
    const numCols = Math.ceil(effectiveTotalContentWidth / finalOutputWidth);
    const numRows = Math.ceil(effectiveTotalContentHeight / finalOutputHeight);

    const totalPreviewWidth = numCols * finalOutputWidth;
    const totalPreviewHeight = numRows * finalOutputHeight;

    const fullContentCanvas = document.createElement('canvas');
    fullContentCanvas.width = effectiveTotalContentWidth;
    fullContentCanvas.height = effectiveTotalContentHeight;
    const masterCtx = fullContentCanvas.getContext('2d');
    if (!masterCtx) return;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, fullContentCanvas.width, fullContentCanvas.height);

    for (const arrangement of screenArrangement) {
        const screen = screens.find(s => s.id === arrangement.screenId);
        if (!screen) continue;
        
        const screenCanvas = createScreenContentCanvas(screen, arrangement.activeBounds);
        if (screenCanvas) {
            masterCtx.drawImage(screenCanvas, arrangement.x, arrangement.y);
        }
    }

    const previewImage = fullContentCanvas.toDataURL('image/png');

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const sliceX = col * finalOutputWidth;
            const sliceY = row * finalOutputHeight;
            
            const sliceFilename = (numCols > 1 || numRows > 1) ? `${baseFilename}-R${row + 1}-C${col + 1}.png` : `${baseFilename}.png`;
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

    setRasterMapConfig({
        slices,
        totalWidth: totalPreviewWidth,
        totalHeight: totalPreviewHeight,
        contentWidth: effectiveTotalContentWidth,
        contentHeight: effectiveTotalContentHeight,
        outputWidth: finalOutputWidth,
        outputHeight: finalOutputHeight,
        previewImage,
        resolutionType,
        screenArrangement,
    });
  }, [screens, currentScreen.lastRasterArgs, createScreenContentCanvas]);


  useEffect(() => {
    if (currentScreen.lastRasterArgs) {
      regenerateRasterPreview();
    }
  }, [regenerateRasterPreview, screens]); // Removed currentScreen.lastRasterArgs from here as it caused loops. Now relies on screen state.
  
  const generateRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    setLastRasterArgs({ filename, outputWidth, outputHeight });
    // Don't reset offset here, it is now per-screen
  }, [setLastRasterArgs]);

  useEffect(() => {
    if (activeBounds && !currentScreen.lastRasterArgs) {
        generateRasterMap('raster-map-content.png');
    }
  }, [generateRasterMap, activeBounds, currentScreen.lastRasterArgs]);

  const createFullRasterCanvas = useCallback(() => {
    if (!rasterMapConfig) return null;

    const { contentWidth, contentHeight, screenArrangement } = rasterMapConfig;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    for (const arrangement of screenArrangement) {
        const screen = screens.find(s => s.id === arrangement.screenId);
        if (!screen) continue;
        
        const screenCanvas = createScreenContentCanvas(screen, arrangement.activeBounds);
        if (screenCanvas) {
            masterCtx.drawImage(screenCanvas, arrangement.x, arrangement.y);
        }
    }

    return masterCanvas;
  }, [rasterMapConfig, screens, createScreenContentCanvas]);


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

    const downloadCanvas = (canvas: HTMLCanvasElement, downloadFilename: string) => {
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement("a");
            link.download = downloadFilename;
            link.href = dataUrl;
            link.click();
            trackEvent('download', { type: 'raster-slice', filename: downloadFilename, thumbnail: dataUrl });
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
        
        outputCtx.drawImage(
            masterContentCanvas,
            -slice.x, 
            -slice.y
        );
        
        downloadCanvas(outputCanvas, slice.filename);
    }
  }, [rasterMapConfig, createFullRasterCanvas, subscriptionStatus, toast]);
  
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

        trackEvent('download', { type: 'wiring-diagram', filename: downloadFilename, thumbnail: dataUrl });
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
        trackEvent('download', { type: 'full-raster-map', filename: downloadFilename, thumbnail: dataUrl });
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
        
        const data: ProjectData | any = JSON.parse(result);

        if (!data.version || (!data.screens && !data.dimensions)) {
          throw new Error("Invalid project file format.");
        }
        
        // Handle legacy project import (pre-multiple screens)
        if (data.dimensions) {
          const screen = createNewScreen("Imported Screen");
          
          Object.assign(screen, {
            ...data,
            id: crypto.randomUUID(), // ensure it has a unique ID
            name: "Imported Screen",
            zoomLevels: data.zoomLevels || { grid: data.zoom || 1, wiring: data.zoom || 1, raster: data.zoom || 1 },
            lastRasterArgs: data.lastRasterArgs || null,
          });
          
          setScreens([screen]);
          setCurrentScreenId(screen.id);
          setActiveTab(data.activeTab || 'grid');
        } else {
           // Make sure all screens have all properties from the latest `Screen` interface
          const migratedScreens = data.screens.map((s: any) => {
            const newScreen = createNewScreen(""); // Create a default screen
            // Merge the loaded data into the default screen to ensure all properties exist
            return { ...newScreen, ...s, processorType: s.processorType || 'Brompton' };
          });
          setScreens(migratedScreens);
          setCurrentScreenId(data.currentScreenId);
          setActiveTab(data.activeTab);
        }
        
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
    if (!rasterMapConfig) {
      toast({
          title: "Cannot Reset Offset",
          description: "A raster map must be generated first.",
          variant: "destructive",
      });
      return;
    }
    
    // Resetting just the current screen's offset to 0,0
    setRasterOffset({ x: 0, y: 0 });

    toast({
      title: "Offset Reset",
      description: `Offset for "${currentScreen.name}" has been reset to (0, 0).`,
    });
  }, [rasterMapConfig, toast, setRasterOffset, currentScreen.name]);
  
  const createScreenWiringCanvas = useCallback((screen: Screen, screenActiveBounds: ActiveBounds | null) => {
    if (!screenActiveBounds) return null;
    
    const computedStyle = getComputedStyle(document.documentElement);

    const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
    const screenWiringData = getWiringData({
        dimensions: { ...screen.dimensions, screenHeight: screenEffectiveHeight },
        tiles: screen.tiles,
        wiringPortConfig: screen.wiringPortConfig,
        dataPortStartNumber: screen.dataPortStartNumber,
        tilesPerPowerString: screen.tilesPerPowerString,
        wiringPattern: screen.wiringPattern,
        powerWiringPattern: screen.powerWiringPattern,
        processorType: screen.processorType,
        topHalfTile: screen.topHalfTile,
        bottomHalfTile: screen.bottomHalfTile,
        screenId: screen.id,
    });
    
    const screenLabels = (() => {
        const { screenWidth } = screen.dimensions;
        const totalTiles = screen.tiles.length;
        if (totalTiles <= 0) return [];
        const newLabels = Array(totalTiles).fill('');
        const activeTileIndices = screen.tiles.map((_, i) => i).filter(i => !screen.tiles[i].deleted);
        const pathOrder = getPathOrder(activeTileIndices, screen.wiringPattern, screenWidth, screenEffectiveHeight);
        const startNumber = screen.labelStartNumber || 1;

        if (screen.labelFormat === 'sequential' || screen.labelFormat === 'dmx-style') {
          pathOrder.forEach((originalIndex, pathIndex) => {
            if (screen.labelFormat === 'sequential') {
              newLabels[originalIndex] = String(pathIndex + startNumber);
            } else { // dmx-style
              const universeSize = 170;
              const dmxIndex = pathIndex + startNumber - 1;
              const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(dmxIndex / universeSize));
              const address = (dmxIndex % universeSize) + 1;
              newLabels[originalIndex] = `${universe}${address}`;
            }
          });
        } else if (screen.labelFormat !== 'none') {
          for (let i = 0; i < totalTiles; i++) {
            if (screen.tiles[i] && !screen.tiles[i].deleted) {
              const x = i % screenWidth;
              const y = Math.floor(i / screenWidth);
              if (screen.labelFormat === 'row-col') {
                newLabels[i] = `${y + startNumber}-${x + 1}`;
              } else if (screen.labelFormat === 'row-letter-col-number') {
                const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1);
                newLabels[i] = `${rowLetter}${x + 1}`;
              }
            }
          }
        }
        return newLabels;
    })();

    const { tileWidth, tileHeight, screenWidth } = screen.dimensions;
    const contentWidth = (screenActiveBounds.maxX - screenActiveBounds.minX + 1) * tileWidth;
    const contentHeight = Array.from({ length: screenActiveBounds.maxY - screenActiveBounds.minY + 1 }, (_, i) => {
        const y = screenActiveBounds.minY + i;
        const isTopHalf = screen.topHalfTile && y === 0;
        const isBottomHalf = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
        return (isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight;
    }).reduce((a, b) => a + b, 0);

    const canvas = document.createElement('canvas');
    canvas.width = contentWidth;
    canvas.height = contentHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = computedStyle.getPropertyValue('--background').trim() || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rowData = [];
    let currentY = 0;
    for (let i = 0; i < screenEffectiveHeight; i++) {
        const isTopHalfRow = screen.topHalfTile && i === 0;
        const isBottomHalfRow = screen.bottomHalfTile && i === screenEffectiveHeight - 1;
        let rowHeight = tileHeight;
        if (isTopHalfRow || isBottomHalfRow) rowHeight /= 2;
        rowData.push({ yPos: currentY, height: rowHeight });
        currentY += rowHeight;
    }
    
    const getTileVisualY = (y: number) => {
      let totalY = 0;
      for (let i = screenActiveBounds.minY; i < y; i++) {
        totalY += rowData[i]?.height || tileHeight;
      }
      return totalY;
    }

    // Draw Tiles
    for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
        const tileXPos = (x: number) => (x - screenActiveBounds.minX) * tileWidth;
        const tileYPos = getTileVisualY(y);
        const rowPixelHeight = rowData[y].height;

        for (let x = screenActiveBounds.minX; x <= screenActiveBounds.maxX; x++) {
            const index = y * screenWidth + x;
            const tile = screen.tiles[index];
            if (!tile || tile.deleted) continue;

            const bgColor = (x + y) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
            ctx.fillStyle = bgColor;
            ctx.fillRect(tileXPos(x), tileYPos, tileWidth, rowPixelHeight);

            if (screen.borderWidth > 0) {
              ctx.strokeStyle = screen.borderColor;
              ctx.lineWidth = screen.borderWidth;
              ctx.strokeRect(tileXPos(x), tileYPos, tileWidth, rowPixelHeight);
            }
             if (screen.showLabels && screenLabels[index]) {
                const currentLabelColor = screen.labelColorMode === 'auto' ? (isColorDark(bgColor) ? '#FFFFFF' : '#000000') : screen.labelColor;
                ctx.fillStyle = currentLabelColor;
                ctx.font = `bold ${screen.labelFontSize}px sans-serif`;
                
                let textX = 0;
                let textY = tileYPos + rowPixelHeight / 2;

                switch (screen.labelPosition) {
                    case 'top-left':
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        textX = tileXPos(x) + 8;
                        textY = tileYPos + 4;
                        break;
                    case 'top-right':
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'top';
                        textX = tileXPos(x) + tileWidth - 8;
                        textY = tileYPos + 4;
                        break;
                    case 'bottom-left':
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';
                        textX = tileXPos(x) + 8;
                        textY = tileYPos + rowPixelHeight - 4;
                        break;
                    case 'bottom-right':
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'bottom';
                        textX = tileXPos(x) + tileWidth - 8;
                        textY = tileYPos + rowPixelHeight - 4;
                        break;
                    case 'center':
                    default:
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        textX = tileXPos(x) + tileWidth / 2;
                        break;
                }
                ctx.fillText(screenLabels[index], textX, textY);
            }
        }
    }

    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, gap: number, ahSize: number, ahLength: number) => {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= gap * 2) return;

        const nx = dx / distance;
        const ny = dy / distance;
        const x1 = fromX + nx * gap;
        const y1 = fromY + ny * gap;
        const x2 = toX - nx * gap;
        const y2 = toY - ny * gap;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        const tipX = x2;
        const tipY = y2;
        const baseCenterX = tipX - nx * ahLength;
        const baseCenterY = tipY - ny * ahLength;
        const p2x = baseCenterX - ny * (ahSize / 2);
        const p2y = baseCenterY + nx * (ahSize / 2);
        const p3x = baseCenterX + ny * (ahSize / 2);
        const p3y = baseCenterY - nx * (ahSize / 2);
        
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };

    // Draw Data Arrows
    if (screen.showDataLabels) {
      const dataColor = `hsl(${computedStyle.getPropertyValue('--data-wiring').trim()})`;
      screenWiringData.forEach(({ x, y, nextTile, isDeleted }) => {
        if (isDeleted || !nextTile) return;
        if (x < screenActiveBounds.minX || x > screenActiveBounds.maxX || y < screenActiveBounds.minY || y > screenActiveBounds.maxY) return;
        if (nextTile.x < screenActiveBounds.minX || nextTile.x > screenActiveBounds.maxX || nextTile.y < screenActiveBounds.minY || nextTile.y > screenActiveBounds.maxY) return;

        const startX = (x - screenActiveBounds.minX) * tileWidth + tileWidth / 2;
        const startY = getTileVisualY(y) + rowData[y].height / 2;
        const endX = (nextTile.x - screenActiveBounds.minX) * tileWidth + tileWidth / 2;
        const endY = getTileVisualY(nextTile.y) + rowData[nextTile.y].height / 2;
        drawArrow(startX, startY, endX, endY, dataColor, screen.arrowGap, screen.arrowheadSize, screen.arrowheadLength);
      });
    }
    
    // Draw Power Arrows
    if (screen.showPowerLabels) {
        const powerColor = `hsl(${computedStyle.getPropertyValue('--power-wiring').trim()})`;
        screenWiringData.forEach(({ x, y, nextPowerTile, isDeleted }) => {
            if (isDeleted || !nextPowerTile) return;
            if (x < screenActiveBounds.minX || x > screenActiveBounds.maxX || y < screenActiveBounds.minY || y > screenActiveBounds.maxY) return;
            if (nextPowerTile.x < screenActiveBounds.minX || nextPowerTile.x > screenActiveBounds.maxX || nextPowerTile.y < screenActiveBounds.minY || nextPowerTile.y > screenActiveBounds.maxY) return;

            const startX = (x - screenActiveBounds.minX) * tileWidth + tileWidth / 2;
            const startY = getTileVisualY(y) + rowData[y].height / 2;
            const endX = (nextPowerTile.x - screenActiveBounds.minX) * tileWidth + tileWidth / 2;
            const endY = getTileVisualY(nextPowerTile.y) + rowData[nextPowerTile.y].height / 2;
            drawArrow(startX, startY, endX, endY, powerColor, screen.powerArrowGap, screen.powerArrowheadSize, screen.powerArrowheadLength);
        });
    }

    // Draw Labels
    screenWiringData.forEach(({ x, y, isDeleted, dataLabel, backupLabel, powerPortLabel }) => {
        if (isDeleted) return;
        if (x < screenActiveBounds.minX || x > screenActiveBounds.maxX || y < screenActiveBounds.minY || y > screenActiveBounds.maxY) return;
        
        const tileXPos = (x - screenActiveBounds.minX) * tileWidth + tileWidth / 2;
        const tileYPos = getTileVisualY(y) + rowData[y].height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelsToDraw = [];
        if(screen.showDataLabels && (dataLabel || backupLabel)) {
           labelsToDraw.push({
               label: backupLabel || dataLabel,
               size: screen.dataLabelSize,
               bgColor: backupLabel ? `hsl(${computedStyle.getPropertyValue('--destructive').trim()})` : `hsl(${computedStyle.getPropertyValue('--data-wiring').trim()})`,
               fgColor: backupLabel ? `hsl(${computedStyle.getPropertyValue('--destructive-foreground').trim()})` : `hsl(${computedStyle.getPropertyValue('--data-wiring-foreground').trim()})`,
           });
        }
        if(screen.showPowerLabels && powerPortLabel) {
           labelsToDraw.push({
               label: powerPortLabel,
               size: screen.powerLabelSize,
               bgColor: `hsl(${computedStyle.getPropertyValue('--power-wiring').trim()})`,
               fgColor: `hsl(${computedStyle.getPropertyValue('--power-wiring-foreground').trim()})`,
           });
        }

        const totalHeightOfLabels = labelsToDraw.reduce((acc, l) => acc + l.size, 0) + (labelsToDraw.length - 1) * 5;
        let startDrawY = tileYPos - totalHeightOfLabels / 2;

        labelsToDraw.forEach(item => {
            const yPos = startDrawY + item.size / 2;
            ctx.fillStyle = item.bgColor;
            ctx.beginPath();
            ctx.arc(tileXPos, yPos, item.size / 2, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = item.fgColor;
            ctx.font = `bold ${Math.max(8, item.size * 0.4)}px sans-serif`;
            ctx.fillText(String(item.label), tileXPos, yPos);
            
            startDrawY += item.size + 5;
        });
    });
    
    return canvas;

  }, []);

  const handleDownloadCompositeWiringDiagram = useCallback(() => {
    if (subscriptionStatus !== 'pro' || !rasterMapConfig) {
      toast({ title: "Pro Feature", description: "This feature requires a Pro subscription and a generated raster map.", variant: "destructive" });
      return;
    }
    
    const { contentWidth, contentHeight, screenArrangement } = rasterMapConfig;
    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return;

    masterCtx.fillStyle = 'white';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    for (const arrangement of screenArrangement) {
        const screen = screens.find(s => s.id === arrangement.screenId);
        if (!screen) continue;
        
        const screenWiringCanvas = createScreenWiringCanvas(screen, arrangement.activeBounds);
        if (screenWiringCanvas) {
            masterCtx.drawImage(screenWiringCanvas, arrangement.x, arrangement.y);
        }
    }

    const dataUrl = masterCanvas.toDataURL('image/png');
    const link = document.createElement("a");
    link.download = "composite-wiring-diagram.png";
    link.href = dataUrl;
    link.click();

    toast({ title: "Download Started", description: "Your composite wiring diagram is downloading." });
    trackEvent('download', { type: 'composite-wiring-diagram', thumbnail: dataUrl });

  }, [rasterMapConfig, screens, createScreenWiringCanvas, subscriptionStatus, toast]);


  const value: PixelMapState = {
    appState,
    gridRef,
    wiringDiagramRef,
    rasterMapRef,
    screens,
    products,
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
    handleDownloadCompositeWiringDiagram,
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
    labelStartNumber: currentScreen.labelStartNumber,
    setLabelStartNumber,
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
    dataPortStartNumber: currentScreen.dataPortStartNumber,
    setDataPortStartNumber,
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
    selectedProductId: currentScreen.selectedProductId,
    setSelectedProductId,
  };

  return (
    <PixelMapContext.Provider value={value}>
      {children}
    </PixelMapContext.Provider>
  );
}
