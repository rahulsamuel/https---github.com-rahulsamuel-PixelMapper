'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCw, RotateCcw, Minus, Plus } from 'lucide-react';

interface CurvingCalculatorProps {
  screenWidthTiles: number;
  tileWidthMm: number;
}

type CurveMode = 'uniform' | 'variable';
type Direction = 'concave' | 'convex';

interface ColumnPosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

function computeArc(
  numColumns: number,
  columnWidthMm: number,
  junctionAngles: number[],
  direction: Direction,
): {
  positions: ColumnPosition[];
  radius: number | null;
  diameter: number | null;
  totalArcAngleDeg: number;
  arcLengthMm: number;
  chordMm: number;
  chordEnd: { x: number; y: number };
  center: { x: number; y: number } | null;
} {
  const sign = direction === 'concave' ? -1 : 1;
  const positions: ColumnPosition[] = [];
  let x = 0;
  let y = 0;
  let heading = 0;

  for (let i = 0; i < numColumns; i++) {
    const rad = (heading * Math.PI) / 180;
    const dx = Math.cos(rad) * columnWidthMm;
    const dy = Math.sin(rad) * columnWidthMm;
    positions.push({ x1: x, y1: y, x2: x + dx, y2: y + dy, angle: heading });
    x += dx;
    y += dy;
    if (i < numColumns - 1) {
      heading += sign * junctionAngles[i];
    }
  }

  const totalArcAngleDeg = junctionAngles.reduce((s, a) => s + a, 0);

  // For uniform curve, compute radius/diameter
  let radius: number | null = null;
  let center: { x: number; y: number } | null = null;

  const isUniform = junctionAngles.every((a) => Math.abs(a - junctionAngles[0]) < 0.001) && junctionAngles.length > 0;
  if (isUniform && junctionAngles[0] > 0) {
    const thetaRad = (junctionAngles[0] * Math.PI) / 180;
    radius = columnWidthMm / (2 * Math.sin(thetaRad / 2));
    // Center is perpendicular to the first column, at distance R
    // First column goes from (0,0) to (w, 0), midpoint (w/2, 0)
    // Perpendicular direction depends on concave/convex
    const midX = columnWidthMm / 2;
    const perpX = 0;
    const perpY = sign * radius;
    center = { x: midX + perpX, y: perpY };
  }

  const diameter = radius ? radius * 2 : null;
  const arcLengthMm = numColumns * columnWidthMm;

  // Chord: straight-line distance from start to end
  const endX = positions[positions.length - 1]?.x2 ?? 0;
  const endY = positions[positions.length - 1]?.y2 ?? 0;
  const chordMm = Math.sqrt(endX * endX + endY * endY);

  return {
    positions,
    radius,
    diameter,
    totalArcAngleDeg,
    arcLengthMm,
    chordMm,
    chordEnd: { x: endX, y: endY },
    center,
  };
}

function formatMm(mm: number): string {
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(1)} mm`;
}

function formatMmFt(mm: number): string {
  const inches = mm / 25.4;
  const feet = inches / 12;
  if (feet >= 1) return `${feet.toFixed(2)} ft`;
  return `${inches.toFixed(1)} in`;
}

export function CurvingCalculator({ screenWidthTiles, tileWidthMm }: CurvingCalculatorProps) {
  const [curveMode, setCurveMode] = useState<CurveMode>('uniform');
  const [direction, setDirection] = useState<Direction>('concave');
  const [uniformAngle, setUniformAngle] = useState(5);
  const [variableAngles, setVariableAngles] = useState<number[]>(Array(Math.max(0, screenWidthTiles - 1)).fill(5));

  const numJunctions = Math.max(0, screenWidthTiles - 1);

  // Sync variable angles array length with column count
  const effectiveVariableAngles = useMemo(() => {
    const arr = [...variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    while (arr.length > numJunctions) arr.pop();
    return arr;
  }, [variableAngles, numJunctions]);

  const junctionAngles = curveMode === 'uniform' ? Array(numJunctions).fill(uniformAngle) : effectiveVariableAngles;

  const arc = useMemo(
    () => computeArc(screenWidthTiles, tileWidthMm || 500, junctionAngles, direction),
    [screenWidthTiles, tileWidthMm, junctionAngles, direction],
  );

  // SVG scaling
  const svgSize = 520;
  const padding = 60;
  const allX = arc.positions.flatMap((p) => [p.x1, p.x2]);
  const allY = arc.positions.flatMap((p) => [p.y1, p.y2]);
  if (arc.center) {
    allX.push(arc.center.x);
    allY.push(arc.center.y);
  }
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...allX, 0);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 0);
  const dataW = maxX - minX || 1;
  const dataH = maxY - minY || 1;
  const scale = Math.min((svgSize - 2 * padding) / dataW, (svgSize - 2 * padding) / dataH);
  const offsetX = (svgSize - dataW * scale) / 2 - minX * scale;
  const offsetY = (svgSize - dataH * scale) / 2 - minY * scale;

  const toSvg = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });

  const updateVariableAngle = (idx: number, value: number) => {
    setVariableAngles((prev) => {
      const arr = [...prev];
      while (arr.length < numJunctions) arr.push(5);
      arr[idx] = value;
      return arr.slice(0, numJunctions);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline">Curving Calculator</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize how your {screenWidthTiles}-column screen curves from a top-down view.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curve Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Direction toggle */}
              <div className="space-y-2">
                <Label>Curve Direction</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDirection('concave')}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      direction === 'concave'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-popover hover:bg-accent'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Concave
                  </button>
                  <button
                    onClick={() => setDirection('convex')}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      direction === 'convex'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-popover hover:bg-accent'
                    }`}
                  >
                    <RotateCw className="h-4 w-4" />
                    Convex
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {direction === 'concave'
                    ? 'Screen curves toward the viewer (like a stadium display).'
                    : 'Screen curves away from the viewer (like a billboard wrap).'}
                </p>
              </div>

              <Separator />

              {/* Curve mode toggle */}
              <div className="space-y-2">
                <Label>Curve Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurveMode('uniform')}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      curveMode === 'uniform'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-popover hover:bg-accent'
                    }`}
                  >
                    Uniform Curve
                  </button>
                  <button
                    onClick={() => setCurveMode('variable')}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      curveMode === 'variable'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-popover hover:bg-accent'
                    }`}
                  >
                    Variable Curve
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {curveMode === 'uniform'
                    ? 'Every junction bends at the same angle.'
                    : 'Each junction can bend at a different angle for custom shapes.'}
                </p>
              </div>

              <Separator />

              {/* Angle controls */}
              {curveMode === 'uniform' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Junction Angle</Label>
                    <span className="text-sm font-mono font-semibold">{uniformAngle.toFixed(1)}°</span>
                  </div>
                  <Slider
                    min={0}
                    max={30}
                    step={0.5}
                    value={[uniformAngle]}
                    onValueChange={([v]) => setUniformAngle(v)}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={uniformAngle}
                      onChange={(e) => setUniformAngle(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                      min={0}
                      max={30}
                      step={0.5}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">degrees per junction</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied to all {numJunctions} junction{numJunctions === 1 ? '' : 's'} between {screenWidthTiles} columns.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Junction Angles ({numJunctions} junctions)</Label>
                  {numJunctions === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Need at least 2 columns to curve. Adjust screen width in the Input Parameters.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {effectiveVariableAngles.map((angle, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs font-mono w-20 shrink-0 text-muted-foreground">
                            J{idx + 1}
                          </span>
                          <Slider
                            min={0}
                            max={30}
                            step={0.5}
                            value={[angle]}
                            onValueChange={([v]) => updateVariableAngle(idx, v)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={angle}
                            onChange={(e) =>
                              updateVariableAngle(idx, Math.max(0, Math.min(30, Number(e.target.value) || 0)))
                            }
                            min={0}
                            max={30}
                            step={0.5}
                            className="w-20 h-8"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Calculated Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Radius</p>
                  <p className="font-bold text-lg">
                    {arc.radius != null ? formatMm(arc.radius) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {arc.radius != null ? formatMmFt(arc.radius) : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Diameter</p>
                  <p className="font-bold text-lg">
                    {arc.diameter != null ? formatMm(arc.diameter) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {arc.diameter != null ? formatMmFt(arc.diameter) : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Arc Angle</p>
                  <p className="font-bold text-lg">{arc.totalArcAngleDeg.toFixed(1)}°</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Arc Length</p>
                  <p className="font-bold text-lg">{formatMm(arc.arcLengthMm)}</p>
                  <p className="text-xs text-muted-foreground">{formatMmFt(arc.arcLengthMm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chord Length</p>
                  <p className="font-bold text-lg">{formatMm(arc.chordMm)}</p>
                  <p className="text-xs text-muted-foreground">{formatMmFt(arc.chordMm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Columns</p>
                  <p className="font-bold text-lg">{screenWidthTiles}</p>
                  <p className="text-xs text-muted-foreground">{tileWidthMm?.toFixed(0)} mm each</p>
                </div>
              </div>
              {curveMode === 'variable' && (
                <p className="text-xs text-muted-foreground italic pt-2 border-t">
                  Radius and diameter are shown for uniform curves only. Variable curves produce a non-circular shape.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SVG Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Top-Down Arc Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <svg width={svgSize} height={svgSize} className="max-w-full">
                {/* Background grid */}
                <defs>
                  <pattern id="arcgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width={svgSize} height={svgSize} fill="url(#arcgrid)" />

                {/* Radius line and circle */}
                {arc.center && arc.radius && (
                  <>
                    <circle
                      {...toSvg(arc.center.x, arc.center.y)}
                      r={arc.radius * scale}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />
                    <line
                      x1={toSvg(arc.center.x, arc.center.y).x}
                      y1={toSvg(arc.center.x, arc.center.y).y}
                      x2={toSvg(arc.positions[0].x1, arc.positions[0].y1).x}
                      y2={toSvg(arc.positions[0].x1, arc.positions[0].y1).y}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                      opacity="0.6"
                    />
                    <text
                      x={(toSvg(arc.center.x, arc.center.y).x + toSvg(arc.positions[0].x1, arc.positions[0].y1).x) / 2}
                      y={(toSvg(arc.center.x, arc.center.y).y + toSvg(arc.positions[0].x1, arc.positions[0].y1).y) / 2}
                      fill="hsl(var(--primary))"
                      fontSize="11"
                      textAnchor="middle"
                      dy="-6"
                    >
                      R = {formatMm(arc.radius)}
                    </text>
                  </>
                )}

                {/* Chord line */}
                {arc.positions.length > 1 && (
                  <>
                    <line
                      x1={toSvg(arc.positions[0].x1, arc.positions[0].y1).x}
                      y1={toSvg(arc.positions[0].x1, arc.positions[0].y1).y}
                      x2={toSvg(arc.chordEnd.x, arc.chordEnd.y).x}
                      y2={toSvg(arc.chordEnd.x, arc.chordEnd.y).y}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <text
                      x={(toSvg(arc.positions[0].x1, arc.positions[0].y1).x + toSvg(arc.chordEnd.x, arc.chordEnd.y).x) / 2}
                      y={(toSvg(arc.positions[0].x1, arc.positions[0].y1).y + toSvg(arc.chordEnd.x, arc.chordEnd.y).y) / 2}
                      fill="hsl(var(--muted-foreground))"
                      fontSize="10"
                      textAnchor="middle"
                      dy="14"
                    >
                      Chord: {formatMm(arc.chordMm)}
                    </text>
                  </>
                )}

                {/* Columns */}
                {arc.positions.map((col, i) => {
                  const p1 = toSvg(col.x1, col.y1);
                  const p2 = toSvg(col.x2, col.y2);
                  return (
                    <g key={i}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth={Math.max(3, 12 * scale)}
                        strokeLinecap="butt"
                        opacity={0.85}
                      />
                      <text
                        x={(p1.x + p2.x) / 2}
                        y={(p1.y + p2.y) / 2}
                        fill="white"
                        fontSize="9"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontWeight="bold"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Direction indicator */}
                <text
                  x={svgSize / 2}
                  y={svgSize - 16}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="11"
                  textAnchor="middle"
                  fontStyle="italic"
                >
                  {direction === 'concave' ? '↑ Viewer (Concave)' : '↓ Viewer (Convex)'}
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
