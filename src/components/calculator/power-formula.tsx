import type { LedPowerInput, LedPowerResult } from "@/lib/led-power";

const fmt = (n: number, digits = 1) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });

interface PowerFormulaProps {
  input: LedPowerInput;
  result: LedPowerResult;
}

function FormulaRow({ label, expression, value }: { label: string; expression: string; value: string }) {
  return (
    <div className="px-3 py-2 border-b border-border/30 last:border-0 space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums">{expression}</p>
    </div>
  );
}

export function PowerFormula({ input, result }: PowerFormulaProps) {
  const ampsDenominator = input.threePhase
    ? `(${input.volts} V \u00d7 \u221a3)`
    : `${input.volts} V`;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Power Formula</p>
      <div className="rounded-md border bg-muted/30 overflow-hidden">
        <FormulaRow
          label="Tile area"
          expression={`${fmt(input.tileWidthMm / 1000, 3)} m \u00d7 ${fmt(input.tileHeightMm / 1000, 3)} m`}
          value={`${fmt(result.tileAreaM2, 3)} m\u00b2`}
        />
        <FormulaRow
          label="Max per tile"
          expression={`Stored watts per tile`}
          value={`${fmt(result.maxPerTileW)} W`}
        />
        <FormulaRow
          label="Avg per tile"
          expression={`${fmt(result.avgPerM2)} W/m\u00b2 \u00d7 ${fmt(result.tileAreaM2, 3)} m\u00b2`}
          value={`${fmt(result.avgPerTileW)} W`}
        />
        <FormulaRow
          label="Total power (max)"
          expression={`${fmt(result.maxPerTileW)} W \u00d7 ${input.totalTiles} tiles`}
          value={`${fmt(result.totalMaxW)} W`}
        />
        <FormulaRow
          label="Total power (avg)"
          expression={`${fmt(result.avgPerTileW)} W \u00d7 ${input.totalTiles} tiles`}
          value={`${fmt(result.totalAvgW)} W`}
        />
        <FormulaRow
          label="Current (max)"
          expression={`${fmt(result.totalMaxW)} W \u00f7 ${ampsDenominator}`}
          value={`${fmt(result.maxAmps, 2)} A`}
        />
        <FormulaRow
          label="Current (avg)"
          expression={`${fmt(result.totalAvgW)} W \u00f7 ${ampsDenominator}`}
          value={`${fmt(result.avgAmps, 2)} A`}
        />
      </div>
      {input.threePhase && (
        <p className="text-[11px] text-muted-foreground">Three-phase current uses the square root of 3 factor.</p>
      )}
    </div>
  );
}
