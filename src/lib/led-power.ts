export interface LedPowerInput {
  wattsPerTile: number;
  avgPowerWPerSqm: number | null;
  tileWidthMm: number;
  tileHeightMm: number;
  totalTiles: number;
  volts: number;
  threePhase: boolean;
}

export interface LedPowerResult {
  tileAreaM2: number;
  maxPerTileW: number;
  avgPerTileW: number;
  totalMaxW: number;
  totalAvgW: number;
  maxPerM2: number;
  avgPerM2: number;
  maxAmps: number;
  avgAmps: number;
  phaseDivisor: number;
}

export function computeLedPower(input: LedPowerInput): LedPowerResult {
  const tileAreaM2 = (input.tileWidthMm / 1000) * (input.tileHeightMm / 1000);
  const maxPerTileW = input.wattsPerTile;
  const avgPerTileW = (input.avgPowerWPerSqm ?? 0) * tileAreaM2;
  const totalMaxW = maxPerTileW * input.totalTiles;
  const totalAvgW = avgPerTileW * input.totalTiles;
  const phaseDivisor = input.threePhase ? Math.sqrt(3) : 1;
  const ampsDivisor = input.volts * phaseDivisor;

  return {
    tileAreaM2,
    maxPerTileW,
    avgPerTileW,
    totalMaxW,
    totalAvgW,
    maxPerM2: tileAreaM2 > 0 ? maxPerTileW / tileAreaM2 : 0,
    avgPerM2: input.avgPowerWPerSqm ?? 0,
    maxAmps: totalMaxW / ampsDivisor,
    avgAmps: totalAvgW / ampsDivisor,
    phaseDivisor,
  };
}
