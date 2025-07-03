
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

interface WiringInfo {
  x: number;
  y: number;
  dataLabel: string;
  powerLabel: string;
  backupLabel: string;
  isDeleted: boolean;
  arrowTo: 'up' | 'down' | 'left' | 'right' | null;
}

const TILES_PER_POWER_CIRCUIT = 20;

// Correct universe sequence, skipping 'B'.
const UNIVERSE_LETTERS = [
    'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const getUniverseLabel = (n: number): string => {
    if (n >= 0 && n < UNIVERSE_LETTERS.length) {
        return UNIVERSE_LETTERS[n];
    }
    // Fallback for a large number of universes
    return `Universe ${n + 1}`;
};


export function getWiringData(
  dimensions: Dimensions,
  tiles: Tile[],
  wiringPortConfig: string
): WiringInfo[] {
  const { screenWidth, screenHeight } = dimensions;
  if (!tiles || tiles.length === 0) {
    return [];
  }

  const subgroupSize = parseInt(wiringPortConfig.trim(), 10) || 4;
  const subgroupsPerUniverse = 10;

  const allTilesData = tiles.map((tile, index) => {
    const x = index % screenWidth;
    const y = Math.floor(index / screenWidth);
    return {
      x, y, dataLabel: "", powerLabel: "", backupLabel: "",
      isDeleted: tile.deleted,
      arrowTo: null as "up" | "down" | "left" | "right" | null,
    };
  });

  const activeTilesPath: { tile: WiringInfo; index: number; }[] = [];

  for (let y = 0; y < screenHeight; y++) {
    const rowIsReversed = y % 2 !== 0;
    for (let i = 0; i < screenWidth; i++) {
      const x = rowIsReversed ? screenWidth - 1 - i : i;
      const tileIndex = y * screenHeight + x;
      const tileData = allTilesData[tileIndex];
      if (tileData && !tileData.isDeleted) {
        activeTilesPath.push({ tile: tileData, index: tileIndex });
      }
    }
  }

  if (activeTilesPath.length === 0) {
    return allTilesData;
  }

  let powerCounter = 1;
  let powerGroupCounter = 0;
  let backupPortCounter = 0;

  activeTilesPath.forEach(({ tile }, pathIndex) => {
    // Power Label Logic
    powerGroupCounter++;
    if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
      powerCounter++;
      powerGroupCounter = 1;
    }
    tile.powerLabel = `P${powerCounter}`;

    // Data Label Logic
    const isFirstInGroup = pathIndex % subgroupSize === 0;
    if (isFirstInGroup) {
      const groupNum = Math.floor(pathIndex / subgroupSize);
      const universeIndex = Math.floor(groupNum / subgroupsPerUniverse);
      const subgroupIndexInUniverse = (groupNum % subgroupsPerUniverse) + 1;
      
      const universe = getUniverseLabel(universeIndex);
      tile.dataLabel = `${universe}${subgroupIndexInUniverse}`;
    } else {
      tile.dataLabel = "";
    }
    
    // Arrow and Backup Label Logic
    const isLastTileInPath = pathIndex === activeTilesPath.length - 1;
    const isEndOfGroup = (pathIndex + 1) % subgroupSize === 0;

    if (isEndOfGroup || isLastTileInPath) {
        backupPortCounter++;
        tile.backupLabel = `B${backupPortCounter}`;
        tile.arrowTo = null; // No arrow from the end of a string.
    } else {
      const currentPos = { x: tile.x, y: tile.y };
      const nextPos = {
        x: activeTilesPath[pathIndex + 1].tile.x,
        y: activeTilesPath[pathIndex + 1].tile.y,
      };
      if (nextPos.x > currentPos.x) tile.arrowTo = "right";
      else if (nextPos.x < currentPos.x) tile.arrowTo = "left";
      else if (nextPos.y > currentPos.y) tile.arrowTo = "down";
      else if (nextPos.y < currentPos.y) tile.arrowTo = "up";
    }
  });

  return allTilesData;
}
