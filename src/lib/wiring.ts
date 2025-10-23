

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

export type WiringPattern = 'serpentine-horizontal' | 'serpentine-vertical' | 'serpentine-horizontal-reverse' | 'serpentine-vertical-reverse' | 'left-right' | 'top-bottom' | 'bottom-to-top' | 'serpentine-vertical-bottom-start' | 'serpentine-vertical-reverse-bottom-start';
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
      case 'serpentine-vertical-reverse':
        if (a.x !== b.x) return b.x - a.x;
        return (screenWidth - 1 - a.x) % 2 === 0 ? a.y - b.y : b.y - a.y;
      case 'serpentine-vertical-bottom-start':
        if (a.x !== b.x) return a.x - b.x;
        return a.x % 2 === 0 ? b.y - a.y : a.y - b.y;
      case 'serpentine-vertical-reverse-bottom-start':
        if (a.x !== b.x) return b.x - a.x;
        return (screenWidth - 1 - a.x) % 2 === 0 ? b.y - a.y : a.y - b.y;
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
    powerPortLabel: "",
    backupLabel: "",
    isDeleted: tile.deleted,
    nextTile: null,
    nextPowerTile: null,
    sliceOffsetLabel: "",
  }));

  const activeTileIndices = tiles.map((_, i) => i).filter(i => !tiles[i].deleted);

  if (rasterMapConfig && rasterMapConfig.slices.length > 0 && rasterMapConfig.outputWidth > 0 && rasterMapConfig.outputHeight > 0) {
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
  
  const powerPathOrder = getPathOrder(activeTileIndices, powerWiringPattern, screenWidth, screenHeight);
  const powerTilesPath = powerPathOrder.map(index => ({ tile: allTilesData[index], index }));
  const powerCounters = { powerCounter: 1, powerGroupCounter: 0 };
  applyPowerWiring(powerTilesPath, tilesPerPowerString, powerCounters);

  return allTilesData;
}
