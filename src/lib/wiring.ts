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
  let dataCounter = 1;
  let powerCounter = 1;
  let powerGroupCounter = 0;
  let currentUniverse = 'A';

  for (let y = 0; y < screenHeight; y++) {
    const row = Array.from({ length: screenWidth }, (_, x) => x);
    if (y % 2 !== 0) {
      row.reverse(); // Snake pattern
    }

    for (const x of row) {
      const tileIndex = y * screenWidth + x;
      const tile = tiles[tileIndex];

      if (tile) {
        powerGroupCounter++;
        if (powerGroupCounter > TILES_PER_POWER_CIRCUIT) {
            powerCounter++;
            powerGroupCounter = 1;
        }

        wiringData.push({
          x,
          y,
          dataLabel: `${currentUniverse}${dataCounter}`,
          powerLabel: `P${powerCounter}`,
          isDeleted: tile.deleted,
        });

        dataCounter++;
        if (dataCounter > 10) { // Example: 10 tiles per string
            dataCounter = 1;
            currentUniverse = String.fromCharCode(currentUniverse.charCodeAt(0) + 1);
            if(currentUniverse > 'Z') currentUniverse = 'A'; // loop back
        }
      }
    }
  }

  return wiringData;
}
