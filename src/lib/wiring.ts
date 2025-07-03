
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

export type WiringPattern = 'serpentine-horizontal' | 'serpentine-vertical' | 'serpentine-horizontal-reverse' | 'left-right' | 'top-bottom' | 'bottom-to-top';

interface WiringInfo {
  x: number;
  y: number;
  dataLabel: string;
  powerLabel: string;
  backupLabel: string;
  isDeleted: boolean;
  nextTile: { x: number; y: number } | null;
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
      nextTile: null,
    };
  });
  
  const pathOrder: number[] = [];

  switch (wiringPattern) {
    case 'serpentine-vertical':
      for (let x = 0; x < screenWidth; x++) {
        const colIsReversed = x % 2 !== 0;
        for (let i = 0; i < screenHeight; i++) {
          const y = colIsReversed ? screenHeight - 1 - i : i;
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;

    case 'left-right':
      for (let y = 0; y < screenHeight; y++) {
        for (let x = 0; x < screenWidth; x++) {
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;

    case 'top-bottom':
      for (let x = 0; x < screenWidth; x++) {
        for (let y = 0; y < screenHeight; y++) {
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;

    case 'bottom-to-top':
      for (let x = 0; x < screenWidth; x++) {
        for (let y = screenHeight - 1; y >= 0; y--) {
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;
    
    case 'serpentine-horizontal-reverse':
      for (let y = screenHeight - 1; y >= 0; y--) {
        const rowIsReversed = (screenHeight - 1 - y) % 2 !== 0;
        for (let i = 0; i < screenWidth; i++) {
          const x = rowIsReversed ? screenWidth - 1 - i : i;
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;

    case 'serpentine-horizontal':
    default:
      for (let y = 0; y < screenHeight; y++) {
        const rowIsReversed = y % 2 !== 0;
        for (let i = 0; i < screenWidth; i++) {
          const x = rowIsReversed ? screenWidth - 1 - i : i;
          pathOrder.push(y * screenWidth + x);
        }
      }
      break;
  }
  
  const activeTilesPath: { tile: WiringInfo; index: number; }[] = pathOrder
    .map(index => ({ tile: allTilesData[index], index }))
    .filter(({ tile }) => tile && !tile.isDeleted);
    
  if (activeTilesPath.length === 0) {
    return allTilesData;
  }

  let powerCounter = 1;
  let powerGroupCounter = 0;

  activeTilesPath.forEach(({ tile: currentTileInfo }, pathIndex) => {
    powerGroupCounter++;
    if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
      powerCounter++;
      powerGroupCounter = 1;
    }
    currentTileInfo.powerLabel = `P${powerCounter}`;

    const groupNumOverall = Math.floor(pathIndex / subgroupSize);
    const universeIndex = Math.floor(groupNumOverall / subgroupsPerUniverse);
    const subgroupIndexInUniverse = (groupNumOverall % subgroupsPerUniverse) + 1;
    
    const isFirstInGroup = pathIndex % subgroupSize === 0;

    if (isFirstInGroup) {
      const universe = getUniverseLabel(universeIndex);
      currentTileInfo.dataLabel = `${universe}${subgroupIndexInUniverse}`;
    } else {
      currentTileInfo.dataLabel = "";
    }
    
    const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
    const isEndOfGroup = (pathIndex + 1) % subgroupSize === 0;

    if (isEndOfGroup || isLastTileInPath) {
        let backupUniverse: string;
        if (universeIndex === 0) { // 'A' universe backup is 'B'
            backupUniverse = 'B';
        } else {
            // Backup for C is D, for D is E, etc.
            const backupUniverseIndex = universeIndex + 1;
            if (backupUniverseIndex < UNIVERSE_LETTERS.length) {
                backupUniverse = UNIVERSE_LETTERS[backupUniverseIndex];
            } else {
                // Fallback if we run out of letters
                backupUniverse = `BU${universeIndex}`; 
            }
        }
        currentTileInfo.backupLabel = `${backupUniverse}${subgroupIndexInUniverse}`;
        currentTileInfo.nextTile = null;
    } else {
      const nextTileInfo = activeTilesPath[pathIndex + 1].tile;
      currentTileInfo.nextTile = { x: nextTileInfo.x, y: nextTileInfo.y };
    }
  });

  return allTilesData;
}
