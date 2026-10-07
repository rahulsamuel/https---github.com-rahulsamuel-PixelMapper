import type { Dispatch, SetStateAction } from "react";
import type { WiringPattern, WiringInfo } from "@/lib/wiring";

export interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    [key: string]: any;
}

export interface Dimensions {
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

export interface ActiveBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type ActiveTool = 'delete' | 'label' | 'color' | 'power' | 'data';
export type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style' | 'row-letter-col-number';
export type LabelPosition = 'top-left' | 'top-right' | 'top-center' | 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
export type LabelColorMode = 'single' | 'auto';
export type ResolutionType = 'content' | 'hd' | '4k-uhd' | '4k-dci' | 'custom';
export type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';
export type PixelMapMode = 'basic' | 'advanced';

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
  opacity: number;
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

export interface ScreenArrangement {
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
  showTextOverlaysInWiring: boolean;
  showResolution: boolean;
  resolutionLabelPosition: string;
  showDimensions: boolean;
  dimensionUnit: 'mm' | 'meters' | 'inches' | 'decimal-feet' | 'feet-inches' | 'tiles' | 'all';
  dimensionLabelSize: number;
  dimensionLabelColor: string;
  customTileWidthMm: number;
  customTileHeightMm: number;
  showLogoOverlay: boolean;
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

export interface RasterArgs {
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
  alternatingPixels: boolean;
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
  showTextOverlaysInWiring: boolean;
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
  showLogoOverlay: boolean;
  showModules: boolean;
  moduleBorderColor: string;
  randomizeModuleColors: boolean;
  moduleColors: string[][];
  rasterCrop: ActiveBounds | null;
  rasterSegments?: RasterSegment[];
  outputCount: number;
  outputResolutionPreset: 'content' | '1920x1080' | '3840x2160' | '4096x2160' | 'custom';
  outputResolutionWidth: number;
  outputResolutionHeight: number;
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
  deliverablesScreenIds?: string[];
}

export interface PixelMapState extends Omit<Screen, 'id' | 'name' | 'zoomLevels' | 'nextTileId' | 'moduleColors' | 'outputCount' | 'outputResolutionPreset' | 'outputResolutionWidth' | 'outputResolutionHeight'> {
  screens: Screen[];
  products: LedProduct[];
  currentScreen: Screen;
  currentScreenId: string;
  setCurrentScreenId: (id: string) => void;
  addNewScreen: () => void;
  renameScreen: (id: string, newName: string) => void;
  deleteScreen: (id: string) => void;
  duplicateScreen: (id: string) => void;
  moveScreenUp: (id: string) => void;
  moveScreenDown: (id: string) => void;
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
  showLogoOverlay: boolean;
  setShowLogoOverlay: Dispatch<SetStateAction<boolean>>;
  setOnOffMode: Dispatch<SetStateAction<boolean>>;
  alternatingPixels: boolean;
  setAlternatingPixels: Dispatch<SetStateAction<boolean>>;
  zoom: number;
  setZoom: (value: number | ((prev: number) => number), applyToAllTabs?: boolean) => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  pixelMapMode: PixelMapMode;
  setPixelMapMode: (mode: PixelMapMode) => void;
  canUseAdvancedMode: boolean;
  activeBounds: ActiveBounds | null;
  createScreenContentCanvas: (screen: Screen, screenActiveBounds: ActiveBounds | null, drawOverlays?: boolean) => HTMLCanvasElement | null;
  drawTextOverlaysOnCtx: (ctx: CanvasRenderingContext2D, overlays: TextOverlay[], canvasWidth: number, canvasHeight: number, offsetX?: number, offsetY?: number) => void;
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
  setShowTextOverlaysInWiring: Dispatch<SetStateAction<boolean>>;
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
  deliverablesScreenIds: string[];
  setDeliverablesScreenIds: Dispatch<SetStateAction<string[]>>;
}
