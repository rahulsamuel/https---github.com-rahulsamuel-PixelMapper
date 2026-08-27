
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction, useMemo } from "react";
import { getWiringData, type WiringPattern, getPathOrder, type WiringInfo, applyManualPowerWiring as applyManualPowerWiringLogic, applyManualDataWiring as applyManualDataWiringLogic, generateManualSerpentinePath, isCustomSerpentine } from "@/lib/wiring";
import { useToast } from "@/hooks/use-toast";
import { isColorDark } from "@/lib/utils";
import { getProducts } from "@/app/calculator/actions";
import { useAuth } from "./auth-context";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

function formatFractionalInch(inches: number): string {
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const denominators = [2, 4, 8, 16, 32];
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestDiff = frac;
  for (const denom of denominators) {
    const numerator = Math.round(frac * denom);
    const diff = Math.abs(frac - numerator / denom);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestNumerator = numerator;
      bestDenominator = denom;
    }
  }
  if (bestNumerator === 0) return `${whole}`;
  const gcf = (a: number, b: number): number => b === 0 ? a : gcf(b, a % b);
  const divisor = gcf(bestNumerator, bestDenominator);
  return `${whole} ${bestNumerator / divisor}/${bestDenominator / divisor}`;
}

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
  moduleWidth: number;
  moduleHeight: number;
}

export interface Tile {
  id: number;
  deleted: boolean;
  color?: string;
  productId?: string | null;
  powerPortLabel?: string;
  powerCircuit?: {
    label: string;
    tileCount: number;
    pattern: WiringPattern;
    runLength?: number;
  };
  dataCircuit?: {
    mainLabel: string;
    backupLabel: string;
    tileCount: number;
    pattern: WiringPattern;
    runLength?: number;
  };
}

interface ActiveBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type ActiveTool = 'delete' | 'label' | 'color' | 'power' | 'data';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style' | 'row-letter-col-number';
type LabelPosition = 'top-left' | 'top-right' | 'top-center' | 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
type LabelColorMode = 'single' | 'auto';
type ResolutionType = 'content' | 'hd' | '4k-uhd' | '4k-dci' | 'custom';
export type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  colorMode: LabelColorMode;
  fontWeight: number;
  rotation: number;
  backgroundColor: string;
  showBackground: boolean;
}

export interface LogoOverlay {
  id: string;
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface RasterGroup {
  id: string;
  name: string;
}

export interface RasterSlice {
  key: string;
  filename: string;
  x: number; 
  y: number; 
  width: number; 
  height: number;
}

export interface RasterSegment {
  id: string;
  bounds: ActiveBounds;
  offset: { x: number; y: number };
}

interface ScreenArrangement {
  screenId: string;
  segmentId: string;
  screenName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  activeBounds: ActiveBounds;
  showScreenName: boolean;
  screenNameLabelPosition: string;
  screenNameLabelFontSize: number;
  screenNameLabelColor: string;
  screenNameLabelColorMode: string;
  showSliceOffsetLabels: boolean;
  showResolution: boolean;
  resolutionLabelPosition: string;
  showDimensions: boolean;
  dimensionUnit: 'mm' | 'meters' | 'inches' | 'decimal-feet' | 'feet-inches' | 'tiles' | 'all';
  dimensionLabelSize: number;
  dimensionLabelColor: string;
  customTileWidthMm: number;
  customTileHeightMm: number;
}

export interface RasterMapConfig {
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

export interface WallLayoutLegendEntry {
  color: string;
  label: string;
}

interface RasterArgs {
  filename: string;
  outputWidth?: number;
  outputHeight?: number;
}

export interface ScreenSection {
  id: string;
  productId: string;
  columnCount: number;
  tileWidthPx: number;
  tileHeightPx: number;
  tileWidthMm: number;
  tileHeightMm: number;
}

export interface Screen {
  id: string;
  name: string;
  dimensions: Dimensions;
  tiles: Tile[];
  sections: ScreenSection[];
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
  showScreenName: boolean;
  screenNameLabelPosition: LabelPosition;
  screenNameLabelFontSize: number;
  screenNameLabelColor: string;
  screenNameLabelColorMode: LabelColorMode;
  onOffMode: boolean;
  zoomLevels: { grid: number; wiring: number; raster: number; deliverables: number; };
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
  dataLabelColor: string;
  powerLabelColor: string;
  showSliceOffsetLabels: boolean;
  showResolution: boolean;
  resolutionLabelPosition: LabelPosition;
  resolutionLabelFontSize: number;
  resolutionLabelColor: string;
  resolutionLabelColorMode: LabelColorMode;
  showDimensions: boolean;
  dimensionUnit: 'mm' | 'meters' | 'inches' | 'decimal-feet' | 'feet-inches' | 'tiles' | 'all';
  dimensionLabelSize: number;
  dimensionLabelColor: string;
  customTileWidthMm: number;
  customTileHeightMm: number;
  rasterGroupId: string;
  topHalfTile: boolean;
  bottomHalfTile: boolean;
  leftHalfTile: boolean;
  rightHalfTile: boolean;
  processorType: ProcessorType;
  selectedProductId: string | null;
  nextTileId: number;
  textOverlays: TextOverlay[];
  logoOverlay: LogoOverlay | null;
  showModules: boolean;
  moduleBorderColor: string;
  randomizeModuleColors: boolean;
  moduleColors: string[][];
  rasterCrop: ActiveBounds | null;
  rasterSegments?: RasterSegment[];
}

export interface CalculatorTabData {
  activeTab?: string;
  formState?: {
    projectName: string;
    selectedProductId: string | null;
    voltage: '110v' | '208v' | '230v';
    phase: 'single-phase' | 'three-phase';
    screenWidthTiles: number;
    screenHeightTiles: number;
  };
  curvingState?: {
    radius: number;
    angle: number;
    view: 'front' | 'top' | 'perspective';
    zoom: number;
  };
}

export interface PowerDataTabData {
  selectedProductId?: string;
  selectedProcessorId?: string;
  circuitVoltage?: string;
  circuitAmperage?: string;
  safetyMargin?: string;
  refreshRate?: string;
  bitDepth?: string;
}

export interface RackDrawingTabData {
  racks?: { id: number; name: string; ru: number; items: any[] }[];
  nextRackId?: number;
  activeSide?: 'front' | 'rear';
  showImages?: boolean;
}

export interface ProcessorEntry {
  id: string;
  label: string;
  type: ProcessorType;
  screenIds: string[];
  rasterGroupId: string;
  isBackup: boolean;
  sliceKey?: string;
}

export interface DataPortEntry {
  id: string;
  label: string;
  backupLabel: string;
  processorId: string;
  screenId: string;
  tileCount: number;
  isBackup: boolean;
  sliceKey?: string;
  rasterGroupId?: string;
}

export interface PowerPortEntry {
  id: string;
  label: string;
  processorId: string;
  screenId: string;
  tileCount: number;
  sliceKey?: string;
}

export interface FiberBoxEntry {
  id: string;
  label: string;
  processorId: string;
  portCount: number;
  screenIds: string[];
  isBackup: boolean;
}

export interface CableRun {
  id: string;
  kind: 'fiber' | 'cat' | 'power';
  fromLabel: string;
  toLabel: string;
  length: number;
  unit: 'ft' | 'm';
}

export interface GearConfig {
  processors: ProcessorEntry[];
  dataPorts: DataPortEntry[];
  powerPorts: PowerPortEntry[];
  fiberBoxes: FiberBoxEntry[];
  cables: CableRun[];
}

export interface ProjectData {
  version: string;
  screens: Screen[];
  currentScreenId: string;
  activeTab: string;
  lastRasterArgs?: RasterArgs | null;
  projectNumber?: string;
  versionNumber?: string;
  projectNotes?: string;
  mediaServer?: string;
  preferredCodec?: string;
  videoContainer?: string;
  frameRate?: string;
  audioFormat?: string;
  audioEmbedded?: boolean;
  samplingRate?: string;
  audioBitRate?: string;
  imageFormat?: string;
  rasterMapConfigs?: Record<string, RasterMapConfig>;
  rasterGroups?: RasterGroup[];
  activeRasterGroupId?: string;
  rasterBgColor?: string;
  uploadedMaps?: string[];
  includeTextOverlaysInDownload?: boolean;
  calculator?: CalculatorTabData;
  powerData?: PowerDataTabData;
  rackDrawing?: RackDrawingTabData;
  gear?: GearConfig;
  wallLayoutLegend?: WallLayoutLegendEntry[];
}

interface PixelMapState extends Omit<Screen, 'id' | 'name' | 'zoomLevels' | 'nextTileId' | 'moduleColors'> {
  screens: Screen[];
  products: LedProduct[];
  currentScreen: Screen;
  currentScreenId: string;
  setCurrentScreenId: (id: string) => void;
  addNewScreen: () => void;
  renameScreen: (id: string, newName: string) => void;
  deleteScreen: (id: string) => void;
  duplicateScreen: (id: string) => void;
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  wiringDiagramRef: React.RefObject<HTMLDivElement>;
  rasterMapRef: React.RefObject<HTMLDivElement>;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  labels: string[];
  sliceOffsetLabels: string[];
  wiringData: WiringInfo[];
  handleTileClick: (tileId: number) => void;
  selectionRect: { startX: number; startY: number; endX: number; endY: number } | null;
  selectedTileIds: number[];
  handleGridMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleGridMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleGridMouseUp: () => void;
  restoreDeletedTiles: () => void;
  resetAllColors: () => void;
  deletedCount: number;
  coloredCount: number;
  setTileColor: Dispatch<SetStateAction<string>>;
  setTileColorTwo: Dispatch<SetStateAction<string>>;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  setBorderColor: Dispatch<SetStateAction<string>>;
  handleDownloadPng: (filename?: string) => void;
  isPngDownloading: boolean;
  includeTextOverlaysInDownload: boolean;
  setIncludeTextOverlaysInDownload: Dispatch<SetStateAction<boolean>>;
  handleDownloadWiringDiagram: () => void;
  handleDownloadCompositeWiringDiagram: () => void;
  handleDownloadFullRaster: () => void;
  wallLayoutLegend: WallLayoutLegendEntry[];
  setWallLayoutLegend: Dispatch<SetStateAction<WallLayoutLegendEntry[]>>;
  handleDownloadWallLayout: () => void;
  isWallLayoutDownloading: boolean;
  generateRasterMap: (filename: string, outputWidth?: number, outputHeight?: number) => void;
  downloadRasterSlices: () => void;
  downloadSingleSlice: (sliceKey: string) => void;
  setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
  setLabelFormat: Dispatch<SetStateAction<LabelFormat>>;
  setLabelFontSize: Dispatch<SetStateAction<number>>;
  setLabelColor: Dispatch<SetStateAction<string>>;
  setLabelPosition: Dispatch<SetStateAction<LabelPosition>>;
  setLabelColorMode: Dispatch<SetStateAction<LabelColorMode>>;
  setLabelStartNumber: Dispatch<SetStateAction<number>>;
  setShowScreenName: Dispatch<SetStateAction<boolean>>;
  setScreenNameLabelPosition: Dispatch<SetStateAction<LabelPosition>>;
  setScreenNameLabelFontSize: Dispatch<SetStateAction<number>>;
  setScreenNameLabelColor: Dispatch<SetStateAction<string>>;
  setScreenNameLabelColorMode: Dispatch<SetStateAction<LabelColorMode>>;
  setShowResolution: Dispatch<SetStateAction<boolean>>;
  setResolutionLabelPosition: Dispatch<SetStateAction<LabelPosition>>;
  setResolutionLabelFontSize: Dispatch<SetStateAction<number>>;
  setResolutionLabelColor: Dispatch<SetStateAction<string>>;
  setResolutionLabelColorMode: Dispatch<SetStateAction<LabelColorMode>>;
  setShowDimensions: Dispatch<SetStateAction<boolean>>;
  setDimensionUnit: Dispatch<SetStateAction<'mm' | 'meters' | 'inches' | 'decimal-feet' | 'feet-inches' | 'tiles' | 'all'>>;
  setDimensionLabelSize: Dispatch<SetStateAction<number>>;
  setDimensionLabelColor: Dispatch<SetStateAction<string>>;
  setCustomTileWidthMm: Dispatch<SetStateAction<number>>;
  setCustomTileHeightMm: Dispatch<SetStateAction<number>>;
  addTextOverlay: () => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  setLogoOverlay: Dispatch<SetStateAction<LogoOverlay | null>>;
  setOnOffMode: Dispatch<SetStateAction<boolean>>;
  zoom: number;
  setZoom: (value: number | ((prev: number) => number), applyToAllTabs?: boolean) => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  activeBounds: ActiveBounds | null;
  createScreenContentCanvas: (screen: Screen, screenActiveBounds: ActiveBounds | null, drawOverlays?: boolean) => HTMLCanvasElement | null;
  rasterMapConfig: RasterMapConfig | null;
  setRasterMapConfig: (config: RasterMapConfig | null) => void;
  rasterMapConfigs: Record<string, RasterMapConfig>;
  rasterGroups: RasterGroup[];
  setRasterGroups: Dispatch<SetStateAction<RasterGroup[]>>;
  activeRasterGroupId: string;
  setActiveRasterGroupId: Dispatch<SetStateAction<string>>;
  addRasterGroup: () => string;
  renameRasterGroup: (id: string, name: string) => void;
  deleteRasterGroup: (id: string) => void;
  setRasterOffset: Dispatch<SetStateAction<{ x: number; y: number; }>>;
  updateScreenById: (screenId: string, updater: (s: Screen) => Screen) => void;
  mergeRemoteScreen: (screen: Screen) => void;
  removeRemoteScreen: (screenId: string) => void;
  rasterBgColor: string;
  setRasterBgColor: Dispatch<SetStateAction<string>>;
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
  exportProject: (projectName?: string) => void;
  importProject: (file: File) => void;
  setBrushColor: Dispatch<SetStateAction<string>>;
  setIsWiringMirrored: Dispatch<SetStateAction<boolean>>;
  setTilesPerPowerString: Dispatch<SetStateAction<string>>;
  setDataLabelSize: Dispatch<SetStateAction<number>>;
  setPowerLabelSize: Dispatch<SetStateAction<number>>;
  setDataLabelColor: Dispatch<SetStateAction<string>>;
  setPowerLabelColor: Dispatch<SetStateAction<string>>;
  calculateAndApplyOptimalOffset: () => void;
  setShowSliceOffsetLabels: Dispatch<SetStateAction<boolean>>;
  handleTopHalfTileChange: (add: boolean) => void;
  handleBottomHalfTileChange: (add: boolean) => void;
  handleLeftHalfTileChange: (add: boolean) => void;
  handleRightHalfTileChange: (add: boolean) => void;
  effectiveScreenHeight: number;
  effectiveScreenWidth: number;
  setProcessorType: Dispatch<SetStateAction<ProcessorType>>;
  setSelectedProductId: Dispatch<SetStateAction<string | null>>;
  isManualPowerModalOpen: boolean;
  setIsManualPowerModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedTileForPower: number | null;
  applyManualPowerWiring: (args: { startTileId: number; label: string; numTiles: number; pattern: WiringPattern; runLength?: number; }) => void;
  isManualDataModalOpen: boolean;
  setIsManualDataModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedTileForData: number | null;
  applyManualDataWiring: (args: { startTileId: number; mainLabel: string; backupLabel: string; numTiles: number; pattern: WiringPattern; }) => void;
  setShowModules: Dispatch<SetStateAction<boolean>>;
  setModuleBorderColor: Dispatch<SetStateAction<string>>;
  setRandomizeModuleColors: Dispatch<SetStateAction<boolean>>;
  regenerateModuleColors: () => void;
  projectNumber: string;
  setProjectNumber: Dispatch<SetStateAction<string>>;
  versionNumber: string;
  setVersionNumber: Dispatch<SetStateAction<string>>;
  projectNotes: string;
  setProjectNotes: Dispatch<SetStateAction<string>>;
  uploadedMaps: string[];
  addUploadedMap: (dataUri: string) => void;
  removeUploadedMap: (index: number) => void;
  mediaServer: string;
  setMediaServer: Dispatch<SetStateAction<string>>;
  preferredCodec: string;
  setPreferredCodec: Dispatch<SetStateAction<string>>;
  videoContainer: string;
  setVideoContainer: Dispatch<SetStateAction<string>>;
  frameRate: string;
  setFrameRate: Dispatch<SetStateAction<string>>;
  audioFormat: string;
  setAudioFormat: Dispatch<SetStateAction<string>>;
  audioEmbedded: boolean;
  setAudioEmbedded: Dispatch<SetStateAction<boolean>>;
  samplingRate: string;
  setSamplingRate: Dispatch<SetStateAction<string>>;
  audioBitRate: string;
  setAudioBitRate: Dispatch<SetStateAction<string>>;
  imageFormat: string;
  setImageFormat: Dispatch<SetStateAction<string>>;
  getProjectData: () => ProjectData;
  loadProjectData: (data: ProjectData) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  scheduleSave: () => void;
  isSyncing: boolean;
  projectName: string;
  setProjectName: (name: string) => void;
  clearAllWiring: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  startNewProject: () => void;
  gear: GearConfig;
  gearVersion: number;
  addProcessor: (entry: Omit<ProcessorEntry, 'id'>) => string;
  updateProcessor: (id: string, patch: Partial<ProcessorEntry>) => void;
  removeProcessor: (id: string) => void;
  addFiberBox: (entry: Omit<FiberBoxEntry, 'id'>) => string;
  updateFiberBox: (id: string, patch: Partial<FiberBoxEntry>) => void;
  removeFiberBox: (id: string) => void;
  addCable: (entry: Omit<CableRun, 'id'>) => string;
  updateCable: (id: string, patch: Partial<CableRun>) => void;
  removeCable: (id: string) => void;
  regenerateGear: () => void;
  sections: ScreenSection[];
  addSection: (productId: string, columnCount: number) => void;
  updateSection: (id: string, patch: Partial<ScreenSection>) => void;
  removeSection: (id: string) => void;
  effectiveScreenWidthFromSections: number;
}

const PixelMapContext = createContext<PixelMapState | undefined>(undefined);

export const usePixelMap = () => {
  const context = useContext(PixelMapContext);
  if (!context) {
    throw new Error("usePixelMap must be used within a PixelMapProvider");
  }
  return context;
};

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

const createNewScreen = (name: string, idCounter: number): Screen => {
  const screenId = crypto.randomUUID();
  const initialWidth = 5;
  const initialHeight = 3;
  const initialTiles = Array.from({ length: initialWidth * initialHeight }, (_, i) => ({ id: idCounter + i, deleted: false }));
  
  return {
    id: screenId,
    name,
    dimensions: { tileWidth: 200, tileHeight: 200, screenWidth: initialWidth, screenHeight: initialHeight, moduleWidth: 128, moduleHeight: 128 },
    tiles: initialTiles,
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
    showScreenName: false,
    screenNameLabelPosition: 'center',
    screenNameLabelFontSize: 64,
    screenNameLabelColor: '#ffffff',
    screenNameLabelColorMode: 'auto',
    onOffMode: false,
    zoomLevels: { grid: 1, wiring: 1, raster: 1, deliverables: 1 },
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
    dataLabelColor: '#22c55e',
    powerLabelColor: '#ef4444',
    showSliceOffsetLabels: true,
    showResolution: false,
    resolutionLabelPosition: 'bottom-right',
    resolutionLabelFontSize: 32,
    resolutionLabelColor: '#ffffff',
    resolutionLabelColorMode: 'auto',
    showDimensions: false,
    dimensionUnit: 'all',
    dimensionLabelSize: 24,
    dimensionLabelColor: '#ffffff',
    customTileWidthMm: 0,
    customTileHeightMm: 0,
    rasterGroupId: 'raster-1',
    topHalfTile: false,
    bottomHalfTile: false,
    leftHalfTile: false,
    rightHalfTile: false,
    processorType: 'Brompton',
    selectedProductId: 'custom',
    nextTileId: idCounter + initialTiles.length,
    textOverlays: [],
    logoOverlay: null,
    showModules: false,
    moduleBorderColor: "#000000",
    randomizeModuleColors: false,
    moduleColors: [],
    rasterCrop: null,
    rasterSegments: [],
    sections: [],
  };
};

export function PixelMapProvider({ children }: { children: ReactNode }) {
  const [appState] = useState("ready");
  const gridRef = useRef<HTMLDivElement>(null);
  const wiringDiagramRef = useRef<HTMLDivElement>(null);
  const rasterMapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const nextIdCounter = useRef(1);

  const { user } = useAuth();
  const subscriptionStatus = 'pro' as 'pro' | 'trial';

  const [screens, setScreens] = useState<Screen[]>(() => {
    const initialScreen = createNewScreen("Default Screen", nextIdCounter.current);
    nextIdCounter.current = initialScreen.nextTileId;
    return [initialScreen];
  });

  const [currentScreenId, setCurrentScreenId] = useState<string>(screens[0].id);
  const [activeTab, setActiveTab] = useState('grid');
  const gearRef = useRef<GearConfig>({ processors: [], dataPorts: [], powerPorts: [], fiberBoxes: [], cables: [] });
  const [gearVersion, setGearVersion] = useState(0);
  const [rasterMapConfigs, setRasterMapConfigs] = useState<Record<string, RasterMapConfig>>({});
  const [rasterGroups, setRasterGroups] = useState<RasterGroup[]>([{ id: 'raster-1', name: 'Raster 1' }]);
  const [activeRasterGroupId, setActiveRasterGroupId] = useState<string>('raster-1');
  const [rasterBgColor, setRasterBgColor] = useState('#000000');
  // Derived: the config for the currently viewed raster group (backward-compat alias)
  const rasterMapConfig = rasterMapConfigs[activeRasterGroupId] ?? null;
  const setRasterMapConfig = (config: RasterMapConfig | null) => {
    if (config === null) setRasterMapConfigs({});
    else setRasterMapConfigs(prev => ({ ...prev, [activeRasterGroupId]: config }));
  };
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [isManualPowerModalOpen, setIsManualPowerModalOpen] = useState(false);
  const [selectedTileForPower, setSelectedTileForPower] = useState<number | null>(null);
  const [isManualDataModalOpen, setIsManualDataModalOpen] = useState(false);
  const [selectedTileForData, setSelectedTileForData] = useState<number | null>(null);
  const [isPngDownloading, setIsPngDownloading] = useState(false);
  const [wallLayoutLegend, setWallLayoutLegend] = useState<WallLayoutLegendEntry[]>([]);
  const [isWallLayoutDownloading, setIsWallLayoutDownloading] = useState(false);
  const [includeTextOverlaysInDownload, setIncludeTextOverlaysInDownload] = useState(true);
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const dragStateRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");

  // Undo/redo history — debounced auto-capture via useEffect
  const historyRef = useRef<{ past: ProjectData[]; future: ProjectData[] }>({ past: [], future: [] });
  const lastSnapshotRef = useRef<ProjectData | null>(null);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUndoRedoRef = useRef(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  // Deliverables State
  const [projectNumber, setProjectNumber] = useState("");
  const [versionNumber, setVersionNumber] = useState("1.0");
  const [projectNotes, setProjectNotes] = useState("");
  const [uploadedMaps, setUploadedMaps] = useState<string[]>([]);
  const [mediaServer, setMediaServer] = useState("disguise");
  const [preferredCodec, setPreferredCodec] = useState("HAP");
  const [videoContainer, setVideoContainer] = useState("MOV");
  const [frameRate, setFrameRate] = useState("60");
  const [audioFormat, setAudioFormat] = useState("WAV");
  const [audioEmbedded, setAudioEmbedded] = useState(false);
  const [samplingRate, setSamplingRate] = useState("48 kHz");
  const [audioBitRate, setAudioBitRate] = useState("24-bit");
  const [imageFormat, setImageFormat] = useState("PNG");

  const addUploadedMap = (dataUri: string) => setUploadedMaps(prev => [...prev, dataUri]);
  const removeUploadedMap = (index: number) => setUploadedMaps(prev => prev.filter((_, i) => i !== index));

  useEffect(() => {
      async function fetchProducts() {
          const { data, error } = await getProducts();
          if (data) {
              setProducts(data as LedProduct[]);
          }
          if (error) {
              console.error("Failed to fetch LED products:", error);
          }
      }
      fetchProducts();
  }, []);

  const currentScreen = useMemo(() => screens.find(s => s.id === currentScreenId) || screens[0], [screens, currentScreenId]);
  
  const updateScreenById = useCallback((screenId: string, updater: (s: Screen) => Screen) => {
    setScreens(prevScreens => prevScreens.map(s => s.id === screenId ? updater(s) : s));
  }, []);

  const updateCurrentScreen = useCallback((updater: (screen: Screen) => Screen) => {
    setScreens(prevScreens => prevScreens.map(s => s.id === currentScreenId ? updater(s) : s));
  }, [currentScreenId]);
  
  const setDimensions = (updater: SetStateAction<Dimensions>) => {
      updateCurrentScreen(screen => {
          const newDimensions = typeof updater === 'function' ? updater(screen.dimensions) : updater;
          const updatedScreen = { ...screen, dimensions: newDimensions };
          if (screen.selectedProductId !== 'custom') {
            updatedScreen.selectedProductId = 'custom';
          }
          
          const totalTiles = newDimensions.screenWidth * newDimensions.screenHeight;
          let newTiles: Tile[];
          if (totalTiles > 0 && totalTiles <= 4096) {
              newTiles = Array.from({ length: totalTiles }, (_, i) => ({ id: screen.nextTileId + i, deleted: false }));
          } else {
              newTiles = [];
          }

          return { 
            ...updatedScreen, 
            tiles: newTiles, 
            nextTileId: screen.nextTileId + newTiles.length,
            topHalfTile: false, 
            bottomHalfTile: false, 
            leftHalfTile: false, 
            rightHalfTile: false 
          };
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

  const regenerateTilesForSections = useCallback((screen: Screen): { tiles: Tile[]; nextTileId: number } => {
    const totalCols = screen.sections.reduce((sum, s) => sum + s.columnCount, 0);
    const rows = screen.dimensions.screenHeight;
    const totalTiles = totalCols * rows;
    if (totalTiles <= 0 || totalTiles > 4096) return { tiles: [], nextTileId: screen.nextTileId };
    let nextId = screen.nextTileId;
    const newTiles: Tile[] = Array.from({ length: totalTiles }, () => ({ id: nextId++, deleted: false }));
    return { tiles: newTiles, nextTileId: nextId };
  }, []);

  const addSection = useCallback((productId: string, columnCount: number) => {
    updateCurrentScreen(screen => {
      const product = products.find(p => p.id === productId);
      const newSection: ScreenSection = {
        id: crypto.randomUUID(),
        productId,
        columnCount: Math.max(1, columnCount),
        tileWidthPx: product?.tileWidthPx ?? screen.dimensions.tileWidth,
        tileHeightPx: product?.tileHeightPx ?? screen.dimensions.tileHeight,
        tileWidthMm: product?.tileWidthMm ?? screen.customTileWidthMm ?? 0,
        tileHeightMm: product?.tileHeightMm ?? screen.customTileHeightMm ?? 0,
      };
      const updatedSections = [...screen.sections, newSection];
      const updatedScreen = { ...screen, sections: updatedSections, dimensions: { ...screen.dimensions, screenWidth: updatedSections.reduce((sum, s) => sum + s.columnCount, 0) } };
      const { tiles, nextTileId } = regenerateTilesForSections(updatedScreen);
      return { ...updatedScreen, tiles, nextTileId };
    });
  }, [products, updateCurrentScreen, regenerateTilesForSections]);

  const updateSection = useCallback((id: string, patch: Partial<ScreenSection>) => {
    updateCurrentScreen(screen => {
      const updatedSections = screen.sections.map(s => s.id === id ? { ...s, ...patch } : s);
      const updatedScreen = { ...screen, sections: updatedSections, dimensions: { ...screen.dimensions, screenWidth: updatedSections.reduce((sum, s) => sum + s.columnCount, 0) } };
      const { tiles, nextTileId } = regenerateTilesForSections(updatedScreen);
      return { ...updatedScreen, tiles, nextTileId };
    });
  }, [updateCurrentScreen, regenerateTilesForSections]);

  const removeSection = useCallback((id: string) => {
    updateCurrentScreen(screen => {
      if (screen.sections.length <= 1) return screen;
      const updatedSections = screen.sections.filter(s => s.id !== id);
      const updatedScreen = { ...screen, sections: updatedSections, dimensions: { ...screen.dimensions, screenWidth: updatedSections.reduce((sum, s) => sum + s.columnCount, 0) } };
      const { tiles, nextTileId } = regenerateTilesForSections(updatedScreen);
      return { ...updatedScreen, tiles, nextTileId };
    });
  }, [updateCurrentScreen, regenerateTilesForSections]);

  const effectiveScreenWidthFromSections = useMemo(() => {
    return currentScreen.sections.reduce((sum, s) => sum + s.columnCount, 0) || currentScreen.dimensions.screenWidth;
  }, [currentScreen.sections, currentScreen.dimensions.screenWidth]);

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
  const setShowScreenName = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showScreenName: typeof updater === 'function' ? updater(s.showScreenName) : updater }));
  const setScreenNameLabelPosition = (updater: SetStateAction<LabelPosition>) => updateCurrentScreen(s => ({ ...s, screenNameLabelPosition: typeof updater === 'function' ? updater(s.screenNameLabelPosition) : updater }));
  const setScreenNameLabelFontSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, screenNameLabelFontSize: typeof updater === 'function' ? updater(s.screenNameLabelFontSize) : updater }));
  const setScreenNameLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, screenNameLabelColor: typeof updater === 'function' ? updater(s.screenNameLabelColor) : updater }));
  const setScreenNameLabelColorMode = (updater: SetStateAction<LabelColorMode>) => updateCurrentScreen(s => ({ ...s, screenNameLabelColorMode: typeof updater === 'function' ? updater(s.screenNameLabelColorMode) : updater }));
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
  const setDataLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, dataLabelColor: typeof updater === 'function' ? updater(s.dataLabelColor) : updater }));
  const setPowerLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, powerLabelColor: typeof updater === 'function' ? updater(s.powerLabelColor) : updater }));
  const setShowSliceOffsetLabels = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showSliceOffsetLabels: typeof updater === 'function' ? updater(s.showSliceOffsetLabels) : updater }));
  const setShowResolution = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showResolution: typeof updater === 'function' ? updater(s.showResolution ?? false) : updater }));
  const setResolutionLabelPosition = (updater: SetStateAction<LabelPosition>) => updateCurrentScreen(s => ({ ...s, resolutionLabelPosition: typeof updater === 'function' ? updater(s.resolutionLabelPosition ?? 'bottom-right') : updater }));
  const setResolutionLabelFontSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, resolutionLabelFontSize: typeof updater === 'function' ? updater(s.resolutionLabelFontSize ?? 32) : updater }));
  const setResolutionLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, resolutionLabelColor: typeof updater === 'function' ? updater(s.resolutionLabelColor ?? '#ffffff') : updater }));
  const setResolutionLabelColorMode = (updater: SetStateAction<LabelColorMode>) => updateCurrentScreen(s => ({ ...s, resolutionLabelColorMode: typeof updater === 'function' ? updater(s.resolutionLabelColorMode ?? 'auto') : updater }));
  const setShowDimensions = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showDimensions: typeof updater === 'function' ? updater(s.showDimensions ?? false) : updater }));
  const setDimensionUnit = (updater: SetStateAction<'mm' | 'meters' | 'inches' | 'decimal-feet' | 'feet-inches' | 'tiles' | 'all'>) => updateCurrentScreen(s => ({ ...s, dimensionUnit: typeof updater === 'function' ? updater(s.dimensionUnit ?? 'all') : updater }));
  const setDimensionLabelSize = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, dimensionLabelSize: typeof updater === 'function' ? updater(s.dimensionLabelSize ?? 24) : updater }));
  const setDimensionLabelColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, dimensionLabelColor: typeof updater === 'function' ? updater(s.dimensionLabelColor ?? '#ffffff') : updater }));
  const setCustomTileWidthMm = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, customTileWidthMm: typeof updater === 'function' ? updater(s.customTileWidthMm ?? 0) : updater }));
  const setCustomTileHeightMm = (updater: SetStateAction<number>) => updateCurrentScreen(s => ({ ...s, customTileHeightMm: typeof updater === 'function' ? updater(s.customTileHeightMm ?? 0) : updater }));
  const setProcessorType = (updater: SetStateAction<ProcessorType>) => updateCurrentScreen(s => ({ ...s, processorType: typeof updater === 'function' ? updater(s.processorType) : updater }));

  const drawTextOverlaysOnCtx = useCallback((
    ctx: CanvasRenderingContext2D,
    overlays: TextOverlay[],
    canvasWidth: number,
    canvasHeight: number,
    offsetX: number = 0,
    offsetY: number = 0,
  ) => {
    for (const overlay of overlays) {
      if (!overlay.text) continue;
      const x = overlay.x + offsetX;
      const y = overlay.y + offsetY;
      if (x > canvasWidth || y > canvasHeight) continue;

      ctx.save();
      ctx.translate(x, y);
      ctx.translate(overlay.fontSize / 2, overlay.fontSize / 2);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.translate(-overlay.fontSize / 2, -overlay.fontSize / 2);

      ctx.font = `bold ${overlay.fontSize}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      if (overlay.showBackground) {
        const textWidth = ctx.measureText(overlay.text).width;
        ctx.fillStyle = overlay.backgroundColor;
        ctx.fillRect(-4, -4, textWidth + 16, overlay.fontSize + 8);
      }

      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = overlay.fontSize * 0.2;
      ctx.fillStyle = overlay.colorMode === 'auto' ? '#FFFFFF' : overlay.color;
      ctx.fillText(overlay.text, 4, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, []);

  const addTextOverlay = useCallback(() => {
    updateCurrentScreen(s => {
      const newOverlay: TextOverlay = {
        id: crypto.randomUUID(),
        text: 'New Text',
        x: 20,
        y: 20,
        fontSize: 48,
        color: '#ffffff',
        colorMode: 'single',
        fontWeight: 700,
        rotation: 0,
        backgroundColor: '#000000',
        showBackground: false,
      };
      return { ...s, textOverlays: [...(s.textOverlays ?? []), newOverlay] };
    });
  }, [updateCurrentScreen]);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    updateCurrentScreen(s => ({
      ...s,
      textOverlays: (s.textOverlays ?? []).map(o => o.id === id ? { ...o, ...updates } : o),
    }));
  }, [updateCurrentScreen]);

  const removeTextOverlay = useCallback((id: string) => {
    updateCurrentScreen(s => ({
      ...s,
      textOverlays: (s.textOverlays ?? []).filter(o => o.id !== id),
    }));
  }, [updateCurrentScreen]);

  const setLogoOverlay = (updater: SetStateAction<LogoOverlay | null>) => updateCurrentScreen(s => ({ ...s, logoOverlay: typeof updater === 'function' ? updater(s.logoOverlay ?? null) : updater }));

  const addRasterGroup = useCallback(() => {
    const newId = `raster-${Date.now()}`;
    const newGroup: RasterGroup = { id: newId, name: `Raster ${rasterGroups.length + 1}` };
    setRasterGroups(prev => [...prev, newGroup]);
    setActiveRasterGroupId(newId);
    // Assign current screen to new group
    updateCurrentScreen(s => ({ ...s, rasterGroupId: newId }));
    return newId;
  }, [rasterGroups.length, updateCurrentScreen]);

  const renameRasterGroup = useCallback((id: string, name: string) => {
    setRasterGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  }, []);

  const deleteRasterGroup = useCallback((id: string) => {
    if (rasterGroups.length <= 1) return;
    const fallbackId = rasterGroups.find(g => g.id !== id)?.id ?? 'raster-1';
    setRasterGroups(prev => prev.filter(g => g.id !== id));
    // Move screens in deleted group to fallback
    setScreens(prev => prev.map(s => s.rasterGroupId === id ? { ...s, rasterGroupId: fallbackId } : s));
    setRasterMapConfigs(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeRasterGroupId === id) setActiveRasterGroupId(fallbackId);
  }, [rasterGroups, activeRasterGroupId]);
  const setShowModules = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, showModules: typeof updater === 'function' ? updater(s.showModules) : updater }));
  const setModuleBorderColor = (updater: SetStateAction<string>) => updateCurrentScreen(s => ({ ...s, moduleBorderColor: typeof updater === 'function' ? updater(s.moduleBorderColor) : updater }));
  const setRandomizeModuleColors = (updater: SetStateAction<boolean>) => updateCurrentScreen(s => ({ ...s, randomizeModuleColors: typeof updater === 'function' ? updater(s.randomizeModuleColors) : updater }));
  
  const regenerateModuleColors = useCallback(() => {
    updateCurrentScreen(screen => {
      const newModuleColors = screen.tiles.map(tile => {
        if (tile.deleted) return [];
        const numModulesX = Math.floor(screen.dimensions.tileWidth / screen.dimensions.moduleWidth);
        const numModulesY = Math.floor(screen.dimensions.tileHeight / screen.dimensions.moduleHeight);
        const totalModules = numModulesX * numModulesY;
        return Array.from({ length: totalModules }, () => `hsl(${Math.random() * 360}, 70%, 50%)`);
      });
      return { ...screen, moduleColors: newModuleColors };
    });
  }, [updateCurrentScreen]);

  useEffect(() => {
    regenerateModuleColors();
  }, [currentScreen.tiles, currentScreen.dimensions.moduleWidth, currentScreen.dimensions.moduleHeight, regenerateModuleColors]);


  const addNewScreen = () => {
    const newScreen = createNewScreen(`Screen ${screens.length + 1}`, nextIdCounter.current);
    nextIdCounter.current = newScreen.nextTileId;
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

  const duplicateScreen = (id: string) => {
    const screenToDuplicate = screens.find(s => s.id === id);
    if (!screenToDuplicate) return;

    const newScreen = JSON.parse(JSON.stringify(screenToDuplicate));
    newScreen.id = crypto.randomUUID();
    newScreen.name = `${screenToDuplicate.name} (Copy)`;
    
    let nextTileId = nextIdCounter.current;
    newScreen.tiles = newScreen.tiles.map((tile: Tile) => {
      const newTile = { ...tile, id: nextTileId++ };
      return newTile;
    });
    nextIdCounter.current = nextTileId;
    newScreen.nextTileId = nextTileId;

    setScreens(prev => [...prev, newScreen]);
    setCurrentScreenId(newScreen.id);
  };

  const mergeRemoteScreen = useCallback((remoteScreen: Screen) => {
    setScreens(prev => {
      const exists = prev.some(s => s.id === remoteScreen.id);
      if (exists) {
        return prev.map(s => s.id === remoteScreen.id ? { ...remoteScreen, zoomLevels: s.zoomLevels } : s);
      }
      return [...prev, remoteScreen];
    });
    const maxId = Math.max(nextIdCounter.current, ...remoteScreen.tiles.map(t => t.id), remoteScreen.nextTileId ?? 0);
    nextIdCounter.current = maxId + 1;
  }, []);

  const removeRemoteScreen = useCallback((screenId: string) => {
    setScreens(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(s => s.id !== screenId);
      if (filtered.length === 0) return prev;
      return filtered;
    });
  }, []);

  const { dimensions, tiles, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile } = currentScreen;

  const effectiveScreenHeight = useMemo(() => {
    let height = dimensions.screenHeight;
    if (topHalfTile) height++;
    if (bottomHalfTile) height++;
    return height;
  }, [dimensions.screenHeight, topHalfTile, bottomHalfTile]);
  
  const effectiveScreenWidth = useMemo(() => {
    let width = dimensions.screenWidth;
    if (leftHalfTile) width++;
    if (rightHalfTile) width++;
    return width;
  }, [dimensions.screenWidth, leftHalfTile, rightHalfTile]);

  const wiringData = useMemo(() => {
    if (!currentScreen) return [];
    const currentScreenGroupConfig = rasterMapConfigs[currentScreen.rasterGroupId ?? 'raster-1'] ?? null;
    return getWiringData({
      dimensions: { ...currentScreen.dimensions, screenHeight: effectiveScreenHeight, screenWidth: effectiveScreenWidth },
      tiles: currentScreen.tiles,
      wiringPortConfig: currentScreen.wiringPortConfig,
      dataPortStartNumber: currentScreen.dataPortStartNumber,
      wiringPattern: currentScreen.wiringPattern,
      powerWiringPattern: currentScreen.powerWiringPattern,
      rasterMapConfig: currentScreenGroupConfig,
      tilesPerPowerString: currentScreen.tilesPerPowerString,
      topHalfTile: currentScreen.topHalfTile,
      bottomHalfTile: currentScreen.bottomHalfTile,
      leftHalfTile: currentScreen.leftHalfTile,
      rightHalfTile: currentScreen.rightHalfTile,
      processorType: currentScreen.processorType,
      screenId: currentScreen.id
    })
  }, [currentScreen, effectiveScreenHeight, effectiveScreenWidth, rasterMapConfigs]);


  const zoom = currentScreen.zoomLevels[activeTab as keyof typeof currentScreen.zoomLevels] || 1;
  
  const setZoom = (value: number | ((prevZoom: number) => number), applyToAllTabs = false) => {
    updateCurrentScreen(screen => {
      const newZoomLevels = { ...screen.zoomLevels };
      const currentTabKey = activeTab as keyof typeof newZoomLevels;
      const currentZoom = newZoomLevels[currentTabKey];
      const newZoom = typeof value === 'function' ? value(currentZoom) : value;

      if (applyToAllTabs) {
        return { ...screen, zoomLevels: { grid: newZoom, wiring: newZoom, raster: newZoom, deliverables: newZoom } };
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
        let nextTileId = screen.nextTileId;
        const currentEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
        let newTiles: Tile[];
        
        if (add) {
            const newRow = Array.from({ length: currentEffectiveWidth }, (_, i) => ({ id: nextTileId + i, deleted: false }));
            nextTileId += newRow.length;
            newTiles = [...newRow, ...screen.tiles];
        } else {
            newTiles = screen.tiles.slice(currentEffectiveWidth);
        }
        
        return { ...screen, topHalfTile: add, tiles: newTiles, nextTileId };
    });
};

const handleBottomHalfTileChange = (add: boolean) => {
    updateCurrentScreen(screen => {
        let nextTileId = screen.nextTileId;
        const currentEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
        let newTiles: Tile[];

        if (add) {
            const newRow = Array.from({ length: currentEffectiveWidth }, (_, i) => ({ id: nextTileId + i, deleted: false }));
            nextTileId += newRow.length;
            newTiles = [...screen.tiles, ...newRow];
        } else {
            newTiles = screen.tiles.slice(0, screen.tiles.length - currentEffectiveWidth);
        }
        return { ...screen, bottomHalfTile: add, tiles: newTiles, nextTileId };
    });
};

const handleLeftHalfTileChange = (add: boolean) => {
    updateCurrentScreen(screen => {
        let nextTileId = screen.nextTileId;
        let newTiles: Tile[] = [];
        const originalHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
        const originalWidth = screen.dimensions.screenWidth + (screen.rightHalfTile ? 1 : 0);

        if (add) {
            for (let y = 0; y < originalHeight; y++) {
                newTiles.push({ id: nextTileId++, deleted: false });
                newTiles.push(...screen.tiles.slice(y * originalWidth, (y + 1) * originalWidth));
            }
        } else {
            const currentWidth = originalWidth + 1;
            for (let y = 0; y < originalHeight; y++) {
                newTiles.push(...screen.tiles.slice(y * currentWidth + 1, (y + 1) * currentWidth));
            }
        }
        return { ...screen, leftHalfTile: add, tiles: newTiles, nextTileId };
    });
};

const handleRightHalfTileChange = (add: boolean) => {
    updateCurrentScreen(screen => {
        let nextTileId = screen.nextTileId;
        let newTiles: Tile[] = [];
        const originalHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
        const originalWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0);

        if (add) {
            for (let y = 0; y < originalHeight; y++) {
                newTiles.push(...screen.tiles.slice(y * originalWidth, (y + 1) * originalWidth));
                newTiles.push({ id: nextTileId++, deleted: false });
            }
        } else {
            const currentWidth = originalWidth + 1;
            for (let y = 0; y < originalHeight; y++) {
                newTiles.push(...screen.tiles.slice(y * currentWidth, (y + 1) * currentWidth - 1));
            }
        }
        return { ...screen, rightHalfTile: add, tiles: newTiles, nextTileId };
    });
};
  
  const [activeBounds, setActiveBounds] = useState<ActiveBounds | null>(null);

  useEffect(() => {
    const activeTiles = currentScreen.tiles.map((t, i) => ({...t, index: i})).filter(t => !t.deleted);

    if (activeTiles.length === 0) {
        setActiveBounds(null);
        return;
    }

    let minX = effectiveScreenWidth;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;

    activeTiles.forEach(tile => {
        const x = tile.index % effectiveScreenWidth;
        const y = Math.floor(tile.index / effectiveScreenWidth);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });
    
    setActiveBounds({ minX, minY, maxX, maxY });
  }, [currentScreen.tiles, effectiveScreenWidth]);

  const deletedCount = useMemo(() => currentScreen.tiles.filter((tile) => tile.deleted).length, [currentScreen.tiles]);
  const coloredCount = useMemo(() => currentScreen.tiles.filter((tile) => !!tile.color && !tile.deleted).length, [currentScreen.tiles]);

  const labels = useMemo(() => {
    const totalTiles = currentScreen.tiles.length;
    if (totalTiles <= 0) return [];

    const newLabels = Array(totalTiles).fill('');
    const startNumber = currentScreen.labelStartNumber || 1;
    const sectionLayout = currentScreen.sections.length > 0;

    if (sectionLayout) {
      let tileOffset = 0;
      let colOffset = 0;
      for (const section of currentScreen.sections) {
        for (let localIndex = 0; localIndex < section.columnCount * effectiveScreenHeight; localIndex++) {
          const index = tileOffset + localIndex;
          const tile = currentScreen.tiles[index];
          if (!tile || tile.deleted) continue;
          const x = localIndex % section.columnCount;
          const y = Math.floor(localIndex / section.columnCount);
          if (currentScreen.labelFormat === 'sequential') {
            newLabels[index] = String(index + startNumber);
          } else if (currentScreen.labelFormat === 'dmx-style') {
            const universeSize = 170;
            const dmxIndex = index + startNumber - 1;
            const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(dmxIndex / universeSize));
            newLabels[index] = `${universe}${(dmxIndex % universeSize) + 1}`;
          } else if (currentScreen.labelFormat === 'row-col') {
            newLabels[index] = `${y + startNumber}-${x + 1 + colOffset}`;
          } else if (currentScreen.labelFormat === 'row-letter-col-number') {
            newLabels[index] = `${String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1)}${x + 1 + colOffset}`;
          }
        }
        tileOffset += section.columnCount * effectiveScreenHeight;
        colOffset += section.columnCount;
      }
      return newLabels;
    }

    const activeTileIndices = currentScreen.tiles.map((_, i) => i).filter(i => !currentScreen.tiles[i].deleted);
    const pathOrder = getPathOrder(activeTileIndices, currentScreen.wiringPattern, effectiveScreenWidth, effectiveScreenHeight);

    if (currentScreen.labelFormat === 'sequential' || currentScreen.labelFormat === 'dmx-style') {
      pathOrder.forEach((originalIndex, pathIndex) => {
        if (currentScreen.labelFormat === 'sequential') {
          newLabels[originalIndex] = String(pathIndex + startNumber);
        } else {
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
          const x = i % effectiveScreenWidth;
          const y = Math.floor(i / effectiveScreenWidth);
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
  }, [currentScreen, effectiveScreenWidth, effectiveScreenHeight]);

  const sliceOffsetLabels = useMemo(() => {
    const currentGroupConfig = rasterMapConfigs[currentScreen.rasterGroupId ?? 'raster-1'] ?? null;
    if (!currentGroupConfig || !activeBounds || !currentGroupConfig.slices.length || !currentScreen.rasterOffset || !currentScreen.wiringPattern) {
      return [];
    }

    const { tileHeight, tileWidth } = currentScreen.dimensions;
    const { slices, outputWidth, outputHeight } = currentGroupConfig;
    const rasterMapConfig = currentGroupConfig;
    
    const newLabels = Array(effectiveScreenWidth * effectiveScreenHeight).fill('');
    const activeTileIndices = currentScreen.tiles.map((_, i) => i).filter(i => !currentScreen.tiles[i].deleted);

    const tilesBySlice = new Map<string, number[]>();
    activeTileIndices.forEach(index => {
      const x = index % effectiveScreenWidth;
      const y = Math.floor(index / effectiveScreenWidth);

      if (x < activeBounds.minX || x > activeBounds.maxX || y < activeBounds.minY || y > activeBounds.maxY) {
                return;
              }
      
      let tileContentY = 0;
      for (let i = activeBounds.minY; i < y; i++) {
        const isTopRow = topHalfTile && i === 0;
        const isBottomRow = bottomHalfTile && i === effectiveScreenHeight - 1;
        tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
      }
      
      let tileContentX = 0;
      for (let i = activeBounds.minX; i < x; i++) {
          const isLeftHalf = leftHalfTile && i === 0;
          const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
          tileContentX += (isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth;
      }


      const absoluteContentX = tileContentX + currentScreen.rasterOffset.x;
      const absoluteContentY = tileContentY + currentScreen.rasterOffset.y;

      const sliceCol = Math.floor(absoluteContentX / outputWidth);
      const sliceRow = Math.floor(absoluteContentY / outputHeight);
      const sliceKey = `${sliceRow}-${sliceCol}`;
      
      if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
      tilesBySlice.get(sliceKey)!.push(index);
    });

    tilesBySlice.forEach((sliceIndices, sliceKey) => {
      const pathOrder = getPathOrder(sliceIndices, currentScreen.wiringPattern, effectiveScreenWidth, effectiveScreenHeight);
      const currentSlice = slices.find(s => s.key === sliceKey);
      
      if (currentSlice && pathOrder.length > 0) {
        const firstTileIndex = pathOrder[0];
        
        const x = firstTileIndex % effectiveScreenWidth;
        const y = Math.floor(firstTileIndex / effectiveScreenWidth);

        let tileContentY = 0;
        for (let i = activeBounds.minY; i < y; i++) {
            const isTopRow = topHalfTile && i === 0;
            const isBottomRow = bottomHalfTile && i === effectiveScreenHeight - 1;
            tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
        }

        let tileContentX = 0;
        for (let i = activeBounds.minX; i < x; i++) {
            const isLeftHalf = leftHalfTile && i === 0;
            const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
            tileContentX += (isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth;
        }

        const absoluteContentX = tileContentX + currentScreen.rasterOffset.x;
        const absoluteContentY = tileContentY + currentScreen.rasterOffset.y;

        const offsetXInSlice = absoluteContentX - currentSlice.x;
        const offsetYInSlice = absoluteContentY - currentSlice.y;

        newLabels[firstTileIndex] = `(${offsetXInSlice},${offsetYInSlice})`;
      }
    });

    return newLabels;
  }, [currentScreen, rasterMapConfigs, activeBounds, effectiveScreenWidth, effectiveScreenHeight, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile]);

  const applyManualPowerWiring = useCallback((args: { startTileId: number; label: string; numTiles: number; pattern: WiringPattern; runLength?: number; }) => {
    updateCurrentScreen(screen => {
        const newTiles = applyManualPowerWiringLogic(
            screen.tiles,
            args.startTileId,
            args.numTiles,
            args.pattern,
            effectiveScreenWidth,
            effectiveScreenHeight,
            args.label,
            args.runLength,
        );
        return { ...screen, tiles: newTiles };
    });
  }, [updateCurrentScreen, effectiveScreenWidth, effectiveScreenHeight]);
  
  const applyManualDataWiring = useCallback((args: { startTileId: number; mainLabel: string; backupLabel: string, numTiles: number; pattern: WiringPattern; runLength?: number; }) => {
     updateCurrentScreen(screen => {
        const newTiles = applyManualDataWiringLogic(
            screen.tiles,
            args.startTileId,
            args.numTiles,
            args.pattern,
            effectiveScreenWidth,
            effectiveScreenHeight,
            args.mainLabel,
            args.backupLabel,
            args.runLength,
        );
        return { ...screen, tiles: newTiles };
    });
  }, [updateCurrentScreen, effectiveScreenWidth, effectiveScreenHeight]);

  const addProcessor = useCallback((entry: Omit<ProcessorEntry, 'id'>) => {
    const id = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    gearRef.current = { ...gearRef.current, processors: [...gearRef.current.processors, { ...entry, id }] };
    setGearVersion(v => v + 1);
    return id;
  }, []);

  const updateProcessor = useCallback((id: string, patch: Partial<ProcessorEntry>) => {
    gearRef.current = { ...gearRef.current, processors: gearRef.current.processors.map(p => p.id === id ? { ...p, ...patch } : p) };
    setGearVersion(v => v + 1);
  }, []);

  const removeProcessor = useCallback((id: string) => {
    gearRef.current = {
      ...gearRef.current,
      processors: gearRef.current.processors.filter(p => p.id !== id),
      fiberBoxes: gearRef.current.fiberBoxes.filter(b => b.processorId !== id),
      cables: gearRef.current.cables.filter(c => c.fromLabel !== id && c.toLabel !== id),
    };
    setGearVersion(v => v + 1);
  }, []);

  const addFiberBox = useCallback((entry: Omit<FiberBoxEntry, 'id'>) => {
    const id = `box-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    gearRef.current = { ...gearRef.current, fiberBoxes: [...gearRef.current.fiberBoxes, { ...entry, id }] };
    setGearVersion(v => v + 1);
    return id;
  }, []);

  const updateFiberBox = useCallback((id: string, patch: Partial<FiberBoxEntry>) => {
    gearRef.current = { ...gearRef.current, fiberBoxes: gearRef.current.fiberBoxes.map(b => b.id === id ? { ...b, ...patch } : b) };
    setGearVersion(v => v + 1);
  }, []);

  const removeFiberBox = useCallback((id: string) => {
    gearRef.current = { ...gearRef.current, fiberBoxes: gearRef.current.fiberBoxes.filter(b => b.id !== id) };
    setGearVersion(v => v + 1);
  }, []);

  const addCable = useCallback((entry: Omit<CableRun, 'id'>) => {
    const id = `cable-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    gearRef.current = { ...gearRef.current, cables: [...gearRef.current.cables, { ...entry, id }] };
    setGearVersion(v => v + 1);
    return id;
  }, []);

  const updateCable = useCallback((id: string, patch: Partial<CableRun>) => {
    gearRef.current = { ...gearRef.current, cables: gearRef.current.cables.map(c => c.id === id ? { ...c, ...patch } : c) };
    setGearVersion(v => v + 1);
  }, []);

  const removeCable = useCallback((id: string) => {
    gearRef.current = { ...gearRef.current, cables: gearRef.current.cables.filter(c => c.id !== id) };
    setGearVersion(v => v + 1);
  }, []);

  const regenerateGear = useCallback(() => {
    const processors: ProcessorEntry[] = [];
    const dataPorts: DataPortEntry[] = [];
    const powerPorts: PowerPortEntry[] = [];
    const fiberBoxes: FiberBoxEntry[] = [];
    const cables: CableRun[] = [];

    const getBoxMeta = (procType: ProcessorType) => procType === 'Novastar' ? { label: 'CVT Box', ports: 16 }
      : procType === 'Helios' ? { label: 'Helios Switch', ports: 12 }
      : { label: 'XD Box', ports: 10 };

    // One primary processor + one backup processor per slice within each raster group.
    // When a screen is too big for one raster, the raster map is split into multiple slices;
    // each slice gets its own primary + backup processor pair.
    rasterGroups.forEach((group, groupIdx) => {
      const groupConfig = rasterMapConfigs[group.id];
      const screenIds = groupConfig?.screenArrangement?.map(s => s.screenId) ?? [];
      if (screenIds.length === 0) return;
      const screenForType = screens.find(s => screenIds.includes(s.id)) ?? screens[0];
      const procType = screenForType?.processorType ?? 'Brompton';
      const meta = getBoxMeta(procType);

      const slices = groupConfig?.slices ?? [];
      const sliceEntries = slices.length > 0
        ? slices.map((s, i) => ({ key: s.key, label: slices.length > 1 ? `${group.name} ${i + 1}` : group.name, index: i }))
        : [{ key: 'default', label: group.name, index: 0 }];

      sliceEntries.forEach(({ key: sliceKey, label: sliceLabel, index: sliceIdx }) => {
        const primaryProcId = `proc-${group.id}-${sliceKey}`;
        const backupProcId = `proc-backup-${group.id}-${sliceKey}`;
        const primaryBoxId = `box-${group.id}-${sliceKey}`;
        const backupBoxId = `box-backup-${group.id}-${sliceKey}`;

        processors.push({
          id: primaryProcId,
          label: sliceLabel,
          type: procType,
          screenIds,
          rasterGroupId: group.id,
          isBackup: false,
          sliceKey,
        });
        processors.push({
          id: backupProcId,
          label: slices.length > 1 ? `${group.name} ${sliceIdx + 1} (Backup)` : `${group.name} (Backup)`,
          type: procType,
          screenIds,
          rasterGroupId: group.id,
          isBackup: true,
          sliceKey,
        });

        fiberBoxes.push({
          id: primaryBoxId,
          label: `${meta.label} ${groupIdx + 1}.${sliceIdx + 1}`,
          processorId: primaryProcId,
          portCount: meta.ports,
          screenIds,
          isBackup: false,
        });
        fiberBoxes.push({
          id: backupBoxId,
          label: `${meta.label} ${groupIdx + 1}.${sliceIdx + 1} (Backup)`,
          processorId: backupProcId,
          portCount: meta.ports,
          screenIds,
          isBackup: true,
        });

        cables.push({
          id: `cable-fiber-${group.id}-${sliceKey}`,
          kind: 'fiber',
          fromLabel: sliceLabel,
          toLabel: `${meta.label} ${groupIdx + 1}.${sliceIdx + 1}`,
          length: 100,
          unit: 'm',
        });
        cables.push({
          id: `cable-fiber-backup-${group.id}-${sliceKey}`,
          kind: 'fiber',
          fromLabel: `${sliceLabel} (Backup)`,
          toLabel: `${meta.label} ${groupIdx + 1}.${sliceIdx + 1} (Backup)`,
          length: 100,
          unit: 'm',
        });
      });
    });

    // Extract data ports and power ports from each screen's wiring data
    screens.forEach((screen) => {
      const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
      const screenEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);

      // Find the raster group + config that owns this screen
      const owningGroup = rasterGroups.find(g => {
        const cfg = rasterMapConfigs[g.id];
        return cfg?.screenArrangement?.some(s => s.screenId === screen.id);
      }) ?? rasterGroups[0];
      const screenGroupConfig = rasterMapConfigs[owningGroup?.id ?? ''] ?? null;

      const wiringInfo = getWiringData({
        dimensions: { ...screen.dimensions, screenHeight: screenEffectiveHeight, screenWidth: screenEffectiveWidth },
        tiles: screen.tiles,
        wiringPortConfig: screen.wiringPortConfig,
        dataPortStartNumber: screen.dataPortStartNumber,
        wiringPattern: screen.wiringPattern,
        powerWiringPattern: screen.powerWiringPattern,
        rasterMapConfig: screenGroupConfig,
        tilesPerPowerString: screen.tilesPerPowerString,
        topHalfTile: screen.topHalfTile,
        bottomHalfTile: screen.bottomHalfTile,
        leftHalfTile: screen.leftHalfTile,
        rightHalfTile: screen.rightHalfTile,
        processorType: screen.processorType,
        screenId: screen.id,
      });

      // Helper: compute which slice a tile (x,y) belongs to, based on raster map config.
      // Returns the slice key, or 'default' if no slices configured.
      const computeSliceKey = (tileX: number, tileY: number): string => {
        if (!screenGroupConfig || screenGroupConfig.slices.length === 0 || screenGroupConfig.outputWidth <= 0) return 'default';
        const arrangement = screenGroupConfig.screenArrangement.find(s => s.screenId === screen.id);
        if (!arrangement) return 'default';
        const { tileWidth, tileHeight } = screen.dimensions;
        const { minX, minY } = arrangement.activeBounds;
        // Compute pixel position relative to content area
        let tileContentY = 0;
        for (let i = minY; i < tileY; i++) {
          const isTopRow = screen.topHalfTile && i === 0;
          const isBottomRow = screen.bottomHalfTile && i === screenEffectiveHeight - 1;
          tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
        }
        let tileContentX = 0;
        for (let i = minX; i < tileX; i++) {
          const isLeftHalf = screen.leftHalfTile && i === 0;
          const isRightHalf = screen.rightHalfTile && i === screenEffectiveWidth - 1;
          tileContentX += (isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth;
        }
        const absoluteContentX = tileContentX + arrangement.x;
        const absoluteContentY = tileContentY + arrangement.y;
        const matchingSlice = screenGroupConfig.slices.find(s =>
          absoluteContentX >= s.x && absoluteContentX < s.x + s.width &&
          absoluteContentY >= s.y && absoluteContentY < s.y + s.height
        );
        return matchingSlice?.key ?? 'default';
      };

      // Find processors for this screen's raster group, keyed by slice
      const findProcessorForSlice = (sliceKey: string, isBackup: boolean) => {
        return processors.find(p =>
          p.rasterGroupId === owningGroup?.id &&
          p.sliceKey === sliceKey &&
          p.isBackup === isBackup
        ) ?? processors.find(p => p.rasterGroupId === owningGroup?.id && p.isBackup === isBackup);
      };

      // Collect unique data port labels (non-empty dataLabel = start of a chain).
      // Chains are linked via nextTile {x,y}; backupLabel lives on the LAST tile.
      // Build a coordinate lookup so we can walk the linked list.
      const wiringByXY = new Map<string, typeof wiringInfo[number]>();
      wiringInfo.forEach((info) => {
        if (!info.isDeleted) wiringByXY.set(`${info.x},${info.y}`, info);
      });

      const seenDataLabels = new Set<string>();
      wiringInfo.forEach((info) => {
        if (info.dataLabel && !info.isDeleted && !seenDataLabels.has(info.dataLabel)) {
          seenDataLabels.add(info.dataLabel);
          let tileCount = 0;
          let chainBackupLabel = '';
          let current: typeof info | undefined = info;
          const visited = new Set<string>();
          while (current && !visited.has(`${current.x},${current.y}`)) {
            visited.add(`${current.x},${current.y}`);
            tileCount++;
            if (current.backupLabel) chainBackupLabel = current.backupLabel;
            if (!current.nextTile) break;
            current = wiringByXY.get(`${current.nextTile.x},${current.nextTile.y}`);
          }

          const isBackupPort = chainBackupLabel !== '';
          const sliceKey = computeSliceKey(info.x, info.y);
          const primaryProcId = findProcessorForSlice(sliceKey, false)?.id ?? '';
          const backupProcId = findProcessorForSlice(sliceKey, true)?.id ?? primaryProcId;

          // Primary data port entry
          dataPorts.push({
            id: `dp-${screen.id}-${info.dataLabel}`,
            label: info.dataLabel,
            backupLabel: chainBackupLabel,
            processorId: primaryProcId,
            screenId: screen.id,
            tileCount,
            isBackup: false,
            sliceKey,
            rasterGroupId: owningGroup?.id,
          });

          // Backup data port entry — mirrors the primary, one per primary port
          if (isBackupPort) {
            dataPorts.push({
              id: `dp-backup-${screen.id}-${chainBackupLabel}`,
              label: chainBackupLabel,
              backupLabel: '',
              processorId: backupProcId || primaryProcId,
              screenId: screen.id,
              tileCount,
              isBackup: true,
              sliceKey,
              rasterGroupId: owningGroup?.id,
            });
          }

          // Cat cable run: data port -> LED tile chain
          cables.push({
            id: `cable-cat-${screen.id}-${info.dataLabel}`,
            kind: 'cat',
            fromLabel: info.dataLabel,
            toLabel: `${screen.name} chain`,
            length: 10,
            unit: 'm',
          });
          if (isBackupPort) {
            cables.push({
              id: `cable-cat-backup-${screen.id}-${chainBackupLabel}`,
              kind: 'cat',
              fromLabel: chainBackupLabel,
              toLabel: `${screen.name} chain`,
              length: 10,
              unit: 'm',
            });
          }
        }
      });

      // Collect unique power port labels — follow nextPowerTile linked list
      const seenPowerLabels = new Set<string>();
      wiringInfo.forEach((info) => {
        if (info.powerPortLabel && !info.isDeleted && !seenPowerLabels.has(info.powerPortLabel)) {
          seenPowerLabels.add(info.powerPortLabel);
          let tileCount = 0;
          let current: typeof info | undefined = info;
          const visited = new Set<string>();
          while (current && !visited.has(`${current.x},${current.y}`)) {
            visited.add(`${current.x},${current.y}`);
            tileCount++;
            if (!current.nextPowerTile) break;
            current = wiringByXY.get(`${current.nextPowerTile.x},${current.nextPowerTile.y}`);
          }

          const sliceKey = computeSliceKey(info.x, info.y);
          const primaryProcId = findProcessorForSlice(sliceKey, false)?.id ?? '';

          powerPorts.push({
            id: `pp-${screen.id}-${info.powerPortLabel}`,
            label: info.powerPortLabel,
            processorId: primaryProcId,
            screenId: screen.id,
            tileCount,
            sliceKey,
          });

          // Power cable run: power port -> LED tile chain (default 10m / ~33ft, editable)
          cables.push({
            id: `cable-power-${screen.id}-${info.powerPortLabel}`,
            kind: 'power',
            fromLabel: info.powerPortLabel,
            toLabel: `${screen.name} chain`,
            length: 10,
            unit: 'm',
          });
        }
      });
    });

    gearRef.current = { processors, dataPorts, powerPorts, fiberBoxes, cables };
    setGearVersion(v => v + 1);
  }, [rasterGroups, rasterMapConfigs, screens, activeRasterGroupId]);

  const handleTileClick = useCallback((tileId: number) => {
    const clickedTile = currentScreen.tiles.find(t => t.id === tileId);
    if (!clickedTile) return;

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
            if (currentScreen.powerWiringPattern !== 'manual') {
                toast({
                    title: "Manual Mode Required",
                    description: "Switch to the 'Manual' power wiring pattern to assign circuits by clicking.",
                    variant: "destructive",
                });
                return;
            }
            if (clickedTile.powerCircuit) {
              applyManualPowerWiring({ startTileId: tileId, label: '', numTiles: 0, pattern: clickedTile.powerCircuit.pattern, runLength: clickedTile.powerCircuit.runLength });
            } else {
              setSelectedTileForPower(tileId);
              setIsManualPowerModalOpen(true);
            }
            break;
        case 'data':
            if (currentScreen.wiringPattern !== 'manual') {
                toast({
                    title: "Manual Mode Required",
                    description: "Switch to the 'Manual' data wiring pattern to assign circuits by clicking.",
                    variant: "destructive",
                });
                return;
            }
            if (clickedTile.dataCircuit) {
              applyManualDataWiring({ startTileId: tileId, mainLabel: '', backupLabel: '', numTiles: 0, pattern: clickedTile.dataCircuit.pattern, runLength: clickedTile.dataCircuit.runLength });
            } else {
              setSelectedTileForData(tileId);
              setIsManualDataModalOpen(true);
            }
            break;
    }
  }, [currentScreen.activeTool, currentScreen.powerWiringPattern, currentScreen.wiringPattern, currentScreen.brushColor, currentScreen.tiles, toast, applyManualPowerWiring, applyManualDataWiring]);

  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (currentScreen.activeTool !== 'delete' && currentScreen.activeTool !== 'color') return;
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    dragStateRef.current = { startX: x, startY: y, active: true };
    setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
    setSelectedTileIds([]);
  }, [currentScreen.activeTool, zoom]);

  const handleGridMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateRef.current?.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setSelectionRect(prev => prev ? { ...prev, endX: x, endY: y } : null);
  }, [zoom]);

  const handleGridMouseUp = useCallback(() => {
    if (!dragStateRef.current?.active) return;
    dragStateRef.current.active = false;
    const sr = selectionRect;
    if (!sr) return;
    setSelectionRect(null);

    const minX = Math.min(sr.startX, sr.endX);
    const maxX = Math.max(sr.startX, sr.endX);
    const minY = Math.min(sr.startY, sr.endY);
    const maxY = Math.max(sr.startY, sr.endY);

    // Only treat as selection if drag was more than a few pixels
    if (Math.abs(sr.endX - sr.startX) < 4 && Math.abs(sr.endY - sr.startY) < 4) {
      setSelectedTileIds([]);
      return;
    }

    // Compute pixel positions of each column/row to find which tiles overlap
    let colX = 0;
    const colRanges: { x: number; w: number }[] = [];
    for (let i = 0; i < effectiveScreenWidth; i++) {
      const isLeftHalf = leftHalfTile && i === 0;
      const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
      const w = (isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
      colRanges.push({ x: colX, w });
      colX += w;
    }
    let rowY = 0;
    const rowRanges: { y: number; h: number }[] = [];
    for (let i = 0; i < effectiveScreenHeight; i++) {
      const isTopHalf = topHalfTile && i === 0;
      const isBottomHalf = bottomHalfTile && i === effectiveScreenHeight - 1;
      const h = (isTopHalf || isBottomHalf) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
      rowRanges.push({ y: rowY, h });
      rowY += h;
    }

    const ids: number[] = [];
    for (let y = 0; y < effectiveScreenHeight; y++) {
      for (let x = 0; x < effectiveScreenWidth; x++) {
        const col = colRanges[x];
        const row = rowRanges[y];
        const tileLeft = col.x;
        const tileRight = col.x + col.w;
        const tileTop = row.y;
        const tileBottom = row.y + row.h;
        if (tileRight > minX && tileLeft < maxX && tileBottom > minY && tileTop < maxY) {
 const index = y * effectiveScreenWidth + x;
          const tile = currentScreen.tiles[index];
          if (tile) ids.push(tile.id);
        }
      }
    }

    setSelectedTileIds(ids);

    if (ids.length === 0) return;

    if (currentScreen.activeTool === 'delete') {
      setTiles(prev => prev.map(tile => ids.includes(tile.id) ? { ...tile, deleted: !tile.deleted } : tile));
    } else if (currentScreen.activeTool === 'color') {
      setTiles(prev => prev.map(tile => ids.includes(tile.id) ? { ...tile, color: currentScreen.brushColor, deleted: false } : tile));
    }
  }, [selectionRect, effectiveScreenWidth, effectiveScreenHeight, leftHalfTile, rightHalfTile, topHalfTile, bottomHalfTile, dimensions, currentScreen.activeTool, currentScreen.brushColor, currentScreen.tiles, setTiles]);

  const restoreDeletedTiles = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, deleted: false })));
  }, [setTiles]);
  
  const resetAllColors = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, color: undefined })));
  }, [setTiles]);

  const createScreenContentCanvas = useCallback((screen: Screen, screenActiveBounds: ActiveBounds | null, drawOverlays: boolean = false) => {
    if (!screenActiveBounds) return null;

    const screenLabels = (() => {
        const { screenWidth } = screen.dimensions;
        const totalTiles = screen.tiles.length;
        if (totalTiles <= 0) return [];
        const newLabels = Array(totalTiles).fill('');
        const activeTileIndices = screen.tiles.map((_, i) => i).filter(i => !screen.tiles[i].deleted);
        
        const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
        const screenEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
        
        const startNumber = screen.labelStartNumber || 1;
        const sectionLayout = screen.sections.length > 0;
        const pathOrder = sectionLayout
          ? screen.tiles.map((_, index) => index).filter(index => !screen.tiles[index].deleted)
          : getPathOrder(activeTileIndices, screen.wiringPattern, screenEffectiveWidth, screenEffectiveHeight);

        if (screen.labelFormat === 'sequential' || screen.labelFormat === 'dmx-style') {
          pathOrder.forEach((originalIndex, pathIndex) => {
            const labelNumber = pathIndex + startNumber;
            if (screen.labelFormat === 'sequential') {
              newLabels[originalIndex] = String(labelNumber);
            } else {
              const universeSize = 170;
              const dmxIndex = labelNumber - 1;
              const universe = String.fromCharCode('A'.charCodeAt(0) + Math.floor(dmxIndex / universeSize));
              newLabels[originalIndex] = `${universe}${(dmxIndex % universeSize) + 1}`;
            }
          });
        } else if (screen.labelFormat !== 'none') {
          let tileOffset = 0;
          for (const section of screen.sections.length > 0 ? screen.sections : [{ columnCount: screenEffectiveWidth }]) {
            for (let localIndex = 0; localIndex < section.columnCount * screenEffectiveHeight; localIndex++) {
              const index = tileOffset + localIndex;
              const tile = screen.tiles[index];
              if (!tile || tile.deleted) continue;
              const x = localIndex % section.columnCount;
              const y = Math.floor(localIndex / section.columnCount);
              newLabels[index] = screen.labelFormat === 'row-col'
                ? `${y + startNumber}-${x + 1 + tileOffset / screenEffectiveHeight}`
                : `${String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1)}${x + 1 + tileOffset / screenEffectiveHeight}`;
            }
            tileOffset += section.columnCount * screenEffectiveHeight;
          }
        }
        return newLabels;
    })();

    const { tileWidth, tileHeight } = screen.dimensions;

    const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
    const screenEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
    
    const contentPixelHeight = (() => {
        let height = 0;
        const sectionHeight = screen.sections[0]?.tileHeightPx ?? tileHeight;
        if (screen.sections.length > 0) return (screenActiveBounds.maxY - screenActiveBounds.minY + 1) * sectionHeight;
        for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
            const isTopHalf = screen.topHalfTile && y === 0;
            const isBottomHalf = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
            height += (isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight;
        }
        return height;
    })();
    
    const contentPixelWidth = (() => {
      if (screen.sections.length > 0) {
        let offset = 0;
        let width = 0;
        for (const section of screen.sections) {
          const start = offset;
          const end = offset + section.columnCount - 1;
          const minX = Math.max(screenActiveBounds.minX, start);
          const maxX = Math.min(screenActiveBounds.maxX, end);
          if (maxX >= minX) width += (maxX - minX + 1) * section.tileWidthPx;
          offset += section.columnCount;
        }
        return width;
      }
      let width = 0;
      for (let x = screenActiveBounds.minX; x <= screenActiveBounds.maxX; x++) {
          const isLeftHalf = screen.leftHalfTile && x === 0;
          const isRightHalf = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
          width += (isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth;
      }
      return width;
    })();

    const contentWidth = contentPixelWidth;
    const contentHeight = contentPixelHeight;

    // Full-screen pixel dimensions (used for overlay positioning in full-screen coordinate space)
    const fullScreenWidth = (() => {
        let w = 0;
        for (let x = 0; x < screenEffectiveWidth; x++) {
            const isL = screen.leftHalfTile && x === 0;
            const isR = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
            w += (isL || isR) ? tileWidth / 2 : tileWidth;
        }
        return w;
    })();
    const fullScreenHeight = (() => {
        let h = 0;
        for (let y = 0; y < screenEffectiveHeight; y++) {
            const isT = screen.topHalfTile && y === 0;
            const isB = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
            h += (isT || isB) ? tileHeight / 2 : tileHeight;
        }
        return h;
    })();

    // Pixel offset of the crop region within the full screen
    const cropOffsetX = (() => {
        let ox = 0;
        for (let x = 0; x < screenActiveBounds.minX; x++) {
            const isL = screen.leftHalfTile && x === 0;
            const isR = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
            ox += (isL || isR) ? tileWidth / 2 : tileWidth;
        }
        return ox;
    })();
    const cropOffsetY = (() => {
        let oy = 0;
        for (let y = 0; y < screenActiveBounds.minY; y++) {
            const isT = screen.topHalfTile && y === 0;
            const isB = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
            oy += (isT || isB) ? tileHeight / 2 : tileHeight;
        }
        return oy;
    })();

    const isCropped = screenActiveBounds.minX !== 0 || screenActiveBounds.minY !== 0 ||
        screenActiveBounds.maxX !== screenEffectiveWidth - 1 || screenActiveBounds.maxY !== screenEffectiveHeight - 1;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = 'black';
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    let currentDrawY = 0;
    const drawTile = (tile: Tile | undefined, index: number, x: number, y: number, drawX: number, drawY: number, colPixelWidth: number, rowPixelHeight: number) => {
            if (!tile) return;
            const isActive = !tile.deleted;
            if (isActive) {
                let bgColor = (x + y) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
                if (screen.onOffMode) bgColor = '#FFFFFF';
                else if (tile.color) bgColor = tile.color;
                masterCtx.fillStyle = bgColor;
                masterCtx.fillRect(drawX, drawY, colPixelWidth, rowPixelHeight);
                if (screen.borderWidth > 0) {
                    masterCtx.strokeStyle = screen.borderColor;
                    masterCtx.lineWidth = screen.borderWidth;
                    masterCtx.strokeRect(drawX + screen.borderWidth / 2, drawY + screen.borderWidth / 2, colPixelWidth - screen.borderWidth, rowPixelHeight - screen.borderWidth);
                }
                if (screen.showLabels && screenLabels[index]) {
                    masterCtx.fillStyle = screen.labelColorMode === 'auto' ? (isColorDark(bgColor) ? '#FFFFFF' : '#000000') : screen.labelColor;
                    masterCtx.font = `bold ${screen.labelFontSize}px sans-serif`;
                    masterCtx.textAlign = 'center';
                    masterCtx.textBaseline = 'middle';
                    masterCtx.fillText(screenLabels[index], drawX + colPixelWidth / 2, drawY + rowPixelHeight / 2);
                }
            }
    };
    if (screen.sections.length > 0) {
      let tileOffset = 0;
      let drawX = 0;
      for (const section of screen.sections) {
        for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
          for (let x = 0; x < section.columnCount; x++) {
            const index = tileOffset + y * section.columnCount + x;
            drawTile(screen.tiles[index], index, x, y, drawX + x * section.tileWidthPx, y * section.tileHeightPx, section.tileWidthPx, section.tileHeightPx);
          }
        }
        drawX += section.columnCount * section.tileWidthPx;
        tileOffset += section.columnCount * screenEffectiveHeight;
      }
    } else for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
        const isTopHalfRow = screen.topHalfTile && y === 0;
        const isBottomHalfRow = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
        const rowPixelHeight = (isTopHalfRow || isBottomHalfRow) ? tileHeight / 2 : tileHeight;
        let currentDrawX = 0;
        for (let x = screenActiveBounds.minX; x <= screenActiveBounds.maxX; x++) {
            const isLeftHalfCol = screen.leftHalfTile && x === 0;
            const isRightHalfCol = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
            const colPixelWidth = (isLeftHalfCol || isRightHalfCol) ? tileWidth / 2 : tileWidth;
            const index = y * screenEffectiveWidth + x;
            drawTile(screen.tiles[index], index, x, y, currentDrawX, currentDrawY, colPixelWidth, rowPixelHeight);
            currentDrawX += colPixelWidth;
        }
        currentDrawY += rowPixelHeight;
    }

    // Draw screen name overlay — positioned in full-screen coordinate space, clipped to crop region
    if (screen.showScreenName && screen.name) {
        const fontSize = screen.screenNameLabelFontSize;
        const color = screen.screenNameLabelColorMode === 'auto'
            ? '#ffffff'
            : screen.screenNameLabelColor;
        masterCtx.save();
        if (isCropped) masterCtx.beginPath(), masterCtx.rect(0, 0, contentWidth, contentHeight), masterCtx.clip();
        masterCtx.fillStyle = color;
        masterCtx.font = `bold ${fontSize}px sans-serif`;
        masterCtx.textAlign = 'center';
        masterCtx.textBaseline = 'middle';
        const pos = screen.screenNameLabelPosition;
        let tx = fullScreenWidth / 2;
        let ty = fullScreenHeight / 2;
        const pad = fontSize * 0.6;
        if (pos === 'top-left') { tx = pad; ty = pad; masterCtx.textAlign = 'left'; }
        else if (pos === 'top-right') { tx = fullScreenWidth - pad; ty = pad; masterCtx.textAlign = 'right'; }
        else if (pos === 'bottom-left') { tx = pad; ty = fullScreenHeight - pad; masterCtx.textAlign = 'left'; }
        else if (pos === 'bottom-right') { tx = fullScreenWidth - pad; ty = fullScreenHeight - pad; masterCtx.textAlign = 'right'; }
        masterCtx.shadowColor = 'rgba(0,0,0,0.8)';
        masterCtx.shadowBlur = fontSize * 0.3;
        masterCtx.fillText(screen.name, tx - cropOffsetX, ty - cropOffsetY);
        masterCtx.shadowBlur = 0;
        masterCtx.restore();
    }

    // Draw resolution overlay — positioned in full-screen coordinate space
    if (screen.showResolution) {
        const fontSize = screen.resolutionLabelFontSize ?? 32;
        const color = (screen.resolutionLabelColorMode ?? 'auto') === 'auto' ? '#ffffff' : (screen.resolutionLabelColor ?? '#ffffff');
        masterCtx.save();
        if (isCropped) masterCtx.beginPath(), masterCtx.rect(0, 0, contentWidth, contentHeight), masterCtx.clip();
        masterCtx.fillStyle = color;
        masterCtx.font = `bold ${fontSize}px sans-serif`;
        masterCtx.textBaseline = 'middle';
        const pos = screen.resolutionLabelPosition ?? 'bottom-right';
        const resText = `Pixel: ${fullScreenWidth} x ${fullScreenHeight}`;
        const pad = fontSize * 0.6;
        let tx = fullScreenWidth / 2;
        let ty = fullScreenHeight / 2;
        masterCtx.textAlign = 'center';
        if (pos === 'top-left')      { tx = pad; ty = pad; masterCtx.textAlign = 'left'; }
        else if (pos === 'top-center')   { tx = fullScreenWidth / 2; ty = pad; }
        else if (pos === 'top-right')    { tx = fullScreenWidth - pad; ty = pad; masterCtx.textAlign = 'right'; }
        else if (pos === 'bottom-left')  { tx = pad; ty = fullScreenHeight - pad; masterCtx.textAlign = 'left'; }
        else if (pos === 'bottom-center'){ tx = fullScreenWidth / 2; ty = fullScreenHeight - pad; }
        else if (pos === 'bottom-right') { tx = fullScreenWidth - pad; ty = fullScreenHeight - pad; masterCtx.textAlign = 'right'; }
        masterCtx.shadowColor = 'rgba(0,0,0,0.8)';
        masterCtx.shadowBlur = fontSize * 0.3;
        masterCtx.fillText(resText, tx - cropOffsetX, ty - cropOffsetY);
        masterCtx.shadowBlur = 0;
        masterCtx.restore();
    }

    // Draw dimensions overlay — positioned in full-screen coordinate space
    if (screen.showDimensions) {
        const product = products.find(p => p.id === screen.selectedProductId);
        const tileWmm = (product?.tileWidthMm as number | undefined) || screen.customTileWidthMm || 0;
        const tileHmm = (product?.tileHeightMm as number | undefined) || screen.customTileHeightMm || 0;
        const screenEffW = screenEffectiveWidth;
        const screenEffH = screenEffectiveHeight;
        const unit = screen.dimensionUnit ?? 'all';
        const hasPhysical = tileWmm > 0 && tileHmm > 0;

        if (hasPhysical || unit === 'tiles') {
            const physWmm = tileWmm * screenEffW;
            const physHmm = tileHmm * screenEffH;

            const fmtMm = (mm: number) => `${Math.round(mm)}mm`;
            const fmtMeters = (mm: number) => `${(mm / 1000).toFixed(3)}m`;
            const fmtInches = (mm: number) => `${(mm / 25.4).toFixed(2)}"`;
            const fmtDecimalFeet = (mm: number) => `${(mm / 304.8).toFixed(2)}ft`;
            const fmtFeetInches = (mm: number) => {
                const totalInches = mm / 25.4;
                const feet = Math.floor(totalInches / 12);
                const remainingInches = totalInches - feet * 12;
                const inchStr = formatFractionalInch(remainingInches);
                return `${feet}' ${inchStr}"`;
            };
            const fmtLabel = (mm: number) => {
                switch (unit) {
                    case 'mm': return fmtMm(mm);
                    case 'meters': return fmtMeters(mm);
                    case 'inches': return fmtInches(mm);
                    case 'decimal-feet': return fmtDecimalFeet(mm);
                    case 'feet-inches': return fmtFeetInches(mm);
                    case 'tiles': return `${screenEffW} tiles`;
                    default: return `${fmtFeetInches(mm)} / ${fmtMm(mm)}`;
                }
            };

            const wLabel = unit === 'tiles' ? `${screenEffW} tiles` : fmtLabel(physWmm);
            const hLabel = unit === 'tiles' ? `${screenEffH} tiles` : fmtLabel(physHmm);
            const fontSize = screen.dimensionLabelSize ?? 24;
            const color = screen.dimensionLabelColor ?? '#ffffff';
            const padding = fontSize * 1.5;
            const arrowSize = Math.max(6, fontSize * 0.4);
            const stroke = 2;

            masterCtx.save();
            if (isCropped) masterCtx.beginPath(), masterCtx.rect(0, 0, contentWidth, contentHeight), masterCtx.clip();
            masterCtx.translate(-cropOffsetX, -cropOffsetY);
            masterCtx.strokeStyle = color;
            masterCtx.fillStyle = color;
            masterCtx.lineWidth = stroke;
            masterCtx.textAlign = 'center';
            masterCtx.textBaseline = 'middle';
            masterCtx.font = `bold ${fontSize}px sans-serif`;
            masterCtx.shadowColor = 'rgba(0,0,0,0.8)';
            masterCtx.shadowBlur = fontSize * 0.3;

            // Width dimension (bottom, inside grid)
            masterCtx.beginPath();
            masterCtx.moveTo(0, fullScreenHeight);
            masterCtx.lineTo(0, fullScreenHeight - padding - arrowSize);
            masterCtx.moveTo(fullScreenWidth, fullScreenHeight);
            masterCtx.lineTo(fullScreenWidth, fullScreenHeight - padding - arrowSize);
            masterCtx.moveTo(arrowSize, fullScreenHeight - padding);
            masterCtx.lineTo(fullScreenWidth - arrowSize, fullScreenHeight - padding);
            masterCtx.stroke();
            masterCtx.beginPath();
            masterCtx.moveTo(0, fullScreenHeight - padding);
            masterCtx.lineTo(arrowSize, fullScreenHeight - padding - arrowSize / 2);
            masterCtx.lineTo(arrowSize, fullScreenHeight - padding + arrowSize / 2);
            masterCtx.closePath();
            masterCtx.fill();
            masterCtx.beginPath();
            masterCtx.moveTo(fullScreenWidth, fullScreenHeight - padding);
            masterCtx.lineTo(fullScreenWidth - arrowSize, fullScreenHeight - padding - arrowSize / 2);
            masterCtx.lineTo(fullScreenWidth - arrowSize, fullScreenHeight - padding + arrowSize / 2);
            masterCtx.closePath();
            masterCtx.fill();
            masterCtx.fillText(wLabel, fullScreenWidth / 2, fullScreenHeight - padding - fontSize * 0.7);

            // Height dimension (right, inside grid)
            {
            masterCtx.beginPath();
            masterCtx.moveTo(fullScreenWidth, 0);
            masterCtx.lineTo(fullScreenWidth - padding - arrowSize, 0);
            masterCtx.moveTo(fullScreenWidth, fullScreenHeight);
            masterCtx.lineTo(fullScreenWidth - padding - arrowSize, fullScreenHeight);
            masterCtx.moveTo(fullScreenWidth - padding, arrowSize);
            masterCtx.lineTo(fullScreenWidth - padding, fullScreenHeight - arrowSize);
            masterCtx.stroke();
            masterCtx.beginPath();
            masterCtx.moveTo(fullScreenWidth - padding, 0);
            masterCtx.lineTo(fullScreenWidth - padding - arrowSize / 2, arrowSize);
            masterCtx.lineTo(fullScreenWidth - padding + arrowSize / 2, arrowSize);
            masterCtx.closePath();
            masterCtx.fill();
            masterCtx.beginPath();
            masterCtx.moveTo(fullScreenWidth - padding, fullScreenHeight);
            masterCtx.lineTo(fullScreenWidth - padding - arrowSize / 2, fullScreenHeight - arrowSize);
            masterCtx.lineTo(fullScreenWidth - padding + arrowSize / 2, fullScreenHeight - arrowSize);
            masterCtx.closePath();
            masterCtx.fill();
            masterCtx.save();
            masterCtx.translate(fullScreenWidth - padding - fontSize * 0.7, fullScreenHeight / 2);
            masterCtx.rotate(-Math.PI / 2);
            masterCtx.fillText(hLabel, 0, 0);
            masterCtx.restore();
            }

            masterCtx.shadowBlur = 0;
            masterCtx.restore();
        }
    }

    // Draw logo overlay — positioned in full-screen coordinate space, clipped to crop region
    if (drawOverlays && screen.logoOverlay) {
      try {
        const logoImg = new Image();
        logoImg.src = screen.logoOverlay.imageData;
        if (logoImg.complete) {
          masterCtx.save();
          if (isCropped) masterCtx.beginPath(), masterCtx.rect(0, 0, contentWidth, contentHeight), masterCtx.clip();
          masterCtx.drawImage(logoImg, screen.logoOverlay.x - cropOffsetX, screen.logoOverlay.y - cropOffsetY, screen.logoOverlay.width, screen.logoOverlay.height);
          masterCtx.restore();
        }
      } catch {}
    }

    // Draw text overlays — positioned in full-screen coordinate space, clipped to crop region
    if (drawOverlays && screen.textOverlays) {
      masterCtx.save();
      if (isCropped) masterCtx.beginPath(), masterCtx.rect(0, 0, contentWidth, contentHeight), masterCtx.clip();
      const shiftedOverlays = screen.textOverlays.map(o => ({ ...o, x: o.x - cropOffsetX, y: o.y - cropOffsetY }));
      drawTextOverlaysOnCtx(masterCtx, shiftedOverlays, contentWidth, contentHeight);
      masterCtx.restore();
    }

    return masterCanvas;
  }, [drawTextOverlaysOnCtx, products]);

  const handleDownloadPng = useCallback((filename?: string) => {
    if (!activeBounds) {
      return;
    }

    setIsPngDownloading(true);

    setTimeout(async () => {
      try {
        const canvas = createScreenContentCanvas(currentScreen, activeBounds, includeTextOverlaysInDownload);
        if (!canvas) {
          setIsPngDownloading(false);
          return;
        }

        const ctx = canvas.getContext('2d');

        // Draw logo overlay asynchronously (image needs to load)
        if (ctx && includeTextOverlaysInDownload && currentScreen.logoOverlay) {
          try {
            const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = currentScreen.logoOverlay!.imageData;
            });
            ctx.drawImage(logoImg, currentScreen.logoOverlay.x, currentScreen.logoOverlay.y, currentScreen.logoOverlay.width, currentScreen.logoOverlay.height);
          } catch {}
        }

        const contentPixelWidth = canvas.width;
        const contentPixelHeight = canvas.height;

        const safeName = (currentScreen.name || 'screen').replace(/[^a-zA-Z0-9_-]/g, '_');
        const autoFilename = `PIXEL_MAP_${safeName}_${contentPixelWidth}x${contentPixelHeight}.png`;
        const finalFilename = filename || autoFilename;

        const applyWatermarkAndDownload = (dataUrl: string) => {
          const link = document.createElement("a");
          link.download = finalFilename;
          link.href = dataUrl;
          link.click();
          trackEvent('download', { type: 'grid-png', filename: finalFilename, thumbnail: dataUrl });
        };

        const dataUrl = canvas.toDataURL('image/png');
        if (subscriptionStatus === 'trial') {
          addWatermark(dataUrl).then(applyWatermarkAndDownload).catch((err) => {
            console.error("Could not generate PNG.", err);
          }).finally(() => setIsPngDownloading(false));
        } else {
          applyWatermarkAndDownload(dataUrl);
          setIsPngDownloading(false);
        }
      } catch (err) {
        console.error("Could not generate PNG.", err);
        setIsPngDownloading(false);
      }
    }, 50);
  }, [activeBounds, currentScreen, createScreenContentCanvas, subscriptionStatus, includeTextOverlaysInDownload]);

  const buildRasterConfigForGroup = useCallback((groupId: string, filename: string, outputWidth?: number, outputHeight?: number): RasterMapConfig | null => {
    const groupScreens = screens.filter(s => (s.rasterGroupId ?? 'raster-1') === groupId);

    const screenArrangement: ScreenArrangement[] = [];
    let totalContentWidth = 0;
    let totalContentHeight = 0;

    for (const screen of groupScreens) {
        const activeTiles = screen.tiles.map((t, i) => ({...t, index: i})).filter(t => !t.deleted);
        if (activeTiles.length === 0) continue;

        const screenEffectiveHeight = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
        const screenEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);

        const computeContentSize = (bounds: ActiveBounds) => {
            const cw = Array.from({ length: bounds.maxX - bounds.minX + 1 }, (_, i) => {
                const x = bounds.minX + i;
                const isLeftHalf = screen.leftHalfTile && x === 0;
                const isRightHalf = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
                return (isLeftHalf || isRightHalf) ? screen.dimensions.tileWidth / 2 : screen.dimensions.tileWidth;
            }).reduce((a, b) => a + b, 0);
            const ch = Array.from({ length: bounds.maxY - bounds.minY + 1 }, (_, i) => {
                const y = bounds.minY + i;
                const isTopHalf = screen.topHalfTile && y === 0;
                const isBottomHalf = screen.bottomHalfTile && y === (screenEffectiveHeight - 1);
                return (isTopHalf || isBottomHalf) ? screen.dimensions.tileHeight / 2 : screen.dimensions.tileHeight;
            }).reduce((a, b) => a + b, 0);
            return { cw, ch };
        };

        const segments = (screen.rasterSegments && screen.rasterSegments.length > 0)
            ? screen.rasterSegments
            : null;

        if (segments) {
            for (const seg of segments) {
                const { cw, ch } = computeContentSize(seg.bounds);
                screenArrangement.push({
                    screenId: screen.id,
                    segmentId: seg.id,
                    screenName: screen.name,
                    x: seg.offset.x,
                    y: seg.offset.y,
                    width: cw,
                    height: ch,
                    activeBounds: seg.bounds,
                    showScreenName: screen.showScreenName,
                    screenNameLabelPosition: screen.screenNameLabelPosition,
                    screenNameLabelFontSize: screen.screenNameLabelFontSize,
                    screenNameLabelColor: screen.screenNameLabelColor,
                    screenNameLabelColorMode: screen.screenNameLabelColorMode,
                    showSliceOffsetLabels: screen.showSliceOffsetLabels,
                    showResolution: screen.showResolution ?? false,
                    resolutionLabelPosition: screen.resolutionLabelPosition ?? 'bottom-right',
                    showDimensions: screen.showDimensions ?? false,
                    dimensionUnit: screen.dimensionUnit ?? 'all',
                    dimensionLabelSize: screen.dimensionLabelSize ?? 24,
                    dimensionLabelColor: screen.dimensionLabelColor ?? '#ffffff',
                    customTileWidthMm: screen.customTileWidthMm ?? 0,
                    customTileHeightMm: screen.customTileHeightMm ?? 0,
                });
                if (seg.offset.x + cw > totalContentWidth) totalContentWidth = seg.offset.x + cw;
                if (seg.offset.y + ch > totalContentHeight) totalContentHeight = seg.offset.y + ch;
            }
        } else {
            let screenActiveBounds: ActiveBounds;
            if (screen.rasterCrop) {
                screenActiveBounds = screen.rasterCrop;
            } else {
                let minX = screen.dimensions.screenWidth, minY = Infinity, maxX = -1, maxY = -1;
                activeTiles.forEach(tile => {
                    const x = tile.index % screenEffectiveWidth;
                    const y = Math.floor(tile.index / screenEffectiveWidth);
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                });
                screenActiveBounds = { minX, minY, maxX, maxY };
            }
            const { cw, ch } = computeContentSize(screenActiveBounds);
            screenArrangement.push({
                screenId: screen.id,
                segmentId: 'default',
                screenName: screen.name,
                x: screen.rasterOffset.x,
                y: screen.rasterOffset.y,
                width: cw,
                height: ch,
                activeBounds: screenActiveBounds,
                showScreenName: screen.showScreenName,
                screenNameLabelPosition: screen.screenNameLabelPosition,
                screenNameLabelFontSize: screen.screenNameLabelFontSize,
                screenNameLabelColor: screen.screenNameLabelColor,
                screenNameLabelColorMode: screen.screenNameLabelColorMode,
                showSliceOffsetLabels: screen.showSliceOffsetLabels,
                showResolution: screen.showResolution ?? false,
                resolutionLabelPosition: screen.resolutionLabelPosition ?? 'bottom-right',
                showDimensions: screen.showDimensions ?? false,
                dimensionUnit: screen.dimensionUnit ?? 'all',
                dimensionLabelSize: screen.dimensionLabelSize ?? 24,
                dimensionLabelColor: screen.dimensionLabelColor ?? '#ffffff',
                customTileWidthMm: screen.customTileWidthMm ?? 0,
                customTileHeightMm: screen.customTileHeightMm ?? 0,
            });
            if (screen.rasterOffset.x + cw > totalContentWidth) totalContentWidth = screen.rasterOffset.x + cw;
            if (screen.rasterOffset.y + ch > totalContentHeight) totalContentHeight = screen.rasterOffset.y + ch;
        }
    }

    if (screenArrangement.length === 0) return null;

    const finalOutputWidth = outputWidth || totalContentWidth;
    const finalOutputHeight = outputHeight || totalContentHeight;

    let resolutionType: ResolutionType = 'content';
    if (outputWidth === 1920 && outputHeight === 1080) resolutionType = 'hd';
    else if (outputWidth === 3840 && outputHeight === 2160) resolutionType = '4k-uhd';
    else if (outputWidth === 4096 && outputHeight === 2160) resolutionType = '4k-dci';
    else if (outputWidth && outputHeight) resolutionType = 'custom';

    const slices: RasterSlice[] = [];
    const screenNameForFile = (groupScreens[0]?.name || 'Screen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sizeLabel = `${finalOutputWidth}x${finalOutputHeight}`;
    const baseFilename = `RASTER_MAP_${screenNameForFile}_${sizeLabel}`;

    const effectiveTotalContentWidth = screenArrangement.reduce((max, s) => Math.max(max, s.x + s.width), 0);
    const effectiveTotalContentHeight = screenArrangement.reduce((max, s) => Math.max(max, s.y + s.height), 0);

    const numCols = Math.ceil(effectiveTotalContentWidth / finalOutputWidth);
    const numRows = Math.ceil(effectiveTotalContentHeight / finalOutputHeight);
    const totalPreviewWidth = numCols * finalOutputWidth;
    const totalPreviewHeight = numRows * finalOutputHeight;

    const fullContentCanvas = document.createElement('canvas');
    fullContentCanvas.width = Math.max(1, effectiveTotalContentWidth);
    fullContentCanvas.height = Math.max(1, effectiveTotalContentHeight);
    const masterCtx = fullContentCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = rasterBgColor;
    masterCtx.fillRect(0, 0, fullContentCanvas.width, fullContentCanvas.height);

    for (const arrangement of screenArrangement) {
        const screen = groupScreens.find(s => s.id === arrangement.screenId);
        if (!screen) continue;
        const screenCanvas = createScreenContentCanvas(screen, arrangement.activeBounds, true);
        if (screenCanvas) {
            masterCtx.drawImage(screenCanvas, arrangement.x, arrangement.y);
        }
    }

    const previewImage = fullContentCanvas.toDataURL('image/png');

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const sliceX = col * finalOutputWidth;
            const sliceY = row * finalOutputHeight;
            const sliceFilename = (numCols > 1 || numRows > 1)
                ? `${baseFilename}_R${row + 1}-C${col + 1}.png`
                : `${baseFilename}.png`;
            slices.push({ key: `${row}-${col}`, filename: sliceFilename, x: sliceX, y: sliceY, width: finalOutputWidth, height: finalOutputHeight });
        }
    }

    return {
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
    };
  }, [screens, createScreenContentCanvas, rasterBgColor]);

  const regenerateRasterPreview = useCallback(() => {
    if (!currentScreen.lastRasterArgs) {
        setRasterMapConfigs({});
        return;
    }
    const { filename, outputWidth, outputHeight } = currentScreen.lastRasterArgs;

    const newConfigs: Record<string, RasterMapConfig> = {};
    for (const group of rasterGroups) {
        const config = buildRasterConfigForGroup(group.id, filename, outputWidth, outputHeight);
        if (config) newConfigs[group.id] = config;
    }
    setRasterMapConfigs(newConfigs);

    // Note: we intentionally do NOT auto-create extra "Raster N" groups when a
    // screen is split into multiple raster slices. The slice count is a rendering
    // detail, not a user-facing group. Users create groups manually as needed.
  }, [currentScreen.lastRasterArgs, rasterGroups, buildRasterConfigForGroup, activeRasterGroupId]);


  useEffect(() => {
    if (currentScreen.lastRasterArgs) {
      regenerateRasterPreview();
    }
  }, [regenerateRasterPreview, screens]);
  
  const generateRasterMap = useCallback((filename: string, outputWidth?: number, outputHeight?: number) => {
    setLastRasterArgs({ filename, outputWidth, outputHeight });
  }, [setLastRasterArgs]);

  useEffect(() => {
    if (activeBounds && !currentScreen.lastRasterArgs) {
        generateRasterMap('raster-map-content.png');
    }
  }, [generateRasterMap, activeBounds, currentScreen.lastRasterArgs]);

  const createFullRasterCanvas = useCallback(() => {
    if (!rasterMapConfig) return null;

    const { contentWidth, contentHeight, screenArrangement, slices, outputWidth, outputHeight } = rasterMapConfig;

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = contentWidth;
    masterCanvas.height = contentHeight;
    const masterCtx = masterCanvas.getContext('2d');
    if (!masterCtx) return null;

    masterCtx.fillStyle = rasterBgColor;
    masterCtx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    for (const arrangement of screenArrangement) {
        const screen = screens.find(s => s.id === arrangement.screenId);
        if (!screen) continue;

        const screenCanvas = createScreenContentCanvas(screen, arrangement.activeBounds, true);
        if (screenCanvas) {
            masterCtx.drawImage(screenCanvas, arrangement.x, arrangement.y);
        }

        // Draw tile offset labels if enabled for this screen
        if (arrangement.showSliceOffsetLabels && slices.length > 0) {
            const { tileWidth, tileHeight } = screen.dimensions;
            const effW = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);
            const effH = screen.dimensions.screenHeight + (screen.topHalfTile ? 1 : 0) + (screen.bottomHalfTile ? 1 : 0);
            const ab = arrangement.activeBounds;

            const tilesBySlice = new Map<string, number[]>();
            screen.tiles.forEach((tile, index) => {
                if (tile.deleted) return;
                const tx = index % effW;
                const ty = Math.floor(index / effW);
                if (tx < ab.minX || tx > ab.maxX || ty < ab.minY || ty > ab.maxY) return;

                let tcy = 0;
                for (let i = ab.minY; i < ty; i++) {
                    const isTop = screen.topHalfTile && i === 0;
                    const isBot = screen.bottomHalfTile && i === effH - 1;
                    tcy += (isTop || isBot) ? tileHeight / 2 : tileHeight;
                }
                let tcx = 0;
                for (let i = ab.minX; i < tx; i++) {
                    const isL = screen.leftHalfTile && i === 0;
                    const isR = screen.rightHalfTile && i === effW - 1;
                    tcx += (isL || isR) ? tileWidth / 2 : tileWidth;
                }

                const absX = tcx + arrangement.x;
                const absY = tcy + arrangement.y;
                const sliceKey = `${Math.floor(absY / outputHeight)}-${Math.floor(absX / outputWidth)}`;
                if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
                tilesBySlice.get(sliceKey)!.push(index);
            });

            tilesBySlice.forEach((sliceIndices, sliceKey) => {
                if (!sliceIndices.length) return;
                const slice = slices.find(s => s.key === sliceKey);
                if (!slice) return;
                const firstIndex = sliceIndices[0];
                const tx = firstIndex % effW;
                const ty = Math.floor(firstIndex / effW);

                let tcy = 0;
                for (let i = ab.minY; i < ty; i++) {
                    const isTop = screen.topHalfTile && i === 0;
                    const isBot = screen.bottomHalfTile && i === effH - 1;
                    tcy += (isTop || isBot) ? tileHeight / 2 : tileHeight;
                }
                let tcx = 0;
                for (let i = ab.minX; i < tx; i++) {
                    const isL = screen.leftHalfTile && i === 0;
                    const isR = screen.rightHalfTile && i === effW - 1;
                    tcx += (isL || isR) ? tileWidth / 2 : tileWidth;
                }

                const absX = tcx + arrangement.x;
                const absY = tcy + arrangement.y;
                const label = `(${absX - slice.x},${absY - slice.y})`;

                const fontSize = Math.max(12, Math.min(24, tileWidth * 0.12));
                masterCtx.fillStyle = 'rgba(0,0,0,0.65)';
                const textW = masterCtx.measureText(label).width + 8;
                masterCtx.fillRect(absX + 2, absY + 2, textW, fontSize + 6);
                masterCtx.fillStyle = '#ffffff';
                masterCtx.font = `bold ${fontSize}px monospace`;
                masterCtx.textAlign = 'left';
                masterCtx.textBaseline = 'top';
                masterCtx.fillText(label, absX + 6, absY + 5);
            });
        }
    }

    return masterCanvas;
  }, [rasterMapConfig, screens, createScreenContentCanvas, rasterBgColor]);


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
        
        outputCtx.fillStyle = rasterBgColor;
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        outputCtx.drawImage(
            masterContentCanvas,
            -slice.x, 
            -slice.y
        );

        if (includeTextOverlaysInDownload) {
          const allOverlays = screens.flatMap(s => (s.textOverlays ?? []).map(o => ({
            ...o,
            x: o.x + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.x ?? 0) - slice.x,
            y: o.y + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.y ?? 0) - slice.y,
          })));
          drawTextOverlaysOnCtx(outputCtx, allOverlays, slice.width, slice.height);
        }
        
        downloadCanvas(outputCanvas, slice.filename);
    }
  }, [rasterMapConfig, createFullRasterCanvas, subscriptionStatus, toast, includeTextOverlaysInDownload, screens, drawTextOverlaysOnCtx, rasterBgColor]);

  const downloadSingleSlice = useCallback((sliceKey: string) => {
    if (!rasterMapConfig) return;
    const slice = rasterMapConfig.slices.find(s => s.key === sliceKey);
    if (!slice) return;

    const masterContentCanvas = createFullRasterCanvas();
    if (!masterContentCanvas) return;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = slice.width;
    outputCanvas.height = slice.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    outputCtx.fillStyle = rasterBgColor;
    outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputCtx.drawImage(masterContentCanvas, -slice.x, -slice.y);

    if (includeTextOverlaysInDownload) {
      const allOverlays = screens.flatMap(s => (s.textOverlays ?? []).map(o => ({
        ...o,
        x: o.x + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.x ?? 0) - slice.x,
        y: o.y + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.y ?? 0) - slice.y,
      })));
      drawTextOverlaysOnCtx(outputCtx, allOverlays, slice.width, slice.height);
    }

    try {
        const dataUrl = outputCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = slice.filename;
        link.href = dataUrl;
        link.click();
        trackEvent('download', { type: 'raster-slice', filename: slice.filename, thumbnail: dataUrl });
    } catch (err) {
        console.error('Could not generate raster slice.', err);
    }
  }, [rasterMapConfig, createFullRasterCanvas, rasterBgColor, includeTextOverlaysInDownload, screens, drawTextOverlaysOnCtx]);

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

  const handleDownloadWiringDiagram = useCallback(async () => {
    if (wiringDiagramRef.current === null || !activeBounds) {
      toast({
        title: "Download Failed",
        description: "Wiring diagram component or active grid is not ready.",
        variant: "destructive",
      });
      return;
    }

    const node = wiringDiagramRef.current as HTMLElement;
    const screenName = (currentScreen.name || "Screen").replace(/[^a-zA-Z0-9_-]/g, '_');

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

    const contentPixelWidth = (() => {
        if (!activeBounds) return 0;
        let width = 0;
        for (let x = activeBounds.minX; x <= activeBounds.maxX; x++) {
            const isLeftHalf = leftHalfTile && x === 0;
            const isRightHalf = rightHalfTile && x === (effectiveScreenWidth - 1);
            width += (isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
        }
        return width;
    })();

    let yPosOfMinY = 0;
    for (let i = 0; i < activeBounds.minY; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        yPosOfMinY += isTopHalfRow ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }

    let xPosOfMinX = 0;
    for (let i = 0; i < activeBounds.minX; i++) {
        const isLeftHalfCol = leftHalfTile && i === 0;
        xPosOfMinX += isLeftHalfCol ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }

    const cropWidth = contentPixelWidth;
    const cropHeight = contentPixelHeight;
    const sx = xPosOfMinX;
    const sy = yPosOfMinY;

    const generateAndDownload = async (type: 'data' | 'power' | 'both', isMirrored: boolean, filename: string) => {
      // Composite the stacked canvases directly to avoid html-to-image capturing
      // extra whitespace from the surrounding scroll container.
      const canvases = Array.from(node.querySelectorAll('canvas')) as HTMLCanvasElement[];
      if (canvases.length === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const outW = cropWidth;
      const outH = cropHeight;
      // The canvas bitmap already has mirrored content baked in, so for the
      // rear view the crop origin is on the right side of the bitmap.
      const totalGridPixelWidth = canvases[0].width / dpr;
      const originX = isMirrored ? (totalGridPixelWidth - sx - cropWidth) : sx;
      const srcSx = originX * dpr;
      const srcSy = sy * dpr;
      const srcW = outW * dpr;
      const srcH = outH * dpr;

      const output = document.createElement('canvas');
      output.width = outW;
      output.height = outH;
      const octx = output.getContext('2d')!;
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, outW, outH);

      for (const cvs of canvases) {
        const wiringType = cvs.getAttribute('data-wiring-type') as 'data' | 'power' | null;
        if (wiringType) {
          const shouldShow = type === 'both' || type === wiringType;
          if (!shouldShow) continue;
        }
        octx.drawImage(cvs, srcSx, srcSy, srcW, srcH, 0, 0, outW, outH);
      }

      if (includeTextOverlaysInDownload && currentScreen.textOverlays?.length) {
        drawTextOverlaysOnCtx(octx, currentScreen.textOverlays, outW, outH);
      }

      let finalDataUrl = output.toDataURL('image/png');

      if (subscriptionStatus === 'trial') {
        finalDataUrl = await addWatermark(finalDataUrl);
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = finalDataUrl;
      link.click();
      trackEvent('download', { type: 'wiring-diagram', filename, thumbnail: finalDataUrl });
    };

    const wiringType: 'data' | 'power' | 'both' =
      currentScreen.showDataLabels && currentScreen.showPowerLabels ? 'both'
      : currentScreen.showDataLabels ? 'data'
      : currentScreen.showPowerLabels ? 'power'
      : 'both';
    const isMirrored = currentScreen.isWiringMirrored;
    const typeLabel = currentScreen.showDataLabels && !currentScreen.showPowerLabels ? 'DATA_'
      : !currentScreen.showDataLabels && currentScreen.showPowerLabels ? 'POWER_'
      : '';
    const viewLabel = isMirrored ? 'REAR_VIEW' : 'FRONT_VIEW';
    const filename = `${typeLabel}WIRING_${screenName}_${viewLabel}.png`;

    try {
      await generateAndDownload(wiringType, isMirrored, filename);

      toast({
        title: "Download Started",
        description: "Your wiring diagram is downloading.",
      });
    } catch (err) {
      console.error("Failed to generate wiring diagram image", err);
      toast({
        title: "Download Failed",
        description: "Could not generate the wiring diagram image.",
        variant: "destructive",
      });
    }
  }, [wiringDiagramRef, currentScreen.name, currentScreen.textOverlays, currentScreen.showDataLabels, currentScreen.showPowerLabels, currentScreen.isWiringMirrored, drawTextOverlaysOnCtx, includeTextOverlaysInDownload, toast, activeBounds, dimensions, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile, effectiveScreenHeight, effectiveScreenWidth, subscriptionStatus]);

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
    const screenNameForFile = (currentScreen.name || 'Screen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sizeLabel = `${rasterMapConfig.outputWidth}x${rasterMapConfig.outputHeight}`;
    const downloadFilename = `RASTER_MAP_${screenNameForFile}_${sizeLabel}.png`;

    toPng(node, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 1,
      width: totalWidth,
      height: totalHeight,
    })
      .then(async (dataUrl) => {
        let finalDataUrl = dataUrl;
        if (includeTextOverlaysInDownload) {
          const allOverlays = screens.flatMap(s => (s.textOverlays ?? []).map(o => ({
            ...o,
            x: o.x + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.x ?? 0),
            y: o.y + (rasterMapConfig.screenArrangement.find(a => a.screenId === s.id)?.y ?? 0),
          })));
          if (allOverlays.length) {
            const img = new Image();
            img.src = dataUrl;
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              setTimeout(() => resolve(), 5000);
            });
            const overlayCanvas = document.createElement('canvas');
            overlayCanvas.width = img.width || totalWidth;
            overlayCanvas.height = img.height || totalHeight;
            const octx = overlayCanvas.getContext('2d');
            if (octx) {
              octx.drawImage(img, 0, 0);
              drawTextOverlaysOnCtx(octx, allOverlays, totalWidth, totalHeight);
              finalDataUrl = overlayCanvas.toDataURL('image/png');
            }
          }
        }
        const link = document.createElement("a");
        link.download = downloadFilename;
        link.href = finalDataUrl;
        link.click();
        
        toast({
          title: "Download Started",
          description: "Your full raster map is being downloaded.",
        });
        trackEvent('download', { type: 'full-raster-map', filename: downloadFilename, thumbnail: finalDataUrl });
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
  }, [rasterMapRef, rasterMapConfig, toast, subscriptionStatus, includeTextOverlaysInDownload, screens, drawTextOverlaysOnCtx]);

  const handleDownloadWallLayout = useCallback(() => {
    if (!activeBounds) {
      toast({ title: "Download Failed", description: "Grid is empty.", variant: "destructive" });
      return;
    }
    setIsWallLayoutDownloading(true);
    setTimeout(() => {
      try {
        const screenCanvas = createScreenContentCanvas(currentScreen, activeBounds, includeTextOverlaysInDownload);
        if (!screenCanvas) { setIsWallLayoutDownloading(false); return; }

        const gridPixelW = screenCanvas.width;
        const gridPixelH = screenCanvas.height;

        const screenEffW = currentScreen.dimensions.screenWidth + (currentScreen.leftHalfTile ? 1 : 0) + (currentScreen.rightHalfTile ? 1 : 0);
        const screenEffH = currentScreen.dimensions.screenHeight + (currentScreen.topHalfTile ? 1 : 0) + (currentScreen.bottomHalfTile ? 1 : 0);

        const dimPad = Math.max(80, Math.round(gridPixelW * 0.06));
        const legendWidth = 300;
        const legendPad = 24;
        const legendEntryHeight = 40;
        const legendTitleHeight = 44;

        // Collect unique colors from tiles, preserving order of first appearance
        const colorMap = new Map<string, string>();
        for (let i = 0; i < currentScreen.tiles.length; i++) {
          const tile = currentScreen.tiles[i];
          if (tile.deleted) continue;
          let bg = (i % screenEffW + Math.floor(i / screenEffW)) % 2 === 0 ? currentScreen.tileColor : currentScreen.tileColorTwo;
          if (currentScreen.onOffMode) bg = '#FFFFFF';
          else if (tile.color) bg = tile.color;
          if (!colorMap.has(bg)) {
            const existing = wallLayoutLegend.find(e => e.color === bg);
            colorMap.set(bg, existing?.label ?? '');
          }
        }

        const legendEntries = Array.from(colorMap.entries());
        const legendH = legendTitleHeight + legendEntries.length * legendEntryHeight + legendPad;
        const totalW = gridPixelW + dimPad * 2 + legendWidth + legendPad;
        const totalH = Math.max(gridPixelH + dimPad * 2, legendH + legendPad);

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(totalW);
        canvas.height = Math.ceil(totalH);
        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsWallLayoutDownloading(false); return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gridOriginX = dimPad;
        const gridOriginY = dimPad;

        // Draw the exact screen canvas
        ctx.drawImage(screenCanvas, gridOriginX, gridOriginY);

        // Draw tile-count dimensions outside the grid (black arrows)
        const fontSize = Math.max(20, Math.round(dimPad * 0.22));
        const arrowSize = Math.max(8, fontSize * 0.4);
        const padding = fontSize * 1.5;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = fontSize * 0.3;

        // Width dimension (bottom, outside grid)
        const wLabel = `${screenEffW} tiles`;
        ctx.beginPath();
        ctx.moveTo(gridOriginX, gridOriginY + gridPixelH);
        ctx.lineTo(gridOriginX, gridOriginY + gridPixelH + padding + arrowSize);
        ctx.moveTo(gridOriginX + gridPixelW, gridOriginY + gridPixelH);
        ctx.lineTo(gridOriginX + gridPixelW, gridOriginY + gridPixelH + padding + arrowSize);
        ctx.moveTo(gridOriginX + arrowSize, gridOriginY + gridPixelH + padding);
        ctx.lineTo(gridOriginX + gridPixelW - arrowSize, gridOriginY + gridPixelH + padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gridOriginX, gridOriginY + gridPixelH + padding);
        ctx.lineTo(gridOriginX + arrowSize, gridOriginY + gridPixelH + padding - arrowSize / 2);
        ctx.lineTo(gridOriginX + arrowSize, gridOriginY + gridPixelH + padding + arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(gridOriginX + gridPixelW, gridOriginY + gridPixelH + padding);
        ctx.lineTo(gridOriginX + gridPixelW - arrowSize, gridOriginY + gridPixelH + padding - arrowSize / 2);
        ctx.lineTo(gridOriginX + gridPixelW - arrowSize, gridOriginY + gridPixelH + padding + arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillText(wLabel, gridOriginX + gridPixelW / 2, gridOriginY + gridPixelH + padding + fontSize * 0.7);

        // Height dimension (right, outside grid)
        const hLabel = `${screenEffH} tiles`;
        ctx.beginPath();
        ctx.moveTo(gridOriginX + gridPixelW, gridOriginY);
        ctx.lineTo(gridOriginX + gridPixelW + padding + arrowSize, gridOriginY);
        ctx.moveTo(gridOriginX + gridPixelW, gridOriginY + gridPixelH);
        ctx.lineTo(gridOriginX + gridPixelW + padding + arrowSize, gridOriginY + gridPixelH);
        ctx.moveTo(gridOriginX + gridPixelW + padding, gridOriginY + arrowSize);
        ctx.lineTo(gridOriginX + gridPixelW + padding, gridOriginY + gridPixelH - arrowSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gridOriginX + gridPixelW + padding, gridOriginY);
        ctx.lineTo(gridOriginX + gridPixelW + padding - arrowSize / 2, gridOriginY + arrowSize);
        ctx.lineTo(gridOriginX + gridPixelW + padding + arrowSize / 2, gridOriginY + arrowSize);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(gridOriginX + gridPixelW + padding, gridOriginY + gridPixelH);
        ctx.lineTo(gridOriginX + gridPixelW + padding - arrowSize / 2, gridOriginY + gridPixelH - arrowSize);
        ctx.lineTo(gridOriginX + gridPixelW + padding + arrowSize / 2, gridOriginY + gridPixelH - arrowSize);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.translate(gridOriginX + gridPixelW + padding + fontSize * 0.7, gridOriginY + gridPixelH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(hLabel, 0, 0);
        ctx.restore();
        ctx.shadowBlur = 0;

        // Draw legend
        const legendX = gridOriginX + gridPixelW + dimPad * 2;
        const legendY = legendPad;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.fillRect(legendX, legendY, legendWidth, legendH);
        ctx.strokeRect(legendX, legendY, legendWidth, legendH);

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(fontSize * 0.85)}px sans-serif`;
        ctx.fillText('Legend', legendX + legendPad / 2, legendY + legendTitleHeight / 2);

        ctx.font = `${Math.round(fontSize * 0.75)}px sans-serif`;
        legendEntries.forEach(([color, label], i) => {
          const entryY = legendY + legendTitleHeight + i * legendEntryHeight;
          ctx.fillStyle = color;
          ctx.strokeStyle = '#00000033';
          ctx.lineWidth = 1;
          const swatch = legendEntryHeight * 0.5;
          ctx.fillRect(legendX + legendPad / 2, entryY + (legendEntryHeight - swatch) / 2, swatch, swatch);
          ctx.strokeRect(legendX + legendPad / 2, entryY + (legendEntryHeight - swatch) / 2, swatch, swatch);
          ctx.fillStyle = '#1e293b';
          ctx.fillText(label || color, legendX + legendPad / 2 + swatch + 12, entryY + legendEntryHeight / 2);
        });

        const safeName = (currentScreen.name || 'screen').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `WALL_LAYOUT_${safeName}.png`;
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        trackEvent('download', { type: 'wall-layout', filename, thumbnail: dataUrl });
        toast({ title: "Download Started", description: "Your wall layout image is being downloaded." });
      } catch (err) {
        console.error("Wall layout download failed", err);
        toast({ title: "Download Failed", description: "Could not generate the wall layout image.", variant: "destructive" });
      } finally {
        setIsWallLayoutDownloading(false);
      }
    }, 50);
  }, [activeBounds, currentScreen, createScreenContentCanvas, includeTextOverlaysInDownload, wallLayoutLegend, toast]);


  const getProjectData = useCallback((): ProjectData => {
    const readLS = (key: string): any => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : undefined;
      } catch { return undefined; }
    };

    const calculator: CalculatorTabData | undefined = (() => {
      const fs = readLS('calculator:formState');
      const at = readLS('calculator:activeTab');
      if (!fs && !at) return undefined;
      return { formState: fs, activeTab: at };
    })();

    const powerData: PowerDataTabData | undefined = (() => {
      const d: PowerDataTabData = {
        selectedProductId: readLS('power-data:selectedProductId'),
        selectedProcessorId: readLS('power-data:selectedProcessorId'),
        circuitVoltage: readLS('power-data:circuitVoltage'),
        circuitAmperage: readLS('power-data:circuitAmperage'),
        safetyMargin: readLS('power-data:safetyMargin'),
        refreshRate: readLS('power-data:refreshRate'),
        bitDepth: readLS('power-data:bitDepth'),
      };
      return Object.values(d).some(v => v !== undefined) ? d : undefined;
    })();

    const rackDrawing: RackDrawingTabData | undefined = (() => {
      const racks = readLS('rack-builder:racks');
      const nextRackId = readLS('rack-builder:nextRackId');
      const activeSide = readLS('rack-builder:activeSide');
      const showImages = readLS('rack-builder:showImages');
      if (racks === undefined && nextRackId === undefined && activeSide === undefined && showImages === undefined) return undefined;
      return { racks, nextRackId, activeSide, showImages };
    })();

    const gear: GearConfig | undefined = gearRef.current || undefined;

    return {
      version: "1.5.0",
      screens,
      currentScreenId,
      activeTab,
      projectNumber,
      versionNumber,
      projectNotes,
      mediaServer,
      preferredCodec,
      videoContainer,
      frameRate,
      audioFormat,
      audioEmbedded,
      samplingRate,
      audioBitRate,
      imageFormat,
      rasterMapConfigs,
      rasterGroups,
      activeRasterGroupId,
      rasterBgColor,
      uploadedMaps,
      includeTextOverlaysInDownload,
      calculator,
      powerData,
      rackDrawing,
      gear,
      wallLayoutLegend,
    };
  }, [screens, currentScreenId, activeTab, projectNumber, versionNumber, projectNotes, mediaServer, preferredCodec, videoContainer, frameRate, audioFormat, audioEmbedded, samplingRate, audioBitRate, imageFormat, rasterMapConfigs, rasterGroups, activeRasterGroupId, rasterBgColor, uploadedMaps, includeTextOverlaysInDownload]);

  const loadProjectData = useCallback((data: ProjectData) => {
    let maxId = 0;
    const migratedScreens = data.screens.map((s: any) => {
      const newScreen = createNewScreen("", 0);
      const migratedScreen = { ...newScreen, ...s, sections: Array.isArray(s.sections) ? s.sections : [] };
      migratedScreen.tiles.forEach((t: Tile) => {
        if (t.id > maxId) maxId = t.id;
      });
      if (!migratedScreen.nextTileId || migratedScreen.nextTileId <= maxId) {
        migratedScreen.nextTileId = maxId + 1;
      }
      return migratedScreen;
    });
    nextIdCounter.current = maxId + 1;
    setScreens(migratedScreens);
    setCurrentScreenId(data.currentScreenId);
    setActiveTab(data.activeTab);
    if (data.projectNumber) setProjectNumber(data.projectNumber);
    if (data.versionNumber) setVersionNumber(data.versionNumber);
    if (data.projectNotes) setProjectNotes(data.projectNotes);
    if (data.mediaServer) setMediaServer(data.mediaServer);
    if (data.preferredCodec) setPreferredCodec(data.preferredCodec);
    if (data.videoContainer) setVideoContainer(data.videoContainer);
    if (data.frameRate) setFrameRate(data.frameRate);
    if (data.audioFormat) setAudioFormat(data.audioFormat);
    if (data.audioEmbedded !== undefined) setAudioEmbedded(data.audioEmbedded);
    if (data.samplingRate) setSamplingRate(data.samplingRate);
    if (data.audioBitRate) setAudioBitRate(data.audioBitRate);
    if (data.imageFormat) setImageFormat(data.imageFormat);

    if (data.rasterMapConfigs) setRasterMapConfigs(data.rasterMapConfigs);
    if (data.rasterGroups) setRasterGroups(data.rasterGroups);
    if (data.activeRasterGroupId) setActiveRasterGroupId(data.activeRasterGroupId);
    if (data.rasterBgColor) setRasterBgColor(data.rasterBgColor);
    if (data.uploadedMaps) setUploadedMaps(data.uploadedMaps);
    if (data.includeTextOverlaysInDownload !== undefined) setIncludeTextOverlaysInDownload(data.includeTextOverlaysInDownload);

    const writeLS = (key: string, value: any) => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    };
    if (data.calculator) {
      if (data.calculator.formState) writeLS('calculator:formState', data.calculator.formState);
      if (data.calculator.activeTab) writeLS('calculator:activeTab', data.calculator.activeTab);
    }
    if (data.powerData) {
      if (data.powerData.selectedProductId !== undefined) writeLS('power-data:selectedProductId', data.powerData.selectedProductId);
      if (data.powerData.selectedProcessorId !== undefined) writeLS('power-data:selectedProcessorId', data.powerData.selectedProcessorId);
      if (data.powerData.circuitVoltage !== undefined) writeLS('power-data:circuitVoltage', data.powerData.circuitVoltage);
      if (data.powerData.circuitAmperage !== undefined) writeLS('power-data:circuitAmperage', data.powerData.circuitAmperage);
      if (data.powerData.safetyMargin !== undefined) writeLS('power-data:safetyMargin', data.powerData.safetyMargin);
      if (data.powerData.refreshRate !== undefined) writeLS('power-data:refreshRate', data.powerData.refreshRate);
      if (data.powerData.bitDepth !== undefined) writeLS('power-data:bitDepth', data.powerData.bitDepth);
    }
    if (data.rackDrawing) {
      if (data.rackDrawing.racks !== undefined) writeLS('rack-builder:racks', data.rackDrawing.racks);
      if (data.rackDrawing.nextRackId !== undefined) writeLS('rack-builder:nextRackId', data.rackDrawing.nextRackId);
      if (data.rackDrawing.activeSide !== undefined) writeLS('rack-builder:activeSide', data.rackDrawing.activeSide);
      if (data.rackDrawing.showImages !== undefined) writeLS('rack-builder:showImages', data.rackDrawing.showImages);
    }
    if (data.gear) {
      gearRef.current = data.gear;
    }
    if (data.wallLayoutLegend) {
      setWallLayoutLegend(data.wallLayoutLegend);
    }
  }, []);

  const AUTOSAVE_KEY = 'pixel-mapper-autosave';
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as ProjectData;
        if (data.screens && data.screens.length > 0) {
          loadProjectData(data);
        }
      }
    } catch {
      // ignore corrupt autosave data
    }
  }, [loadProjectData]);

  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    localSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(getProjectData()));
      } catch {
        // storage full or unavailable
      }
    }, 1000);
    return () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    };
  }, [getProjectData]);

  const pushHistory = useCallback(() => {
    historyRef.current.past.push(getProjectData());
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
    setHistoryVersion(v => v + 1);
  }, [getProjectData]);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const prev = past.pop()!;
    future.push(getProjectData());
    isUndoRedoRef.current = true;
    loadProjectData(prev);
    setHistoryVersion(v => v + 1);
  }, [getProjectData, loadProjectData]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const next = future.pop()!;
    past.push(getProjectData());
    isUndoRedoRef.current = true;
    loadProjectData(next);
    setHistoryVersion(v => v + 1);
  }, [getProjectData, loadProjectData]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // Debounced auto-capture: snapshot previous state on screen changes.
  // isUndoRedoRef is checked AND reset inside the timer so redo isn't wiped.
  useEffect(() => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    const wasUndoRedo = isUndoRedoRef.current;
    historyTimerRef.current = setTimeout(() => {
      if (wasUndoRedo) {
        // Just update the baseline snapshot after undo/redo; don't touch history.
        lastSnapshotRef.current = getProjectData();
        isUndoRedoRef.current = false;
        return;
      }
      const currentSnapshot = getProjectData();
      const last = lastSnapshotRef.current;
      if (last && JSON.stringify(last) !== JSON.stringify(currentSnapshot)) {
        historyRef.current.past.push(last);
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = [];
        setHistoryVersion(v => v + 1);
      }
      lastSnapshotRef.current = currentSnapshot;
    }, 800);
    return () => { if (historyTimerRef.current) clearTimeout(historyTimerRef.current); };
  }, [screens, getProjectData]);

  const clearAllWiring = useCallback(() => {
    setScreens(prevScreens => prevScreens.map(s => ({
      ...s,
      tiles: s.tiles.map(t => ({ ...t, dataCircuit: undefined, powerCircuit: undefined, powerPortLabel: undefined })),
      wiringPattern: 'serpentine-horizontal',
      powerWiringPattern: 'left-right',
    })));
    toast({ title: "Wiring Cleared", description: "All manual wiring has been removed." });
  }, [toast]);

  const startNewProject = useCallback(() => {
    const newScreen = createNewScreen("Default Screen", 1);
    nextIdCounter.current = newScreen.nextTileId;
    setScreens([newScreen]);
    setCurrentScreenId(newScreen.id);
    setActiveTab('grid');
    setProjectName("Untitled Project");
    setActiveProjectId(null);
    setRasterGroups([{ id: 'raster-1', name: 'Raster 1' }]);
    setActiveRasterGroupId('raster-1');
    setRasterMapConfigs({});
    setProjectNumber("");
    setVersionNumber("1.0");
    setProjectNotes("");
    setUploadedMaps([]);
    toast({ title: "New Project", description: "Started a new project. Use Undo to bring back your previous work." });
  }, [toast]);

  const exportProject = useCallback((projectName?: string) => {
    const projectData: ProjectData = getProjectData();

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (projectName || "Untitled Project").replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}.json`;
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
  }, [getProjectData, screens.length, toast]);
  
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
        
        let maxId = 0;
        
        if (data.dimensions) {
          const screen = createNewScreen("Imported Screen", nextIdCounter.current);
          nextIdCounter.current += screen.tiles.length;
          
          Object.assign(screen, {
            ...data,
            id: crypto.randomUUID(),
            name: "Imported Screen",
            zoomLevels: data.zoomLevels || { grid: data.zoom || 1, wiring: data.zoom || 1, raster: data.zoom || 1, deliverables: 1 },
            lastRasterArgs: data.lastRasterArgs || null,
            sections: Array.isArray(data.sections) ? data.sections : [],
          });
          
          setScreens([screen]);
          setCurrentScreenId(screen.id);
          setActiveTab(data.activeTab || 'grid');
        } else {
          const migratedScreens = data.screens.map((s: any) => {
            const newScreen = createNewScreen("", 0);
            const migratedScreen = { ...newScreen, ...s, sections: Array.isArray(s.sections) ? s.sections : [] };
            migratedScreen.tiles.forEach((t: Tile) => {
              if (t.id > maxId) maxId = t.id;
            });
            if (!migratedScreen.nextTileId || migratedScreen.nextTileId <= maxId) {
              migratedScreen.nextTileId = maxId + 1;
            }
            return migratedScreen;
          });
          nextIdCounter.current = maxId + 1;
          setScreens(migratedScreens);
          setCurrentScreenId(data.currentScreenId);
          setActiveTab(data.activeTab);
          if (data.projectNumber) setProjectNumber(data.projectNumber);
          if (data.versionNumber) setVersionNumber(data.versionNumber);
          if (data.projectNotes) setProjectNotes(data.projectNotes);
          if (data.mediaServer) setMediaServer(data.mediaServer);
          if (data.preferredCodec) setPreferredCodec(data.preferredCodec);
          if (data.videoContainer) setVideoContainer(data.videoContainer);
          if (data.frameRate) setFrameRate(data.frameRate);
          if (data.audioFormat) setAudioFormat(data.audioFormat);
          if (data.audioEmbedded !== undefined) setAudioEmbedded(data.audioEmbedded);
          if (data.samplingRate) setSamplingRate(data.samplingRate);
          if (data.audioBitRate) setAudioBitRate(data.audioBitRate);
          if (data.imageFormat) setImageFormat(data.imageFormat);

          if (data.rasterMapConfigs) setRasterMapConfigs(data.rasterMapConfigs);
          if (data.rasterGroups) setRasterGroups(data.rasterGroups);
          if (data.activeRasterGroupId) setActiveRasterGroupId(data.activeRasterGroupId);
          if (data.rasterBgColor) setRasterBgColor(data.rasterBgColor);
          if (data.uploadedMaps) setUploadedMaps(data.uploadedMaps);
          if (data.includeTextOverlaysInDownload !== undefined) setIncludeTextOverlaysInDownload(data.includeTextOverlaysInDownload);
        }

        const writeLS = (key: string, value: any) => {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
        };
        if (data.calculator) {
          if (data.calculator.formState) writeLS('calculator:formState', data.calculator.formState);
          if (data.calculator.activeTab) writeLS('calculator:activeTab', data.calculator.activeTab);
        }
        if (data.powerData) {
          if (data.powerData.selectedProductId !== undefined) writeLS('power-data:selectedProductId', data.powerData.selectedProductId);
          if (data.powerData.selectedProcessorId !== undefined) writeLS('power-data:selectedProcessorId', data.powerData.selectedProcessorId);
          if (data.powerData.circuitVoltage !== undefined) writeLS('power-data:circuitVoltage', data.powerData.circuitVoltage);
          if (data.powerData.circuitAmperage !== undefined) writeLS('power-data:circuitAmperage', data.powerData.circuitAmperage);
          if (data.powerData.safetyMargin !== undefined) writeLS('power-data:safetyMargin', data.powerData.safetyMargin);
          if (data.powerData.refreshRate !== undefined) writeLS('power-data:refreshRate', data.powerData.refreshRate);
          if (data.powerData.bitDepth !== undefined) writeLS('power-data:bitDepth', data.powerData.bitDepth);
        }
        if (data.rackDrawing) {
          if (data.rackDrawing.racks !== undefined) writeLS('rack-builder:racks', data.rackDrawing.racks);
          if (data.rackDrawing.nextRackId !== undefined) writeLS('rack-builder:nextRackId', data.rackDrawing.nextRackId);
          if (data.rackDrawing.activeSide !== undefined) writeLS('rack-builder:activeSide', data.rackDrawing.activeSide);
          if (data.rackDrawing.showImages !== undefined) writeLS('rack-builder:showImages', data.rackDrawing.showImages);
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
    const screenEffectiveWidth = screen.dimensions.screenWidth + (screen.leftHalfTile ? 1 : 0) + (screen.rightHalfTile ? 1 : 0);

    const screenWiringData = getWiringData({
        dimensions: { ...screen.dimensions, screenHeight: screenEffectiveHeight, screenWidth: screenEffectiveWidth },
        tiles: screen.tiles,
        wiringPortConfig: screen.wiringPortConfig,
        dataPortStartNumber: screen.dataPortStartNumber,
        tilesPerPowerString: screen.tilesPerPowerString,
        wiringPattern: screen.wiringPattern,
        powerWiringPattern: screen.powerWiringPattern,
        processorType: screen.processorType,
        topHalfTile: screen.topHalfTile,
        bottomHalfTile: screen.bottomHalfTile,
        leftHalfTile: screen.leftHalfTile,
        rightHalfTile: screen.rightHalfTile,
        screenId: screen.id,
    });
    
    const screenLabels = (() => {
        const totalTiles = screen.tiles.length;
        if (totalTiles <= 0) return [];
        const newLabels = Array(totalTiles).fill('');
        const activeTileIndices = screen.tiles.map((_, i) => i).filter(i => !screen.tiles[i].deleted);
        const pathOrder = getPathOrder(activeTileIndices, screen.wiringPattern, screenEffectiveWidth, screenEffectiveHeight);
        const startNumber = screen.labelStartNumber || 1;

        if (screen.labelFormat === 'sequential' || screen.labelFormat === 'dmx-style') {
          pathOrder.forEach((originalIndex, pathIndex) => {
            if (screen.labelFormat === 'sequential') {
              newLabels[originalIndex] = String(pathIndex + startNumber);
            } else { 
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
              const x = i % screenEffectiveWidth;
              const y = Math.floor(i / screenEffectiveWidth);
              if (screen.labelFormat === 'row-col') {
                newLabels[i] = `${y + startNumber}-${x + 1}`;
              } else if (screen.labelFormat === 'row-letter-col-number') {
                const rowLetter = String.fromCharCode('A'.charCodeAt(0) + y + startNumber - 1);
                const colNumber = x + 1;
                newLabels[i] = `${rowLetter}${colNumber}`;
              }
            }
          }
        }
        return newLabels;
    })();

    const { tileWidth, tileHeight } = screen.dimensions;
    const contentWidth = Array.from({ length: screenActiveBounds.maxX - screenActiveBounds.minX + 1 }, (_, i) => {
        const x = screenActiveBounds.minX + i;
        const isLeftHalf = screen.leftHalfTile && x === 0;
        const isRightHalf = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
        return (isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth;
    }).reduce((a,b) => a+b, 0);

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

    const rowData: { yPos: number; height: number }[] = [];
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

    let currentDrawY = 0;
    for (let y = screenActiveBounds.minY; y <= screenActiveBounds.maxY; y++) {
        const tileYPos = getTileVisualY(y);
        const rowPixelHeight = rowData[y].height;
        
        let currentDrawX = 0;
        for (let x = screenActiveBounds.minX; x <= screenActiveBounds.maxX; x++) {
            const isLeftHalfCol = screen.leftHalfTile && x === 0;
            const isRightHalfCol = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
            const colPixelWidth = (isLeftHalfCol || isRightHalfCol) ? tileWidth / 2 : tileWidth;

            const index = y * screenEffectiveWidth + x;
            const tile = screen.tiles[index];
            if (tile && !tile.deleted) {
                const bgColor = (x + y) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
                ctx.fillStyle = bgColor;
                ctx.fillRect(currentDrawX, tileYPos, colPixelWidth, rowPixelHeight);

                if (screen.borderWidth > 0) {
                  ctx.strokeStyle = screen.borderColor;
                  ctx.lineWidth = screen.borderWidth;
                  ctx.strokeRect(currentDrawX, tileYPos, colPixelWidth, rowPixelHeight);
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
                            textX = currentDrawX + 8;
                            textY = tileYPos + 4;
                            break;
                        case 'top-right':
                            ctx.textAlign = 'right';
                            ctx.textBaseline = 'top';
                            textX = currentDrawX + colPixelWidth - 8;
                            textY = tileYPos + 4;
                            break;
                        case 'bottom-left':
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'bottom';
                            textX = currentDrawX + 8;
                            textY = tileYPos + rowPixelHeight - 4;
                            break;
                        case 'bottom-right':
                            ctx.textAlign = 'right';
                            ctx.textBaseline = 'bottom';
                            textX = currentDrawX + colPixelWidth - 8;
                            textY = tileYPos + rowPixelHeight - 4;
                            break;
                        case 'center':
                        default:
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            textX = currentDrawX + colPixelWidth / 2;
                            break;
                    }
                    ctx.fillText(screenLabels[index], textX, textY);
                }
            }
            currentDrawX += colPixelWidth;
        }
        currentDrawY += rowPixelHeight;
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

    if (screen.showDataLabels) {
      const dataColor = screen.dataLabelColor;
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
    
    if (screen.showPowerLabels) {
        const powerColor = screen.powerLabelColor;
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

    screenWiringData.forEach(({ x, y, isDeleted, dataLabel, backupLabel, powerPortLabel }) => {
        if (isDeleted) return;
        if (x < screenActiveBounds.minX || x > screenActiveBounds.maxX || y < screenActiveBounds.minY || y > screenActiveBounds.maxY) return;
        
        let tileXPos = 0;
        for (let i = screenActiveBounds.minX; i < x; i++) {
          const isLeftHalfCol = screen.leftHalfTile && i === 0;
          const isRightHalfCol = screen.rightHalfTile && i === (screenEffectiveWidth - 1);
          tileXPos += (isLeftHalfCol || isRightHalfCol) ? tileWidth / 2 : tileWidth;
        }
        const isCurrentLeftHalf = screen.leftHalfTile && x === 0;
        const isCurrentRightHalf = screen.rightHalfTile && x === (screenEffectiveWidth - 1);
        const currentTileWidth = (isCurrentLeftHalf || isCurrentRightHalf) ? tileWidth / 2 : tileWidth;
        tileXPos += currentTileWidth / 2;

        const tileYPos = getTileVisualY(y) + rowData[y].height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelsToDraw = [];
        if(screen.showDataLabels && (dataLabel || backupLabel)) {
           labelsToDraw.push({
               label: backupLabel || dataLabel,
               size: screen.dataLabelSize,
               bgColor: backupLabel ? `hsl(${computedStyle.getPropertyValue('--destructive').trim()})` : screen.dataLabelColor,
               fgColor: backupLabel ? `hsl(${computedStyle.getPropertyValue('--destructive-foreground').trim()})` : '#ffffff',
           });
        }
        if(screen.showPowerLabels && powerPortLabel) {
           labelsToDraw.push({
               label: powerPortLabel,
               size: screen.powerLabelSize,
               bgColor: screen.powerLabelColor,
               fgColor: '#ffffff',
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

  const { scheduleSave, isSyncing } = useRealtimeSync({
    projectId: activeProjectId,
    userId: user?.id ?? null,
    screens,
    getProjectData,
    mergeRemoteScreen,
    removeRemoteScreen,
  });

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
    duplicateScreen,
    dimensions: currentScreen.dimensions,
    setDimensions,
    tiles: currentScreen.tiles,
    labels,
    sliceOffsetLabels,
    wiringData,
    handleTileClick,
    selectionRect,
    selectedTileIds,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
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
    isPngDownloading,
    wallLayoutLegend,
    setWallLayoutLegend,
    handleDownloadWallLayout,
    isWallLayoutDownloading,
    includeTextOverlaysInDownload,
    setIncludeTextOverlaysInDownload,
    handleDownloadWiringDiagram,
    handleDownloadCompositeWiringDiagram,
    handleDownloadFullRaster,
    generateRasterMap,
    downloadRasterSlices,
    downloadSingleSlice,
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
    showScreenName: currentScreen.showScreenName,
    setShowScreenName,
    screenNameLabelPosition: currentScreen.screenNameLabelPosition,
    setScreenNameLabelPosition,
    screenNameLabelFontSize: currentScreen.screenNameLabelFontSize,
    setScreenNameLabelFontSize,
    screenNameLabelColor: currentScreen.screenNameLabelColor,
    setScreenNameLabelColor,
    screenNameLabelColorMode: currentScreen.screenNameLabelColorMode,
    setScreenNameLabelColorMode,
    showResolution: currentScreen.showResolution ?? false,
    setShowResolution,
    resolutionLabelPosition: currentScreen.resolutionLabelPosition ?? 'bottom-right',
    setResolutionLabelPosition,
    resolutionLabelFontSize: currentScreen.resolutionLabelFontSize ?? 32,
    setResolutionLabelFontSize,
    resolutionLabelColor: currentScreen.resolutionLabelColor ?? '#ffffff',
    setResolutionLabelColor,
    resolutionLabelColorMode: currentScreen.resolutionLabelColorMode ?? 'auto',
    setResolutionLabelColorMode,
    showDimensions: currentScreen.showDimensions ?? false,
    setShowDimensions,
    dimensionUnit: currentScreen.dimensionUnit ?? 'all',
    setDimensionUnit,
    dimensionLabelSize: currentScreen.dimensionLabelSize ?? 24,
    setDimensionLabelSize,
    dimensionLabelColor: currentScreen.dimensionLabelColor ?? '#ffffff',
    setDimensionLabelColor,
    customTileWidthMm: currentScreen.customTileWidthMm ?? 0,
    setCustomTileWidthMm,
    customTileHeightMm: currentScreen.customTileHeightMm ?? 0,
    setCustomTileHeightMm,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    setLogoOverlay,
    onOffMode: currentScreen.onOffMode,
    setOnOffMode,
    zoom,
    setZoom,
    activeTab,
    setActiveTab,
    activeBounds,
    createScreenContentCanvas,
    rasterMapConfig,
    setRasterMapConfig,
    rasterMapConfigs,
    rasterGroups,
    setRasterGroups,
    activeRasterGroupId,
    setActiveRasterGroupId,
    addRasterGroup,
    renameRasterGroup,
    deleteRasterGroup,
    rasterOffset: currentScreen.rasterOffset,
    setRasterOffset,
    updateScreenById,
    mergeRemoteScreen,
    removeRemoteScreen,
    rasterBgColor,
    setRasterBgColor,
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
    getProjectData,
    loadProjectData,
    activeProjectId,
    setActiveProjectId,
    scheduleSave,
    isSyncing,
    projectName,
    setProjectName,
    clearAllWiring,
    undo,
    redo,
    canUndo,
    canRedo,
    startNewProject,
    brushColor: currentScreen.brushColor,
    setBrushColor,
    isWiringMirrored: currentScreen.isWiringMirrored,
    setIsWiringMirrored,
    dataLabelSize: currentScreen.dataLabelSize,
    setDataLabelSize,
    powerLabelSize: currentScreen.powerLabelSize,
    setPowerLabelSize,
    dataLabelColor: currentScreen.dataLabelColor,
    setDataLabelColor,
    powerLabelColor: currentScreen.powerLabelColor,
    setPowerLabelColor,
    calculateAndApplyOptimalOffset,
    showSliceOffsetLabels: currentScreen.showSliceOffsetLabels,
    setShowSliceOffsetLabels,
    topHalfTile: currentScreen.topHalfTile,
    handleTopHalfTileChange,
    bottomHalfTile: currentScreen.bottomHalfTile,
    handleBottomHalfTileChange,
    leftHalfTile: currentScreen.leftHalfTile,
    handleLeftHalfTileChange,
    rightHalfTile: currentScreen.rightHalfTile,
    handleRightHalfTileChange,
    effectiveScreenHeight,
    effectiveScreenWidth,
    processorType: currentScreen.processorType,
    setProcessorType,
    selectedProductId: currentScreen.selectedProductId,
    setSelectedProductId,
    isManualPowerModalOpen,
    setIsManualPowerModalOpen,
    selectedTileForPower,
    applyManualPowerWiring,
    isManualDataModalOpen,
    setIsManualDataModalOpen,
    selectedTileForData,
    applyManualDataWiring,
    showModules: currentScreen.showModules,
    setShowModules,
    moduleBorderColor: currentScreen.moduleBorderColor,
    setModuleBorderColor,
    randomizeModuleColors: currentScreen.randomizeModuleColors,
    setRandomizeModuleColors,
    regenerateModuleColors,
    projectNumber,
    setProjectNumber,
    versionNumber,
    setVersionNumber,
    projectNotes,
    setProjectNotes,
    uploadedMaps,
    addUploadedMap,
    removeUploadedMap,
    mediaServer,
    setMediaServer,
    preferredCodec,
    setPreferredCodec,
    videoContainer,
    setVideoContainer,
    frameRate,
    setFrameRate,
    audioFormat,
    setAudioFormat,
    audioEmbedded,
    setAudioEmbedded,
    samplingRate,
    setSamplingRate,
    audioBitRate,
    setAudioBitRate,
    imageFormat,
    setImageFormat,
    lastRasterArgs: currentScreen.lastRasterArgs,
    rasterGroupId: currentScreen.rasterGroupId,
    textOverlays: currentScreen.textOverlays,
    logoOverlay: currentScreen.logoOverlay ?? null,
    gear: gearRef.current,
    gearVersion,
    addProcessor,
    updateProcessor,
    removeProcessor,
    addFiberBox,
    updateFiberBox,
    removeFiberBox,
    addCable,
    updateCable,
    removeCable,
    regenerateGear,
    sections: currentScreen.sections,
    addSection,
    updateSection,
    removeSection,
    effectiveScreenWidthFromSections,
  };

  return (
    <PixelMapContext.Provider value={value}>
      {children}
    </PixelMapContext.Provider>
  );
}
