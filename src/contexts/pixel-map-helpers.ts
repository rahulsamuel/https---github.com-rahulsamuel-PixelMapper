import type { Screen, Dimensions } from "./pixel-map-types";
import type { WiringPattern } from "@/lib/wiring";

export function formatFractionalInch(inches: number): string {
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

export const trackEvent = async (eventType: string, eventData: any) => {
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

export const repositionDefaultLogo = (screen: Screen, dimensions: Dimensions): Screen => {
  if (screen.logoOverlay?.id !== 'default-logo' || screen.logoOverlay.imageData !== '/Untitled_design_(4)-modified.png') {
    return screen;
  }

  const logoSize = 100;
  return {
    ...screen,
    logoOverlay: {
      ...screen.logoOverlay,
      width: logoSize,
      height: logoSize,
      x: (dimensions.screenWidth - 1) * dimensions.tileWidth + (dimensions.tileWidth - logoSize) / 2,
      y: (dimensions.screenHeight - 1) * dimensions.tileHeight + (dimensions.tileHeight - logoSize) / 2,
      opacity: screen.logoOverlay.opacity ?? 0.8,
    },
  };
};

export const createNewScreen = (name: string, idCounter: number): Screen => {
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
    alternatingPixels: false,
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
    showTextOverlaysInWiring: true,
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
    logoOverlay: {
      id: 'default-logo',
      imageData: '/Untitled_design_(4)-modified.png',
      x: (initialWidth - 1) * 200 + (200 - 100) / 2,
      y: (initialHeight - 1) * 200 + (200 - 100) / 2,
      width: 100,
      height: 100,
      aspectRatio: 1,
      opacity: 0.8,
    },
    showLogoOverlay: true,
    showModules: false,
    moduleBorderColor: "#000000",
    randomizeModuleColors: false,
    moduleColors: [],
    rasterCrop: null,
    rasterSegments: [],
    sections: [],
    outputCount: 1,
    outputResolutionPreset: 'content',
    outputResolutionWidth: 0,
    outputResolutionHeight: 0,
  };
};
