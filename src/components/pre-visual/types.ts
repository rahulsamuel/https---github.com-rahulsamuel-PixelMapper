export type ViewMode = "front" | "back" | "side" | "top" | "isometric" | "isometric-left" | "isometric-right";

export type RenderMode = "2d" | "3d";

export interface PreVisualScreenData {
  id: string;
  name: string;
  screenWidthTiles: number;
  screenHeightTiles: number;
  tileWidthMm: number;
  tileHeightMm: number;
  tileDepthMm: number;
  tileWidthPx: number;
  tileHeightPx: number;
  tileColor: string;
  tileColorTwo: string;
  borderColor: string;
  borderWidth: number;
  curveRadiusMm: number;
  curveAngleDeg: number;
  productImageUrl: string | null;
  productName: string | null;
  manufacturer: string | null;
  sections: {
    productId: string;
    columnCount: number;
    tileWidthPx: number;
    tileHeightPx: number;
    tileWidthMm: number;
    tileHeightMm: number;
  }[];
}

export interface ModelLibraryEntry {
  id: string;
  name: string;
  category: "tile" | "hardware" | "processor" | "misc";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface PreVisualSettings {
  view: ViewMode;
  renderMode: RenderMode;
  zoom: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  showDimensions: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showDepth: boolean;
  backgroundColor: string;
  selectedScreenId: string | null;
}

export const DEFAULT_SETTINGS: PreVisualSettings = {
  view: "isometric",
  renderMode: "3d",
  zoom: 1,
  rotateX: -25,
  rotateY: 25,
  rotateZ: 0,
  showDimensions: true,
  showLabels: true,
  showGrid: true,
  showDepth: true,
  backgroundColor: "#0a0a0a",
  selectedScreenId: null,
};
