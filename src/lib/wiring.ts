

import type { Tile } from "@/contexts/pixel-map-context";

interface Dimensions {
  tileWidth: number;
  tileHeight: number;
  screenWidth: number;
  screenHeight: number;
}

interface ActiveBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

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
  screenArrangement: ScreenArrangement[];
}

export type WiringPattern =
  | 'serpentine-horizontal'
  | 'serpentine-horizontal-start-right'
  | 'serpentine-horizontal-reverse'
  | 'serpentine-vertical'
  | 'serpentine-vertical-reverse'
  | 'serpentine-vertical-bottom-start'
  | 'serpentine-vertical-reverse-bottom-start'
  | 'serpentine-vertical-bottom-main'
  | 'custom-serpentine-h'
  | 'custom-serpentine-h-start-right'
  | 'custom-serpentine-v'
  | 'custom-serpentine-v-start-bottom'
  | 'left-right'
  | 'right-to-left'
  | 'top-bottom'
  | 'bottom-to-top'
  | 'manual';
type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';

export interface WiringInfo {
  x: number;
  y: number;
  dataLabel: string;
  powerPortLabel: string;
  backupLabel: string;
  isDeleted: boolean;
  nextTile: { x: number; y: number } | null;
  nextPowerTile: { x: number; y: number } | null;
  sliceOffsetLabel?: string;
}

export function getPathOrder(indices: number[], pattern: WiringPattern, screenWidth: number, screenHeight: number, runLength?: number): number[] {
  const getCoords = (index: number) => ({
    x: index % screenWidth,
    y: Math.floor(index / screenWidth),
  });

  if (pattern === 'custom-serpentine-h' || pattern === 'custom-serpentine-h-start-right' ||
      pattern === 'custom-serpentine-v' || pattern === 'custom-serpentine-v-start-bottom') {
    return generateCustomSerpentinePath(indices, pattern, screenWidth, screenHeight, runLength || 4);
  }

  return [...indices].sort((indexA, indexB) => {
    const a = getCoords(indexA);
    const b = getCoords(indexB);

    switch (pattern) {
      case 'serpentine-horizontal':
        if (a.y !== b.y) return a.y - b.y;
        return a.y % 2 === 0 ? a.x - b.x : b.x - a.x;
      case 'serpentine-horizontal-start-right':
        if (a.y !== b.y) return a.y - b.y;
        return a.y % 2 === 0 ? b.x - a.x : a.x - b.x;
      case 'serpentine-horizontal-reverse':
        if (a.y !== b.y) return b.y - a.y;
        return (screenHeight - 1 - a.y) % 2 === 0 ? a.x - b.x : b.x - a.x;
      case 'serpentine-vertical':
         if (a.x !== b.x) return a.x - b.x;
         return a.x % 2 === 0 ? a.y - b.y : b.y - a.y;
      case 'serpentine-vertical-reverse':
        if (a.x !== b.x) return b.x - a.x;
        return (screenWidth - 1 - a.x) % 2 === 0 ? a.y - b.y : b.y - a.y;
      case 'serpentine-vertical-bottom-start':
        if (a.x !== b.x) return a.x - b.x;
        return a.x % 2 === 0 ? b.y - a.y : a.y - b.y;
      case 'serpentine-vertical-bottom-main':
        const columnPairA = Math.floor(a.x / 2);
        const columnPairB = Math.floor(b.x / 2);
        if (columnPairA !== columnPairB) {
            return columnPairA - columnPairB;
        }
        if (a.x % 2 === 0) {
            return b.y - a.y;
        } else {
            return a.y - b.y;
        }
      case 'serpentine-vertical-reverse-bottom-start':
        if (a.x !== b.x) return b.x - a.x;
        return (screenWidth - 1 - a.x) % 2 === 0 ? b.y - a.y : a.y - b.y;
      case 'left-right':
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      case 'right-to-left':
        if (a.y !== b.y) return a.y - b.y;
        return b.x - a.x;
      case 'top-bottom':
        if (a.x !== b.x) return a.x - b.x;
        return a.y - b.y;
      case 'bottom-to-top':
        if (a.x !== b.x) return a.x - b.x;
        return b.y - a.y;
      default:
        return a.y - b.y || a.x - b.x;
    }
  });
}

const CUSTOM_SERPENTINE_PATTERNS: WiringPattern[] = [
  'custom-serpentine-h',
  'custom-serpentine-h-start-right',
  'custom-serpentine-v',
  'custom-serpentine-v-start-bottom',
];

function isCustomSerpentine(pattern: WiringPattern): boolean {
  return CUSTOM_SERPENTINE_PATTERNS.includes(pattern);
}

// Generates a local serpentine path anchored to the clicked tile.
// For H patterns: the clicked tile is the first tile of the first row-run;
// the column range is derived from startCol and runLength.
// For V patterns: the clicked tile starts the first column-run;
// the row range is derived from startRow and runLength.
function generateManualSerpentinePath(
  startGridIndex: number,
  activeTileIndices: number[],
  pattern: WiringPattern,
  screenWidth: number,
  screenHeight: number,
  runLength: number,
): number[] {
  const indexSet = new Set(activeTileIndices);
  const result: number[] = [];
  const startRow = Math.floor(startGridIndex / screenWidth);
  const startCol = startGridIndex % screenWidth;

  if (pattern === 'custom-serpentine-h-start-right') {
    const colEnd = startCol;
    const colStart = startCol - runLength + 1;
    for (let rowOff = 0; startRow + rowOff < screenHeight; rowOff++) {
      const y = startRow + rowOff;
      if (rowOff % 2 === 0) {
        for (let x = colEnd; x >= colStart; x--) {
          if (x >= 0 && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      } else {
        for (let x = colStart; x <= colEnd; x++) {
          if (x >= 0 && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      }
    }
  } else if (pattern === 'custom-serpentine-h') {
    const colStart = startCol;
    const colEnd = startCol + runLength - 1;
    for (let rowOff = 0; startRow + rowOff < screenHeight; rowOff++) {
      const y = startRow + rowOff;
      if (rowOff % 2 === 0) {
        for (let x = colStart; x <= colEnd; x++) {
          if (x < screenWidth && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      } else {
        for (let x = colEnd; x >= colStart; x--) {
          if (x < screenWidth && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      }
    }
  } else if (pattern === 'custom-serpentine-v-start-bottom') {
    const rowEnd = startRow;
    const rowStart = startRow - runLength + 1;
    for (let colOff = 0; startCol + colOff < screenWidth; colOff++) {
      const x = startCol + colOff;
      if (colOff % 2 === 0) {
        for (let y = rowEnd; y >= rowStart; y--) {
          if (y >= 0 && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      } else {
        for (let y = rowStart; y <= rowEnd; y++) {
          if (y >= 0 && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      }
    }
  } else if (pattern === 'custom-serpentine-v') {
    const rowStart = startRow;
    const rowEnd = startRow + runLength - 1;
    for (let colOff = 0; startCol + colOff < screenWidth; colOff++) {
      const x = startCol + colOff;
      if (colOff % 2 === 0) {
        for (let y = rowStart; y <= rowEnd; y++) {
          if (y < screenHeight && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      } else {
        for (let y = rowEnd; y >= rowStart; y--) {
          if (y < screenHeight && indexSet.has(y * screenWidth + x)) result.push(y * screenWidth + x);
        }
      }
    }
  }

  return result;
}

function generateCustomSerpentinePath(
  indices: number[],
  pattern: WiringPattern,
  screenWidth: number,
  screenHeight: number,
  runLength: number,
): number[] {
  const indexSet = new Set(indices);
  const result: number[] = [];
  const isHorizontal = pattern === 'custom-serpentine-h' || pattern === 'custom-serpentine-h-start-right';
  const startRight = pattern === 'custom-serpentine-h-start-right';
  const startBottom = pattern === 'custom-serpentine-v-start-bottom';

  if (isHorizontal) {
    for (let blockStart = 0; blockStart < screenWidth; blockStart += runLength) {
      const blockEnd = Math.min(blockStart + runLength - 1, screenWidth - 1);
      for (let y = 0; y < screenHeight; y++) {
        const goRight = (y % 2 === 0) !== startRight;
        if (goRight) {
          for (let x = blockStart; x <= blockEnd; x++) {
            const idx = y * screenWidth + x;
            if (indexSet.has(idx)) result.push(idx);
          }
        } else {
          for (let x = blockEnd; x >= blockStart; x--) {
            const idx = y * screenWidth + x;
            if (indexSet.has(idx)) result.push(idx);
          }
        }
      }
    }
  } else {
    // Vertical serpentine: bands of `runLength` rows, snaking column-by-column within each band.
    // Bands are anchored to the actual active-tile extents so deleted edge rows don't shrink runs.
    let minActiveRow = screenHeight;
    let maxActiveRow = -1;
    for (const idx of indexSet) {
      const r = Math.floor(idx / screenWidth);
      if (r < minActiveRow) minActiveRow = r;
      if (r > maxActiveRow) maxActiveRow = r;
    }
    if (maxActiveRow < 0) return result;

    if (startBottom) {
      // Anchor from the bottom: first band covers [maxActiveRow-runLength+1 .. maxActiveRow]
      for (let bandEnd = maxActiveRow; bandEnd >= minActiveRow; bandEnd -= runLength) {
        const bandStart = Math.max(minActiveRow, bandEnd - runLength + 1);
        for (let x = 0; x < screenWidth; x++) {
          if (x % 2 === 0) {
            for (let y = bandEnd; y >= bandStart; y--) {
              const idx = y * screenWidth + x;
              if (indexSet.has(idx)) result.push(idx);
            }
          } else {
            for (let y = bandStart; y <= bandEnd; y++) {
              const idx = y * screenWidth + x;
              if (indexSet.has(idx)) result.push(idx);
            }
          }
        }
      }
    } else {
      // Anchor from the top: first band covers [minActiveRow .. minActiveRow+runLength-1]
      for (let bandStart = minActiveRow; bandStart <= maxActiveRow; bandStart += runLength) {
        const bandEnd = Math.min(maxActiveRow, bandStart + runLength - 1);
        for (let x = 0; x < screenWidth; x++) {
          if (x % 2 === 0) {
            for (let y = bandStart; y <= bandEnd; y++) {
              const idx = y * screenWidth + x;
              if (indexSet.has(idx)) result.push(idx);
            }
          } else {
            for (let y = bandEnd; y >= bandStart; y--) {
              const idx = y * screenWidth + x;
              if (indexSet.has(idx)) result.push(idx);
            }
          }
        }
      }
    }
  }

  return result;
}

function applyDataWiring(
    activeTilesPath: { tile: WiringInfo; index: number; }[],
    wiringPortConfig: string,
    dataPortStartNumber: number,
    processorType: ProcessorType,
    groupStartCounter: number,
): number {
    if (activeTilesPath.length === 0) return groupStartCounter;
    
    const subgroupSize = parseInt(wiringPortConfig.trim(), 10) || 4;
    let groupCounter = groupStartCounter;

    let currentGroupInfo: { main: string, backup: string } | null = null;


    activeTilesPath.forEach(({ tile: currentTileInfo }, pathIndex) => {
        const isFirstInGroup = pathIndex % subgroupSize === 0;
        
        if (isFirstInGroup) {
            groupCounter++;
            
            if (processorType === 'Novastar') {
                const portNumber = String(groupCounter);
                currentTileInfo.dataLabel = portNumber;
                currentGroupInfo = { main: portNumber, backup: `${portNumber}B` };
            } else if (processorType === 'Helios') {
                const portNumber = (groupCounter - 1) % 12 + 1;
                const mainLabel = `${portNumber}M`;
                const backupLabel = `${portNumber}B`;
                currentTileInfo.dataLabel = mainLabel;
                currentGroupInfo = { main: mainLabel, backup: backupLabel };
            } else { // Brompton
                const effectiveGroupIndex = (groupCounter - 1) % 20; // Wraps around every 20 ports
                
                let mainUniverse: string;
                let backupUniverse: string;
                let universePortNumber: number;
                
                if (effectiveGroupIndex < 10) {
                    mainUniverse = 'A';
                    backupUniverse = 'B';
                    universePortNumber = (effectiveGroupIndex % 10) + 1;
                } else {
                    mainUniverse = 'C';
                    backupUniverse = 'D';
                    universePortNumber = (effectiveGroupIndex % 10) + 1;
                }
                
                currentGroupInfo = {
                    main: `${mainUniverse}${universePortNumber}`,
                    backup: `${backupUniverse}${universePortNumber}`
                };
                
                currentTileInfo.dataLabel = currentGroupInfo.main;
            }

        } else {
            currentTileInfo.dataLabel = "";
        }

        const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
        if (isLastTileInPath) {
            currentTileInfo.nextTile = null;
        } else {
            const nextTileInfo = activeTilesPath[pathIndex + 1].tile;
            currentTileInfo.nextTile = { x: nextTileInfo.x, y: nextTileInfo.y };
        }

        const isEndOfGroup = (pathIndex + 1) % subgroupSize === 0;
        
        const endOfChain = isEndOfGroup || isLastTileInPath;

        if (currentGroupInfo && endOfChain) {
            currentTileInfo.backupLabel = currentGroupInfo.backup;
            currentTileInfo.nextTile = null;
        }
    });

    return groupCounter;
}


function applyPowerWiring(
    activeTilesPath: { tile: WiringInfo; index: number; }[],
    tilesPerPowerString: string,
    counters: { powerCounter: number; powerGroupCounter: number; }
) {
    if (activeTilesPath.length === 0) return;
    
    const tilesPerPowerCircuit = parseInt(tilesPerPowerString.trim(), 10) || 20;

    activeTilesPath.forEach(({ tile: currentTileInfo }, pathIndex) => {
      counters.powerGroupCounter++;
      if (counters.powerGroupCounter > tilesPerPowerCircuit) {
        counters.powerCounter++;
        counters.powerGroupCounter = 1;
      }

      if (counters.powerGroupCounter === 1) {
        currentTileInfo.powerPortLabel = `P${counters.powerCounter}`;
      }

      const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
      const isEndOfPowerGroup = counters.powerGroupCounter === tilesPerPowerCircuit;

      if (isLastTileInPath || isEndOfPowerGroup) {
        currentTileInfo.nextPowerTile = null;
      } else {
        const nextTileInfo = activeTilesPath[pathIndex + 1].tile;
        currentTileInfo.nextPowerTile = { x: nextTileInfo.x, y: nextTileInfo.y };
      }
    });
}

export function applyManualPowerWiring(
    tiles: Tile[],
    startTileId: number,
    numTiles: number,
    powerPattern: WiringPattern,
    screenWidth: number,
    screenHeight: number,
    portLabel: string,
    runLength?: number,
): Tile[] {
    const newTiles = tiles.map(t => ({ ...t }));
    const startTileGridIndex = newTiles.findIndex(t => t.id === startTileId);
    if (startTileGridIndex === -1) return tiles; 

    // If numTiles is 0 or portLabel is empty, it means we are clearing the circuit
    const circuitToClear = newTiles[startTileGridIndex].powerCircuit;
    if ((numTiles === 0 || !portLabel) && circuitToClear) {
      const activeTileIndices = tiles.map((t, i) => !t.deleted ? i : -1).filter(i => i !== -1);
      const pathOrder = getPathOrder(activeTileIndices, circuitToClear.pattern, screenWidth, screenHeight);
      const startTilePathIndex = pathOrder.indexOf(startTileGridIndex);
      
      if(startTilePathIndex !== -1) {
        for (let i = 0; i < circuitToClear.tileCount; i++) {
          const currentPathIndex = startTilePathIndex + i;
          if (currentPathIndex < pathOrder.length) {
            const tileToClearIndex = pathOrder[currentPathIndex];
            newTiles[tileToClearIndex].powerPortLabel = undefined;
            newTiles[tileToClearIndex].powerCircuit = undefined;
          }
        }
      }
      return newTiles;
    }

    const activeTileIndices = newTiles.map((t, i) => !t.deleted ? i : -1).filter(i => i !== -1);
    const pathOrder = isCustomSerpentine(powerPattern)
      ? generateManualSerpentinePath(startTileGridIndex, activeTileIndices, powerPattern, screenWidth, screenHeight, runLength || 4)
      : getPathOrder(activeTileIndices, powerPattern, screenWidth, screenHeight, runLength);
    const startTilePathIndex = isCustomSerpentine(powerPattern) ? 0 : pathOrder.indexOf(startTileGridIndex);
    if (startTilePathIndex === -1) return tiles; 

    const circuitTilesIndices: number[] = [];
    for (let i = 0; i < numTiles; i++) {
        const currentPathIndex = startTilePathIndex + i;
        if (currentPathIndex < pathOrder.length) {
            circuitTilesIndices.push(pathOrder[currentPathIndex]);
        }
    }
    
    // Clear old labels from tiles that are about to be used, if they were part of another manual circuit
    circuitTilesIndices.forEach(tileIndex => {
        if (newTiles[tileIndex]?.powerCircuit) {
            // It's a start of another circuit, need to clear that entire old circuit
            const oldCircuit = newTiles[tileIndex].powerCircuit!;
            const oldPathOrder = getPathOrder(activeTileIndices, oldCircuit.pattern, screenWidth, screenHeight, oldCircuit.runLength);
            const oldStartIdx = oldPathOrder.indexOf(tileIndex);
            if (oldStartIdx !== -1) {
                for (let i = 0; i < oldCircuit.tileCount; i++) {
                    const idxToClear = oldPathOrder[oldStartIdx + i];
                    if (idxToClear !== undefined) {
                        newTiles[idxToClear].powerPortLabel = undefined;
                        newTiles[idxToClear].powerCircuit = undefined;
                    }
                }
            }
        }
        newTiles[tileIndex].powerPortLabel = undefined;
        newTiles[tileIndex].powerCircuit = undefined;
    });
    
    if (circuitTilesIndices.length > 0) {
        newTiles[circuitTilesIndices[0]].powerPortLabel = portLabel;
        newTiles[circuitTilesIndices[0]].powerCircuit = {
            label: portLabel,
            tileCount: numTiles,
            pattern: powerPattern,
            runLength: runLength || 0,
        };
    }
    
    return newTiles;
}

export function applyManualDataWiring(
    tiles: Tile[],
    startTileId: number,
    numTiles: number,
    dataPattern: WiringPattern,
    screenWidth: number,
    screenHeight: number,
    mainLabel: string,
    backupLabel: string,
    runLength?: number,
): Tile[] {
    const newTiles = tiles.map(t => ({ ...t }));
    const startTileGridIndex = newTiles.findIndex(t => t.id === startTileId);
    if (startTileGridIndex === -1) return tiles; 

    const circuitToClear = newTiles[startTileGridIndex].dataCircuit;
    if ((numTiles === 0 || !mainLabel) && circuitToClear) {
        const activeTileIndices = tiles.map((t, i) => !t.deleted ? i : -1).filter(i => i !== -1);
        const pathOrder = getPathOrder(activeTileIndices, circuitToClear.pattern, screenWidth, screenHeight);
        const startTilePathIndex = pathOrder.indexOf(startTileGridIndex);
        
        if(startTilePathIndex !== -1) {
            for (let i = 0; i < circuitToClear.tileCount; i++) {
                const currentPathIndex = startTilePathIndex + i;
                if (currentPathIndex < pathOrder.length) {
                    const tileToClearIndex = pathOrder[currentPathIndex];
                    newTiles[tileToClearIndex].dataCircuit = undefined; // Main trigger for manual data wiring
                }
            }
        }
        return newTiles;
    }

    const activeTileIndices = newTiles.map((t, i) => !t.deleted ? i : -1).filter(i => i !== -1);
    const pathOrder = isCustomSerpentine(dataPattern)
      ? generateManualSerpentinePath(startTileGridIndex, activeTileIndices, dataPattern, screenWidth, screenHeight, runLength || 4)
      : getPathOrder(activeTileIndices, dataPattern, screenWidth, screenHeight, runLength);
    const startTilePathIndex = isCustomSerpentine(dataPattern) ? 0 : pathOrder.indexOf(startTileGridIndex);
    if (startTilePathIndex === -1) return tiles; 

    const circuitTilesIndices: number[] = [];
    for (let i = 0; i < numTiles; i++) {
        const currentPathIndex = startTilePathIndex + i;
        if (currentPathIndex < pathOrder.length) {
            circuitTilesIndices.push(pathOrder[currentPathIndex]);
        }
    }
    
    circuitTilesIndices.forEach(tileIndex => {
        if (newTiles[tileIndex]?.dataCircuit) {
            const oldCircuit = newTiles[tileIndex].dataCircuit!;
            const oldPathOrder = getPathOrder(activeTileIndices, oldCircuit.pattern, screenWidth, screenHeight, oldCircuit.runLength);
            const oldStartIdx = oldPathOrder.indexOf(tileIndex);
            if (oldStartIdx !== -1) {
                for (let i = 0; i < oldCircuit.tileCount; i++) {
                    const idxToClear = oldPathOrder[oldStartIdx + i];
                    if (idxToClear !== undefined) {
                        newTiles[idxToClear].dataCircuit = undefined;
                    }
                }
            }
        }
        newTiles[tileIndex].dataCircuit = undefined;
    });
    
    if (circuitTilesIndices.length > 0) {
        newTiles[circuitTilesIndices[0]].dataCircuit = {
            mainLabel: mainLabel,
            backupLabel: backupLabel,
            tileCount: numTiles,
            pattern: dataPattern,
            runLength: runLength || 0,
        };
    }
    
    return newTiles;
}


interface GetWiringDataArgs {
    dimensions: Dimensions;
    tiles: Tile[];
    wiringPortConfig: string;
    dataPortStartNumber: number;
    tilesPerPowerString: string;
    wiringPattern: WiringPattern;
    powerWiringPattern: WiringPattern;
    processorType: ProcessorType;
    rasterMapConfig?: RasterMapConfig | null;
    topHalfTile: boolean;
    bottomHalfTile: boolean;
    leftHalfTile: boolean;
    rightHalfTile: boolean;
    screenId: string;
}

export function getWiringData({
  dimensions,
  tiles,
  wiringPortConfig,
  dataPortStartNumber,
  tilesPerPowerString,
  wiringPattern,
  powerWiringPattern,
  processorType,
  rasterMapConfig,
  topHalfTile,
  bottomHalfTile,
  screenId
}: GetWiringDataArgs): WiringInfo[] {
  const { screenWidth, screenHeight, tileWidth, tileHeight } = dimensions;
  if (!tiles || tiles.length === 0) {
    return [];
  }

  const allTilesData: WiringInfo[] = tiles.map((tile, index) => ({
    x: index % screenWidth,
    y: Math.floor(index / screenWidth),
    dataLabel: "",
    powerPortLabel: tile.powerPortLabel || "", // Preserve manual labels
    backupLabel: "",
    isDeleted: tile.deleted,
    nextTile: null,
    nextPowerTile: null,
    sliceOffsetLabel: "",
  }));

  const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);

  // DATA WIRING
  if (wiringPattern === 'manual') {
      // Group all tiles carrying a dataCircuit by mainLabel, then find the true
      // start (earliest in pathOrder) to avoid rendering a label on every tile
      // when the circuit flows in reverse grid-index order.
      type DataCircuitEntry = { gridIndices: number[]; circuit: NonNullable<Tile['dataCircuit']> };
      const dataCircuitGroups = new Map<string, DataCircuitEntry>();
      tiles.forEach((tile, gridIndex) => {
          if (tile.deleted || !tile.dataCircuit) return;
          const { mainLabel } = tile.dataCircuit;
          if (!dataCircuitGroups.has(mainLabel)) {
              dataCircuitGroups.set(mainLabel, { gridIndices: [], circuit: tile.dataCircuit });
          }
          dataCircuitGroups.get(mainLabel)!.gridIndices.push(gridIndex);
      });

      dataCircuitGroups.forEach(({ gridIndices, circuit }) => {
          const { tileCount, pattern, mainLabel, backupLabel, runLength: circuitRunLength } = circuit;
          if (tileCount === 0) return;

          const startGridIdx = gridIndices[0];
          const pathOrder = isCustomSerpentine(pattern)
            ? generateManualSerpentinePath(startGridIdx, activeTileIndices, pattern, screenWidth, screenHeight, circuitRunLength || 4)
            : getPathOrder(activeTileIndices, pattern, screenWidth, screenHeight, circuitRunLength);

          let trueStartPathIndex: number;
          if (isCustomSerpentine(pattern)) {
            trueStartPathIndex = 0;
          } else {
            trueStartPathIndex = Infinity;
            gridIndices.forEach(idx => {
              const pos = pathOrder.indexOf(idx);
              if (pos !== -1 && pos < trueStartPathIndex) trueStartPathIndex = pos;
            });
            if (trueStartPathIndex === Infinity) return;
          }

          const trueStartGridIndex = pathOrder[trueStartPathIndex];
          allTilesData[trueStartGridIndex].dataLabel = mainLabel;

          for (let i = 0; i < tileCount; i++) {
              const currentPathIndex = trueStartPathIndex + i;
              if (currentPathIndex >= pathOrder.length) break;

              const currentGridIndex = pathOrder[currentPathIndex];
              const isLastInCircuit = i === tileCount - 1;
              const isLastInPath = currentPathIndex === pathOrder.length - 1;

              if (isLastInCircuit || isLastInPath) {
                  allTilesData[currentGridIndex].nextTile = null;
                  allTilesData[currentGridIndex].backupLabel = backupLabel;
              } else {
                  const nextGridIndex = pathOrder[currentPathIndex + 1];
                  const nextTileInfo = allTilesData[nextGridIndex];
                  allTilesData[currentGridIndex].nextTile = { x: nextTileInfo.x, y: nextTileInfo.y };
                  allTilesData[currentGridIndex].backupLabel = "";
              }
          }
      });
  } else if (rasterMapConfig && rasterMapConfig.slices.length > 0 && rasterMapConfig.outputWidth > 0 && rasterMapConfig.outputHeight > 0) {
    const currentScreenArrangement = rasterMapConfig.screenArrangement.find(s => s.screenId === screenId);
    if (currentScreenArrangement) {
        let groupCounter = dataPortStartNumber - 1;
        rasterMapConfig.slices.forEach(slice => {
            const sliceTiles: number[] = [];
            
            activeTileIndices.forEach(index => {
                const x = index % screenWidth;
                const y = Math.floor(index / screenWidth);

                const {minX, minY} = currentScreenArrangement.activeBounds;
                let tileContentY = 0;
                for (let i = minY; i < y; i++) {
                    const isTopRow = topHalfTile && i === 0;
                    const isBottomRow = bottomHalfTile && i === screenHeight - 1;
                    tileContentY += (isTopRow || isBottomRow) ? tileHeight / 2 : tileHeight;
                }
                const tileContentX = (x - minX) * tileWidth;

                const absoluteContentX = tileContentX + currentScreenArrangement.x;
                const absoluteContentY = tileContentY + currentScreenArrangement.y;
                
                if (
                    absoluteContentX >= slice.x &&
                    absoluteContentX < slice.x + slice.width &&
                    absoluteContentY >= slice.y &&
                    absoluteContentY < slice.y + slice.height
                ) {
                    sliceTiles.push(index);
                }
            });

            if (sliceTiles.length > 0) {
                const pathOrder = getPathOrder(sliceTiles, wiringPattern, screenWidth, screenHeight);
                const tilesPath = pathOrder.map(index => ({ tile: allTilesData[index], index }));
                groupCounter = applyDataWiring(tilesPath, wiringPortConfig, dataPortStartNumber, processorType, groupCounter);
            }
        });
    }
  } else {
    const dataPathOrder = getPathOrder(activeTileIndices, wiringPattern, screenWidth, screenHeight);
    const dataTilesPath = dataPathOrder.map(index => ({ tile: allTilesData[index], index }));
    applyDataWiring(dataTilesPath, wiringPortConfig, dataPortStartNumber, processorType, dataPortStartNumber - 1);
  }
  
  // POWER WIRING
  if (powerWiringPattern === 'manual') {
      type PowerCircuitEntry = { gridIndices: number[]; circuit: NonNullable<Tile['powerCircuit']> };
      const powerCircuitGroups = new Map<string, PowerCircuitEntry>();
      tiles.forEach((tile, gridIndex) => {
          if (tile.deleted || !tile.powerCircuit) return;
          const { label } = tile.powerCircuit;
          if (!powerCircuitGroups.has(label)) {
              powerCircuitGroups.set(label, { gridIndices: [], circuit: tile.powerCircuit });
          }
          powerCircuitGroups.get(label)!.gridIndices.push(gridIndex);
      });

      powerCircuitGroups.forEach(({ gridIndices, circuit }) => {
          const { tileCount, pattern, runLength: circuitRunLength } = circuit;
          if (tileCount === 0) return;

          const startGridIdx = gridIndices[0];
          const pathOrder = isCustomSerpentine(pattern)
            ? generateManualSerpentinePath(startGridIdx, activeTileIndices, pattern, screenWidth, screenHeight, circuitRunLength || 4)
            : getPathOrder(activeTileIndices, pattern, screenWidth, screenHeight, circuitRunLength);

          let trueStartPathIndex: number;
          if (isCustomSerpentine(pattern)) {
            trueStartPathIndex = 0;
          } else {
            trueStartPathIndex = Infinity;
            gridIndices.forEach(idx => {
              const pos = pathOrder.indexOf(idx);
              if (pos !== -1 && pos < trueStartPathIndex) trueStartPathIndex = pos;
            });
            if (trueStartPathIndex === Infinity) return;
          }

          for (let i = 0; i < tileCount; i++) {
              const currentPathIndex = trueStartPathIndex + i;
              if (currentPathIndex >= pathOrder.length) break;

              const currentGridIndex = pathOrder[currentPathIndex];
              const isLastInCircuit = i === tileCount - 1;
              const isLastInPath = currentPathIndex === pathOrder.length - 1;

              if (isLastInCircuit || isLastInPath) {
                  allTilesData[currentGridIndex].nextPowerTile = null;
              } else {
                  const nextGridIndex = pathOrder[currentPathIndex + 1];
                  const nextTileInfo = allTilesData[nextGridIndex];
                  allTilesData[currentGridIndex].nextPowerTile = { x: nextTileInfo.x, y: nextTileInfo.y };
              }
          }
      });
  } else {
    // Automatic power wiring
    allTilesData.forEach(t => t.powerPortLabel = '');
    const powerPathOrder = getPathOrder(activeTileIndices, powerWiringPattern, screenWidth, screenHeight);
    const powerTilesPath = powerPathOrder.map(index => ({ tile: allTilesData[index], index }));
    const powerCounters = { powerCounter: 1, powerGroupCounter: 0 };
    applyPowerWiring(powerTilesPath, tilesPerPowerString, powerCounters);
  }

  return allTilesData;
}
