
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

export type WiringPattern = 'serpentine-horizontal' | 'serpentine-vertical' | 'serpentine-horizontal-reverse' | 'left-right' | 'top-bottom' | 'bottom-to-top';

interface WiringInfo {
  x: number;
  y: number;
  dataLabel: string;
  powerPortLabel: string;
  backupLabel: string;
  isDeleted: boolean;
  nextTile: { x: number; y: number } | null;
  nextPowerTile: { x: number; y: number } | null;
}

const UNIVERSE_LETTERS = [
    'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const getUniverseLabel = (n: number): string => {
    if (n >= 0 && n < UNIVERSE_LETTERS.length) {
        return UNIVERSE_LETTERS[n];
    }
    return `Universe ${n + 1}`;
};

function getPathOrder(indices: number[], pattern: WiringPattern, screenWidth: number, screenHeight: number): number[] {
  const getCoords = (index: number) => ({
    x: index % screenWidth,
    y: Math.floor(index / screenWidth),
  });

  return [...indices].sort((indexA, indexB) => {
    const a = getCoords(indexA);
    const b = getCoords(indexB);

    switch (pattern) {
      case 'serpentine-horizontal':
        if (a.y !== b.y) return a.y - b.y;
        return a.y % 2 === 0 ? a.x - b.x : b.x - a.x;
      case 'serpentine-horizontal-reverse':
        if (a.y !== b.y) return b.y - a.y;
        return (screenHeight - 1 - a.y) % 2 === 0 ? a.x - b.x : b.x - a.x;
      case 'serpentine-vertical':
        if (a.x !== b.x) return a.x - b.x;
        return a.x % 2 === 0 ? a.y - b.y : b.y - a.y;
      case 'left-right':
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
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

function applyDataWiring(
    activeTilesPath: { tile: WiringInfo; index: number; }[],
    wiringPortConfig: string,
    counters: { groupNumOverall: number; },
    sliceUniverseIndex: number | null = null
) {
    if (activeTilesPath.length === 0) return;
    
    const subgroupSize = parseInt(wiringPortConfig.trim(), 10) || 4;
    const subgroupsPerUniverse = 10;
      
    activeTilesPath.forEach(({ tile: currentTileInfo }, pathIndex) => {
      // Data
      const isFirstInGroup = pathIndex % subgroupSize === 0;
      if (isFirstInGroup) {
        const universeIndex = sliceUniverseIndex ?? Math.floor(counters.groupNumOverall / subgroupsPerUniverse);
        const subgroupIndexInUniverse = (counters.groupNumOverall % subgroupsPerUniverse) + 1;
        currentTileInfo.dataLabel = `${getUniverseLabel(universeIndex)}${subgroupIndexInUniverse}`;
        counters.groupNumOverall++;
      } else {
        currentTileInfo.dataLabel = "";
      }
      
      // Next Tile Arrow
      const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
      if (isLastTileInPath) {
        currentTileInfo.nextTile = null;
      } else {
        const nextTileInfo = activeTilesPath[pathIndex + 1].tile;
        currentTileInfo.nextTile = { x: nextTileInfo.x, y: nextTileInfo.y };
      }
      
      // Backup
      const isEndOfGroup = (pathIndex + 1) % subgroupSize === 0;
      if (isEndOfGroup || isLastTileInPath) {
        const currentGroupNum = counters.groupNumOverall - 1;
        const mainUniverseIndex = sliceUniverseIndex ?? Math.floor(currentGroupNum / subgroupsPerUniverse);
        
        let backupUniverse: string;
        if (mainUniverseIndex === 0) { 
            backupUniverse = 'B'; 
        } else {
          const backupUniverseIndex = mainUniverseIndex + 1;
          backupUniverse = getUniverseLabel(backupUniverseIndex);
        }
        
        const subgroupIndexInUniverse = (currentGroupNum % subgroupsPerUniverse) + 1;
        currentTileInfo.backupLabel = `${backupUniverse}${subgroupIndexInUniverse}`;
        currentTileInfo.nextTile = null; // No arrow from end of a group
      }
    });
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


interface GetWiringDataArgs {
    dimensions: Dimensions;
    tiles: Tile[];
    wiringPortConfig: string;
    tilesPerPowerString: string;
    wiringPattern: WiringPattern;
    powerWiringPattern: WiringPattern;
    rasterMapConfig?: RasterMapConfig | null;
    activeBounds?: ActiveBounds | null;
}

export function getWiringData({
  dimensions,
  tiles,
  wiringPortConfig,
  tilesPerPowerString,
  wiringPattern,
  powerWiringPattern,
  rasterMapConfig,
  activeBounds
}: GetWiringDataArgs): WiringInfo[] {
  const { screenWidth, screenHeight, tileWidth, tileHeight } = dimensions;
  if (!tiles || tiles.length === 0) {
    return [];
  }

  const allTilesData: WiringInfo[] = tiles.map((tile, index) => ({
    x: index % screenWidth,
    y: Math.floor(index / screenWidth),
    dataLabel: "",
    powerPortLabel: "",
    backupLabel: "",
    isDeleted: tile.deleted,
    nextTile: null,
    nextPowerTile: null,
  }));

  const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);

  // Sliced wiring logic
  if (rasterMapConfig && activeBounds && rasterMapConfig.slices.length > 1 && rasterMapConfig.outputWidth > 0 && rasterMapConfig.outputHeight > 0) {
    const { outputWidth: sliceWidth, outputHeight: sliceHeight } = rasterMapConfig;
    
    const tilesBySlice = new Map<string, number[]>();
    activeTileIndices.forEach(index => {
      const x = index % screenWidth;
      const y = Math.floor(index / screenWidth);
      if (x < activeBounds.minX || x > activeBounds.maxX || y < activeBounds.minY || y > activeBounds.maxY) return;
      
      const tileContentX = (x - activeBounds.minX) * tileWidth;
      const tileContentY = (y - activeBounds.minY) * tileHeight;
      
      const sliceCol = Math.floor(tileContentX / sliceWidth);
      const sliceRow = Math.floor(tileContentY / sliceHeight);
      const sliceKey = `${sliceRow}-${sliceCol}`;
      
      if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
      tilesBySlice.get(sliceKey)!.push(index);
    });

    const powerCounters = { powerCounter: 1, powerGroupCounter: 0 };
    const sortedSliceKeys = Array.from(tilesBySlice.keys()).sort();
    
    let dataUniverseCounter = 0;

    for (const sliceKey of sortedSliceKeys) {
        const sliceIndices = tilesBySlice.get(sliceKey)!;

        // Data Path for slice: each slice gets its own universe sequence
        const dataPathOrder = getPathOrder(sliceIndices, wiringPattern, screenWidth, screenHeight);
        const dataTilesPath = dataPathOrder.map(index => ({ tile: allTilesData[index], index }));
        // Reset subgroup counter for each slice, but use the incrementing universe counter
        applyDataWiring(dataTilesPath, wiringPortConfig, { groupNumOverall: 0 }, dataUniverseCounter);
        dataUniverseCounter++;
        
        // Power Path for slice - power continues across slices
        const powerPathOrder = getPathOrder(sliceIndices, powerWiringPattern, screenWidth, screenHeight);
        const powerTilesPath = powerPathOrder.map(index => ({ tile: allTilesData[index], index }));
        applyPowerWiring(powerTilesPath, tilesPerPowerString, powerCounters);
    }
  } else {
    // Un-sliced logic
    // Data Path
    const dataPathOrder = getPathOrder(activeTileIndices, wiringPattern, screenWidth, screenHeight);
    const dataTilesPath = dataPathOrder.map(index => ({ tile: allTilesData[index], index }));
    const dataCounters = { groupNumOverall: 0 };
    applyDataWiring(dataTilesPath, wiringPortConfig, dataCounters);
    
    // Power Path
    const powerPathOrder = getPathOrder(activeTileIndices, powerWiringPattern, screenWidth, screenHeight);
    const powerTilesPath = powerPathOrder.map(index => ({ tile: allTilesData[index], index }));
    const powerCounters = { powerCounter: 1, powerGroupCounter: 0 };
    applyPowerWiring(powerTilesPath, tilesPerPowerString, powerCounters);
  }

  return allTilesData;
}
