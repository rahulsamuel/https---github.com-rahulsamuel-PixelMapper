
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
  isDeleted: boolean;
  arrowTo: 'up' | 'down' | 'left' | 'right' | null;
}

const TILES_PER_POWER_CIRCUIT = 20;

export function getWiringData(
  dimensions: Dimensions,
  tiles: Tile[],
  tilesPerPort: number
): WiringInfo[] {
  const { screenWidth, screenHeight } = dimensions;
  if (!tiles || tiles.length === 0) {
    return [];
  }

  // 1. Create a flat list of all tiles with their coordinates and initial state
  const allTilesData = tiles.map((tile, index) => {
    const x = index % screenWidth;
    const y = Math.floor(index / screenWidth);
    return {
      x,
      y,
      dataLabel: "",
      powerLabel: "",
      isDeleted: tile.deleted,
      arrowTo: null as "up" | "down" | "left" | "right" | null,
    };
  });

  // 2. Create the snake-like path of *active* tiles
  const activeTilesPath: {
    tile: WiringInfo;
    index: number;
  }[] = [];

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

  if (activeTilesPath.length === 0) {
    return allTilesData;
  }

  // 3. Iterate through the active path to assign labels and arrows
  let dataUniverseCounter = 0;
  let dataAddressCounter = 1;
  let powerCounter = 1;
  let powerGroupCounter = 0;

  const getUniverseLabel = (n: number): string => {
    if (n === 0) return 'A';
    // n=1 should be 'C', n=2 should be 'D'
    const charCode = n + 66; // 1 -> 67 ('C'), 2 -> 68 ('D')
    if (charCode > 90) return `U${n}`; // Fallback for after Z
    return String.fromCharCode(charCode);
  };

  activeTilesPath.forEach(({ tile }, pathIndex) => {
    // Assign Power Label
    powerGroupCounter++;
    if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
      powerCounter++;
      powerGroupCounter = 1;
    }
    tile.powerLabel = `P${powerCounter}`;

    // Assign Data Label
    const universe = getUniverseLabel(dataUniverseCounter);
    tile.dataLabel = `${universe}${dataAddressCounter}`;

    dataAddressCounter++;
    if (dataAddressCounter > tilesPerPort) {
      dataAddressCounter = 1;
      dataUniverseCounter++;
    }

    // Assign Arrow direction to next tile
    if (pathIndex < activeTilesPath.length - 1) {
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
