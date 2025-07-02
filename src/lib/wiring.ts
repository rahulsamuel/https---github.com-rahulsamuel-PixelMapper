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
}

const TILES_PER_POWER_CIRCUIT = 20;

export function getWiringData(dimensions: Dimensions, tiles: Tile[]): WiringInfo[] {
  const { screenWidth, screenHeight } = dimensions;
  const wiringData: WiringInfo[] = [];

  let dataUniverseCounter = 0;
  let dataAddressCounter = 1;

  let powerCounter = 1;
  let powerGroupCounter = 0;

  const getUniverseLabel = (n: number): string => {
    let result = '';
    let temp = n;
    while (temp >= 0) {
      result = String.fromCharCode(65 + (temp % 26)) + result;
      temp = Math.floor(temp / 26) - 1;
    }
    return result;
  };

  for (let y = 0; y < screenHeight; y++) {
    const row = Array.from({ length: screenWidth }, (_, x) => x);
    if (y % 2 !== 0) {
      row.reverse(); // Snake pattern
    }

    for (const x of row) {
      const tileIndex = y * screenWidth + x;
      const tile = tiles[tileIndex];

      if (tile) {
        let dataLabel = '';
        let powerLabel = '';

        if (!tile.deleted) {
          powerGroupCounter++;
          if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
            powerCounter++;
            powerGroupCounter = 1;
          }
          powerLabel = `P${powerCounter}`;

          const universe = getUniverseLabel(dataUniverseCounter);
          dataLabel = `${universe}${dataAddressCounter}`;

          dataAddressCounter++;
          if (dataAddressCounter > 10) { // Example: 10 tiles per string
            dataAddressCounter = 1;
            dataUniverseCounter++;
          }
        }

        wiringData.push({
          x,
          y,
          dataLabel,
          powerLabel,
          isDeleted: tile.deleted,
        });
      }
    }
  }

  return wiringData;
}
