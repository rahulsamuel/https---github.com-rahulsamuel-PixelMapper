

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
  sliceOffsetLabel?: string;
}

export function getPathOrder(indices: number[], pattern: WiringPattern, screenWidth: number, screenHeight: number): number[] {
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
    wiringPortConfig: string
) {
    if (activeTilesPath.length === 0) return;
    
    const subgroupSize = parseInt(wiringPortConfig.trim(), 10) || 4;
    let groupCounter = 0;

    let currentGroupInfo: { main: string, backup: string } | null = null;

    activeTilesPath.forEach(({ tile: currentTileInfo }, pathIndex) => {
        const isFirstInGroup = pathIndex % subgroupSize === 0;
        
        if (isFirstInGroup) {
            groupCounter++;
            
            const effectiveGroupIndex = (groupCounter - 1) % 20; // Wraps around every 20 ports
            
            let mainUniverse: string;
            let backupUniverse: string;
            let universePortNumber: number;

            if (effectiveGroupIndex < 10) {
                // Ports 1-10, 21-30, etc.
                mainUniverse = 'A';
                backupUniverse = 'B';
                universePortNumber = (effectiveGroupIndex % 10) + 1;
            } else {
                // Ports 11-20, 31-40, etc.
                mainUniverse = 'C';
                backupUniverse = 'D';
                universePortNumber = (effectiveGroupIndex % 10) + 1;
            }
            
            currentGroupInfo = {
                main: `${mainUniverse}${universePortNumber}`,
                backup: `${backupUniverse}${universePortNumber}`
            };
            
            currentTileInfo.dataLabel = currentGroupInfo.main;
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
        if (currentGroupInfo && (isEndOfGroup || isLastTileInPath)) {
            currentTileInfo.backupLabel = currentGroupInfo.backup;
            currentTileInfo.nextTile = null;
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
    sliceOffsetLabel: "",
  }));

  const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);

  if (rasterMapConfig && activeBounds && rasterMapConfig.slices.length > 1 && rasterMapConfig.outputWidth > 0 && rasterMapConfig.outputHeight > 0) {
    const { outputWidth: sliceWidth, outputHeight: sliceHeight, rasterOffset } = rasterMapConfig;
    
    const tilesBySlice = new Map<string, number[]>();
    activeTileIndices.forEach(index => {
      const x = index % screenWidth;
      const y = Math.floor(index / screenWidth);
      if (x < activeBounds.minX || x > activeBounds.maxX || y < activeBounds.minY || y > activeBounds.maxY) return;
      
      const tileContentX = (x - activeBounds.minX) * tileWidth;
      const tileContentY = (y - activeBounds.minY) * tileHeight;
      
      const absoluteContentX = tileContentX + rasterOffset.x;
      const absoluteContentY = tileContentY + rasterOffset.y;

      const sliceCol = Math.floor(absoluteContentX / sliceWidth);
      const sliceRow = Math.floor(absoluteContentY / sliceHeight);
      const sliceKey = `${sliceRow}-${col}`;
      
      if (!tilesBySlice.has(sliceKey)) tilesBySlice.set(sliceKey, []);
      tilesBySlice.get(sliceKey)!.push(index);
    });

    const sortedSliceKeys = Array.from(tilesBySlice.keys()).sort((a, b) => {
        const [rowA, colA] = a.split('-').map(Number);
        const [rowB, colB] = b.split('-').map(Number);
        if (rowA !== rowB) return rowA - rowB;
        return colA - colB;
    });
    
    for (const sliceKey of sortedSliceKeys) {
        const sliceIndices = tilesBySlice.get(sliceKey)!;
        
        const dataPathOrder = getPathOrder(sliceIndices, wiringPattern, screenWidth, screenHeight);
        const dataTilesPath = dataPathOrder.map(index => ({ tile: allTilesData[index], index }));
        applyDataWiring(dataTilesPath, wiringPortConfig);
        
        const currentSlice = rasterMapConfig.slices.find(s => s.key === sliceKey);
        if (currentSlice && dataPathOrder.length > 0) {
            const firstTileIndex = dataPathOrder[0];
            allTilesData[firstTileIndex].sliceOffsetLabel = `(${currentSlice.x},${currentSlice.y})`;
        }
    }
  } else {
    const dataPathOrder = getPathOrder(activeTileIndices, wiringPattern, screenWidth, screenHeight);
    const dataTilesPath = dataPathOrder.map(index => ({ tile: allTilesData[index], index }));
    applyDataWiring(dataTilesPath, wiringPortConfig);
  }
  
  const powerPathOrder = getPathOrder(activeTileIndices, powerWiringPattern, screenWidth, screenHeight);
  const powerTilesPath = powerPathOrder.map(index => ({ tile: allTilesData[index], index }));
  const powerCounters = { powerCounter: 1, powerGroupCounter: 0 };
  applyPowerWiring(powerTilesPath, tilesPerPowerString, powerCounters);

  return allTilesData;
}
