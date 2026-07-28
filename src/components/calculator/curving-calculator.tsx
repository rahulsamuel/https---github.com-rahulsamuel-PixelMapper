'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export type CurveMode = 'uniform' | 'variable';
export type Direction = 'concave' | 'convex';

export interface CurvingState {
  curveMode: CurveMode;
  direction: Direction;
  uniformAngle: number;
  variableAngles: number[];
  zoom: number;
}

export const DEFAULT_CURVING_STATE: CurvingState = {
  curveMode: 'uniform',
  direction: 'concave',
  uniformAngle: 5,
  variableAngles: [],
  zoom: 1,
};

interface ColumnPosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

interface ArcData {
  positions: ColumnPosition[];
  radius: number | null;
  diameter: number | null;
  totalArcAngleDeg: number;
  arcLengthMm: number;
  chordMm: number;
  chordEnd: { x: number; y: number };
  center: { x: number; y: number } | null;
}

function computeArc(
  numColumns: number,
  columnWidthMm: number,
  junctionAngles: number[],
  direction: Direction,
): ArcData {
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
    if (i < numColumns - 1) heading += sign * junctionAngles[i];
  }

  const totalArcAngleDeg = junctionAngles.reduce((s, a) => s + a, 0);
  let radius: number | null = null;
  let center: { x: number; y: number } | null = null;

  const isUniform =
    junctionAngles.length > 0 && junctionAngles.every((a) => Math.abs(a - junctionAngles[0]) < 0.001);
  if (isUniform && junctionAngles[0] > 0) {
    const thetaRad = (junctionAngles[0] * Math.PI) / 180;
    radius = columnWidthMm / (2 * Math.sin(thetaRad / 2));
    center = { x: columnWidthMm / 2, y: sign * radius };
  }

  const diameter = radius ? radius * 2 : null;
  const arcLengthMm = numColumns * columnWidthMm;
  const endX = positions[positions.length - 1]?.x2 ?? 0;
  const endY = positions[positions.length - 1]?.y2 ?? 0;
  const chordMm = Math.sqrt(endX * endX + endY * endY);

  return { positions, radius, diameter, totalArcAngleDeg, arcLengthMm, chordMm, chordEnd: { x: endX, y: endY }, center };
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

const BASE_SVG = 520;
const PADDING = 60;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

function useArcData(screenWidthTiles: number, tileWidthMm: number, state: CurvingState) {
  const numJunctions = Math.max(0, screenWidthTiles - 1);

  const effectiveVariableAngles = useMemo(() => {
    const arr = [...state.variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    while (arr.length > numJunctions) arr.pop();
    return arr;
  }, [state.variableAngles, numJunctions]);

  const junctionAngles =
    state.curveMode === 'uniform'
      ? Array(numJunctions).fill(state.uniformAngle)
      : effectiveVariableAngles;

  return useMemo(
    () => computeArc(screenWidthTiles, tileWidthMm || 500, junctionAngles, state.direction),
    [screenWidthTiles, tileWidthMm, junctionAngles, state.direction],
  );
}

/* ---------- Sidebar settings ---------- */

interface CurvingSettingsProps {
  screenWidthTiles: number;
  state: CurvingState;
  onChange: (patch: Partial<CurvingState>) => void;
}

export function CurvingSettings({ screenWidthTiles, state, onChange }: CurvingSettingsProps) {
  const numJunctions = Math.max(0, screenWidthTiles - 1);

  const effectiveVariableAngles = useMemo(() => {
    const arr = [...state.variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    while (arr.length > numJunctions) arr.pop();
    return arr;
  }, [state.variableAngles, numJunctions]);

  const updateVariableAngle = (idx: number, value: number) => {
    const arr = [...state.variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    arr[idx] = value;
    onChange({ variableAngles: arr.slice(0, numJunctions) });
  };

  return (
    <div className="space-y-5">
      {/* Direction */}
      <div className="space-y-2">
        <Label>Curve Direction</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ direction: 'concave' })}
            className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
              state.direction === 'concave'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Concave
          </button>
          <button
            onClick={() => onChange({ direction: 'convex' })}
            className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
              state.direction === 'convex'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            <RotateCw className="h-4 w-4" />
            Convex
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {state.direction === 'concave'
            ? 'Screen curves toward the viewer (like a stadium display).'
            : 'Screen curves away from the viewer (like a billboard wrap).'}
        </p>
      </div>

      <Separator />

      {/* Curve type */}
      <div className="space-y-2">
        <Label>Curve Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ curveMode: 'uniform' })}
            className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
              state.curveMode === 'uniform'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            Uniform
          </button>
          <button
            onClick={() => onChange({ curveMode: 'variable' })}
            className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
              state.curveMode === 'variable'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            Variable
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {state.curveMode === 'uniform'
            ? 'Every junction bends at the same angle.'
            : 'Each junction can bend at a different angle for custom shapes.'}
        </p>
      </div>

      <Separator />

      {/* Angle controls */}
      {state.curveMode === 'uniform' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Junction Angle</Label>
            <span className="text-sm font-mono font-semibold">{state.uniformAngle.toFixed(1)}°</span>
          </div>
          <Slider
            min={0}
            max={30}
            step={0.5}
            value={[state.uniformAngle]}
            onValueChange={([v]) => onChange({ uniformAngle: v })}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={state.uniformAngle}
              onChange={(e) =>
                onChange({ uniformAngle: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })
              }
              min={0}
              max={30}
              step={0.5}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">deg / junction</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Applied to all {numJunctions} junction{numJunctions === 1 ? '' : 's'} between{' '}
            {screenWidthTiles} columns.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Junction Angles ({numJunctions})</Label>
          {numJunctions === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Need at least 2 columns. Adjust screen width in Input Parameters.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {effectiveVariableAngles.map((angle, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono w-7 shrink-0 text-muted-foreground">J{idx + 1}</span>
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
                    className="w-16 h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Main preview + values ---------- */

interface CurvingPreviewProps {
  screenWidthTiles: number;
  tileWidthMm: number;
  state: CurvingState;
  onZoom: (zoom: number) => void;
}

export function CurvingPreview({ screenWidthTiles, tileWidthMm, state, onZoom }: CurvingPreviewProps) {
  const arc = useArcData(screenWidthTiles, tileWidthMm, state);
  const zoom = state.zoom;

  // SVG viewport
  const allX = arc.positions.flatMap((p) => [p.x1, p.x2]);
  const allY = arc.positions.flatMap((p) => [p.y1, p.y2]);
  if (arc.center) { allX.push(arc.center.x); allY.push(arc.center.y); }
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...allX, 0);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 0);
  const dataW = maxX - minX || 1;
  const dataH = maxY - minY || 1;
  const baseScale = Math.min((BASE_SVG - 2 * PADDING) / dataW, (BASE_SVG - 2 * PADDING) / dataH);
  const scale = baseScale * zoom;
  const svgW = dataW * scale + 2 * PADDING;
  const svgH = dataH * scale + 2 * PADDING;
  const offsetX = PADDING - minX * scale;
  const offsetY = PADDING - minY * scale;
  const toSvg = (x: number, y: number) => ({ x: x * scale + offsetX, y: y * scale + offsetY });

  const handleZoomIn = () => onZoom(Math.min(ZOOM_MAX, parseFloat((zoom + ZOOM_STEP).toFixed(2))));
  const handleZoomOut = () => onZoom(Math.max(ZOOM_MIN, parseFloat((zoom - ZOOM_STEP).toFixed(2))));
  const handleZoomReset = () => onZoom(1);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Calculated values strip */}
      <Card className="flex-shrink-0">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-3">
            {[
              { label: 'Radius', value: arc.radius != null ? formatMm(arc.radius) : '—', sub: arc.radius != null ? formatMmFt(arc.radius) : undefined },
              { label: 'Diameter', value: arc.diameter != null ? formatMm(arc.diameter) : '—', sub: arc.diameter != null ? formatMmFt(arc.diameter) : undefined },
              { label: 'Total Arc', value: `${arc.totalArcAngleDeg.toFixed(1)}°` },
              { label: 'Arc Length', value: formatMm(arc.arcLengthMm), sub: formatMmFt(arc.arcLengthMm) },
              { label: 'Chord', value: formatMm(arc.chordMm), sub: formatMmFt(arc.chordMm) },
              { label: 'Columns', value: String(screenWidthTiles), sub: `${tileWidthMm?.toFixed(0)} mm each` },
            ].map(({ label, value, sub }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-bold text-base leading-tight">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              </div>
            ))}
          </div>
          {state.curveMode === 'variable' && (
            <p className="text-xs text-muted-foreground italic pt-2 mt-2 border-t">
              Radius and diameter are only shown for uniform curves.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview card */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Top-Down Arc Preview</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <button
                onClick={handleZoomReset}
                className="px-2 h-7 rounded border border-input bg-background text-xs font-mono hover:bg-accent transition-colors min-w-[3rem] text-center"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomReset} title="Fit to window">
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2 min-h-0">
          <div className="flex items-start justify-center min-h-full">
            <svg width={Math.ceil(svgW)} height={Math.ceil(svgH)} style={{ display: 'block' }}>
              <defs>
                <pattern id="arcgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
                </pattern>
              </defs>
              <rect width={Math.ceil(svgW)} height={Math.ceil(svgH)} fill="url(#arcgrid)" rx="6" />

              {/* Radius circle + line */}
              {arc.center && arc.radius && (
                <>
                  <circle
                    cx={toSvg(arc.center.x, arc.center.y).x}
                    cy={toSvg(arc.center.x, arc.center.y).y}
                    r={arc.radius * scale}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.25"
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
                    fontSize={Math.max(9, 11 * zoom)}
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
                    fontSize={Math.max(9, 10 * zoom)}
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
                const strokeW = Math.max(3, 10 * baseScale * zoom);
                return (
                  <g key={i}>
                    <line
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke="hsl(var(--primary))"
                      strokeWidth={strokeW}
                      strokeLinecap="butt"
                      opacity={0.85}
                    />
                    {zoom >= 0.5 && (
                      <text
                        x={(p1.x + p2.x) / 2}
                        y={(p1.y + p2.y) / 2}
                        fill="white"
                        fontSize={Math.max(7, 9 * zoom)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontWeight="bold"
                      >
                        {i + 1}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Direction label */}
              <text
                x={Math.ceil(svgW) / 2}
                y={Math.ceil(svgH) - 10}
                fill="hsl(var(--muted-foreground))"
                fontSize={Math.max(9, 11 * zoom)}
                textAnchor="middle"
                fontStyle="italic"
              >
                {state.direction === 'concave' ? '↑ Viewer (Concave)' : '↓ Viewer (Convex)'}
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
