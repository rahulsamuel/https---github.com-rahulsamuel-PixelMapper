
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

export type WiringPattern = 'serpentine-horizontal' | 'serpentine-vertical' | 'left-right' | 'top-bottom';

interface WiringInfo {
  x: number;
  y: number;
  dataLabel: string;
  powerLabel: string;
  backupLabel: string;
  isDeleted: boolean;
  arrowTo: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' | null;
}

const TILES_PER_POWER_CIRCUIT = 20;

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


export function getWiringData(
  dimensions: Dimensions,
  tiles: Tile[],
  wiringPortConfig: string,
  wiringPattern: WiringPattern
): WiringInfo[] {
  const { screenWidth, screenHeight } = dimensions;
  if (!tiles || tiles.length === 0) {
    return [];
  }

  const subgroupSize = parseInt(wiringPortConfig.trim(), 10) || 4;
  const subgroupsPerUniverse = 10;

  const allTilesData: WiringInfo[] = tiles.map((tile, index) => {
    const x = index % screenWidth;
    const y = Math.floor(index / screenWidth);
    return {
      x, y, dataLabel: "", powerLabel: "", backupLabel: "",
      isDeleted: tile.deleted,
      arrowTo: null,
    };
  });

  const activeTilesPath: { tile: WiringInfo; index: number; }[] = [];

  switch (wiringPattern) {
    case 'serpentine-vertical':
      for (let x = 0; x < screenWidth; x++) {
        const colIsReversed = x % 2 !== 0;
        for (let i = 0; i < screenHeight; i++) {
          const y = colIsReversed ? screenHeight - 1 - i : i;
          const tileIndex = y * screenWidth + x;
          const tileData = allTilesData[tileIndex];
          if (tileData && !tileData.isDeleted) {
            activeTilesPath.push({ tile: tileData, index: tileIndex });
          }
        }
      }
      break;
    
    case 'left-right':
      for (let y = 0; y < screenHeight; y++) {
        for (let x = 0; x < screenWidth; x++) {
          const tileIndex = y * screenWidth + x;
          const tileData = allTilesData[tileIndex];
          if (tileData && !tileData.isDeleted) {
            activeTilesPath.push({ tile: tileData, index: tileIndex });
          }
        }
      }
      break;

    case 'top-bottom':
      for (let x = 0; x < screenWidth; x++) {
        for (let y = 0; y < screenHeight; y++) {
          const tileIndex = y * screenWidth + x;
          const tileData = allTilesData[tileIndex];
          if (tileData && !tileData.isDeleted) {
            activeTilesPath.push({ tile: tileData, index: tileIndex });
          }
        }
      }
      break;
      
    case 'serpentine-horizontal':
    default:
      for (let y = 0; y < screenHeight; y++) {
        const rowIsReversed = y % 2 !== 0;
        for (let i = 0; i < screenWidth; i++) {
          const x = rowIsReversed ? screenWidth - 1 - i : i;
          const tileIndex = y * screenWidth + x;
          const tileData = allTilesData[tileIndex];
          if (tileData && !tileData.isDeleted) {
            activeTilesPath.push({ tile: tileData, index: tileIndex });
          }
        }
      }
      break;
  }

  if (activeTilesPath.length === 0) {
    return allTilesData;
  }

  let powerCounter = 1;
  let powerGroupCounter = 0;
  let backupPortCounter = 0;

  activeTilesPath.forEach(({ tile }, pathIndex) => {
    powerGroupCounter++;
    if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
      powerCounter++;
      powerGroupCounter = 1;
    }
    tile.powerLabel = `P${powerCounter}`;

    const indexInGroup = pathIndex % subgroupSize;

    if (indexInGroup === 0) {
      const groupNumOverall = Math.floor(pathIndex / subgroupSize);
      const universeIndex = Math.floor(groupNumOverall / subgroupsPerUniverse);
      const subgroupIndexInUniverse = (groupNumOverall % subgroupsPerUniverse) + 1;
      
      const universe = getUniverseLabel(universeIndex);
      tile.dataLabel = `${universe}${subgroupIndexInUniverse}`;
    } else {
      tile.dataLabel = "";
    }
    
    const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
    const isEndOfGroup = (pathIndex + 1) % subgroupSize === 0;

    if (isEndOfGroup || isLastTileInPath) {
        backupPortCounter++;
        tile.backupLabel = `B${backupPortCounter}`;
        tile.arrowTo = null;
    } else {
      const currentTile = activeTilesPath[pathIndex].tile;
      const nextTile = activeTilesPath[pathIndex + 1].tile;
      const dx = nextTile.x - currentTile.x;
      const dy = nextTile.y - currentTile.y;

      if (dy < 0) { // Moving up
          if (dx < 0) tile.arrowTo = 'up-left';
          else if (dx > 0) tile.arrowTo = 'up-right';
          else tile.arrowTo = 'up';
      } else if (dy > 0) { // Moving down
          if (dx < 0) tile.arrowTo = 'down-left';
          else if (dx > 0) tile.arrowTo = 'down-right';
          else tile.arrowTo = 'down';
      } else { // Moving horizontally
          if (dx < 0) tile.arrowTo = 'left';
          else if (dx > 0) tile.arrowTo = 'right';
          else tile.arrowTo = null;
      }
    }
  });

  return allTilesData;
}
