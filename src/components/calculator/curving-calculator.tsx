'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, RefreshCw, Eye, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

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
  x1: number; y1: number; x2: number; y2: number; angle: number;
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
  let x = 0, y = 0, heading = 0;

  for (let i = 0; i < numColumns; i++) {
    const rad = (heading * Math.PI) / 180;
    const dx = Math.cos(rad) * columnWidthMm;
    const dy = Math.sin(rad) * columnWidthMm;
    positions.push({ x1: x, y1: y, x2: x + dx, y2: y + dy, angle: heading });
    x += dx; y += dy;
    if (i < numColumns - 1) heading += sign * junctionAngles[i];
  }

  const totalArcAngleDeg = junctionAngles.reduce((s, a) => s + a, 0);
  let radius: number | null = null;
  let center: { x: number; y: number } | null = null;

  const isUniform = junctionAngles.length > 0 && junctionAngles.every((a) => Math.abs(a - junctionAngles[0]) < 0.001);
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
const ANGLE_MAX = 90;

function useArcData(screenWidthTiles: number, tileWidthMm: number, state: CurvingState) {
  const numJunctions = Math.max(0, screenWidthTiles - 1);
  const effectiveVariableAngles = useMemo(() => {
    const arr = [...state.variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    while (arr.length > numJunctions) arr.pop();
    return arr;
  }, [state.variableAngles, numJunctions]);

  const junctionAngles = state.curveMode === 'uniform'
    ? Array(numJunctions).fill(state.uniformAngle)
    : effectiveVariableAngles;

  return useMemo(
    () => computeArc(screenWidthTiles, tileWidthMm || 500, junctionAngles, state.direction),
    [screenWidthTiles, tileWidthMm, junctionAngles, state.direction],
  );
}

/* ── Sidebar settings ── */

interface CurvingSettingsProps {
  screenWidthTiles: number;
  tileWidthMm: number;
  state: CurvingState;
  onChange: (patch: Partial<CurvingState>) => void;
}

export function CurvingSettings({ screenWidthTiles, tileWidthMm, state, onChange }: CurvingSettingsProps) {
  const numJunctions = Math.max(0, screenWidthTiles - 1);

  const effectiveVariableAngles = useMemo(() => {
    const arr = [...state.variableAngles];
    while (arr.length < numJunctions) arr.push(5);
    while (arr.length > numJunctions) arr.pop();
    return arr;
  }, [state.variableAngles, numJunctions]);

  // Full circle calculations
  const fullCircleAngle = numJunctions > 0 ? 360 / numJunctions : null;
  const circumferenceMm = screenWidthTiles * (tileWidthMm || 500);
  const fullCircleRadius = circumferenceMm / (2 * Math.PI);
  const fullCircleDiameter = fullCircleRadius * 2;

  const applyFullCircle = () => {
    if (fullCircleAngle == null) return;
    onChange({ curveMode: 'uniform', uniformAngle: parseFloat(fullCircleAngle.toFixed(4)) });
  };

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
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ direction: 'concave' })}
            className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
              state.direction === 'concave' ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            <RotateCcw className="h-4 w-4" /> Concave
          </button>
          <button
            onClick={() => onChange({ direction: 'convex' })}
            className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
              state.direction === 'convex' ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            <RotateCw className="h-4 w-4" /> Convex
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {state.direction === 'concave'
            ? 'Screen curves toward the viewer (stadium-style).'
            : 'Screen curves away from the viewer (billboard wrap).'}
        </p>
      </div>

      <Separator />

      {/* Full Circle / Cylinder */}
      <div className="space-y-2">
        <Label>Full Circle / Cylinder</Label>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            To form a fully closed circle or cylinder with {screenWidthTiles} column{screenWidthTiles === 1 ? '' : 's'}, each junction must bend at exactly:
          </p>
          {numJunctions > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Angle per junction</p>
                  <p className="font-bold text-lg tabular-nums">{fullCircleAngle!.toFixed(2)}°</p>
                  <p className="text-xs text-muted-foreground">{numJunctions} junctions</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Circle radius</p>
                  <p className="font-bold text-lg">{formatMm(fullCircleRadius)}</p>
                  <p className="text-xs text-muted-foreground">{formatMmFt(fullCircleRadius)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Diameter</p>
                  <p className="font-bold text-base">{formatMm(fullCircleDiameter)}</p>
                  <p className="text-xs text-muted-foreground">{formatMmFt(fullCircleDiameter)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Circumference</p>
                  <p className="font-bold text-base">{formatMm(circumferenceMm)}</p>
                  <p className="text-xs text-muted-foreground">{formatMmFt(circumferenceMm)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5"
                onClick={applyFullCircle}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Apply Full Circle Angle
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Need at least 2 columns to calculate a full circle.
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Curve type */}
      <div className="space-y-2">
        <Label>Curve Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ curveMode: 'uniform' })}
            className={`rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
              state.curveMode === 'uniform' ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-popover hover:bg-accent'
            }`}
          >
            Uniform
          </button>
          <button
            onClick={() => onChange({ curveMode: 'variable' })}
            className={`rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
              state.curveMode === 'variable' ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-popover hover:bg-accent'
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
            max={ANGLE_MAX}
            step={0.5}
            value={[Math.min(state.uniformAngle, ANGLE_MAX)]}
            onValueChange={([v]) => onChange({ uniformAngle: v })}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={state.uniformAngle}
              onChange={(e) => onChange({ uniformAngle: Math.max(0, Number(e.target.value) || 0) })}
              min={0}
              step={0.5}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">deg / junction</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Applied to all {numJunctions} junction{numJunctions === 1 ? '' : 's'} · total {(state.uniformAngle * numJunctions).toFixed(1)}°
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Junction Angles ({numJunctions})</Label>
          {numJunctions === 0 ? (
            <p className="text-xs text-muted-foreground italic">Need at least 2 columns.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {effectiveVariableAngles.map((angle, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono w-7 shrink-0 text-muted-foreground">J{idx + 1}</span>
                  <Slider
                    min={0}
                    max={ANGLE_MAX}
                    step={0.5}
                    value={[Math.min(angle, ANGLE_MAX)]}
                    onValueChange={([v]) => updateVariableAngle(idx, v)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={angle}
                    onChange={(e) => updateVariableAngle(idx, Math.max(0, Number(e.target.value) || 0))}
                    min={0}
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

/* ── Main preview + values ── */

interface CurvingPreviewProps {
  screenWidthTiles: number;
  tileWidthMm: number;
  state: CurvingState;
  onZoom: (zoom: number) => void;
}

export function CurvingPreview({ screenWidthTiles, tileWidthMm, state, onZoom }: CurvingPreviewProps) {
  const arc = useArcData(screenWidthTiles, tileWidthMm, state);
  const zoom = state.zoom;

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

  // Detect near-full-circle (within 5°)
  const isNearFullCircle = arc.totalArcAngleDeg >= 355;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Calculated values strip */}
      <Card className="flex-shrink-0">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-3">
            {[
              { label: 'Radius', value: arc.radius != null ? formatMm(arc.radius) : '—', sub: arc.radius != null ? formatMmFt(arc.radius) : undefined },
              { label: 'Diameter', value: arc.diameter != null ? formatMm(arc.diameter) : '—', sub: arc.diameter != null ? formatMmFt(arc.diameter) : undefined },
              { label: 'Total Arc', value: `${arc.totalArcAngleDeg.toFixed(1)}°`, sub: isNearFullCircle ? 'Full circle' : undefined },
              { label: 'Arc Length', value: formatMm(arc.arcLengthMm), sub: formatMmFt(arc.arcLengthMm) },
              { label: 'Chord', value: formatMm(arc.chordMm), sub: formatMmFt(arc.chordMm) },
              { label: 'Columns', value: String(screenWidthTiles), sub: `${tileWidthMm?.toFixed(0)} mm each` },
            ].map(({ label, value, sub }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className={`font-bold text-base leading-tight ${isNearFullCircle && label === 'Total Arc' ? 'text-primary' : ''}`}>{value}</p>
                {sub && <p className={`text-xs ${isNearFullCircle && label === 'Total Arc' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{sub}</p>}
              </div>
            ))}
          </div>
          {state.curveMode === 'variable' && (
            <p className="text-xs text-muted-foreground italic pt-2 mt-2 border-t">
              Radius and diameter shown for uniform curves only.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview card */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Top-Down Arc Preview</CardTitle>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border-2 ${
                  state.direction === 'concave'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {state.direction === 'concave' ? <ArrowUpFromLine className="h-3.5 w-3.5" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
                {state.direction === 'concave' ? 'Concave — curves toward viewer' : 'Convex — curves away from viewer'}
              </span>
            </div>
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
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    opacity="0.4"
                  />
                  <line
                    x1={toSvg(arc.center.x, arc.center.y).x}
                    y1={toSvg(arc.center.x, arc.center.y).y}
                    x2={toSvg(arc.positions[0].x1, arc.positions[0].y1).x}
                    y2={toSvg(arc.positions[0].x1, arc.positions[0].y1).y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    opacity="0.8"
                  />
                  <circle
                    cx={toSvg(arc.center.x, arc.center.y).x}
                    cy={toSvg(arc.center.x, arc.center.y).y}
                    r="3"
                    fill="hsl(var(--primary))"
                    opacity="0.8"
                  />
                  <text
                    x={(toSvg(arc.center.x, arc.center.y).x + toSvg(arc.positions[0].x1, arc.positions[0].y1).x) / 2}
                    y={(toSvg(arc.center.x, arc.center.y).y + toSvg(arc.positions[0].x1, arc.positions[0].y1).y) / 2}
                    fill="hsl(var(--primary))"
                    fontSize={Math.max(10, 12 * zoom)}
                    fontWeight="bold"
                    textAnchor="middle"
                    dy="-8"
                  >
                    R = {formatMm(arc.radius)}
                  </text>
                </>
              )}

              {/* Chord line (hide when nearly full circle) */}
              {arc.positions.length > 1 && !isNearFullCircle && (
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
              {(() => {
                const dirSign = state.direction === 'concave' ? -1 : 1;
                return arc.positions.map((col, i) => {
                  const p1 = toSvg(col.x1, col.y1);
                  const p2 = toSvg(col.x2, col.y2);
                  const strokeW = Math.max(3, 10 * baseScale * zoom);
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  // Outward normal (away from center / outside of curve)
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nx = (dy * dirSign) / len;
                  const ny = (-dx * dirSign) / len;
                  const labelOffset = strokeW / 2 + 16;
                  const labelX = midX + nx * labelOffset;
                  const labelY = midY + ny * labelOffset;
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
                        <>
                          <circle
                            cx={labelX}
                            cy={labelY}
                            r={Math.max(8, 11 * zoom)}
                            fill="hsl(var(--primary))"
                            opacity="0.9"
                          />
                          <text
                            x={labelX}
                            y={labelY}
                            fill="white"
                            fontSize={Math.max(8, 10 * zoom)}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontWeight="bold"
                          >
                            {i + 1}
                          </text>
                        </>
                      )}
                    </g>
                  );
                });
              })()}

              {/* Direction / shape label + Viewer position indicator */}
              {!isNearFullCircle && arc.positions.length > 0 && (() => {
                const dirSign = state.direction === 'concave' ? -1 : 1;
                const first = arc.positions[0];
                const last = arc.positions[arc.positions.length - 1];
                const midDataX = (first.x1 + last.x2) / 2;
                const midDataY = (first.y1 + last.y2) / 2;
                const viewerSvg = toSvg(midDataX, midDataY);
                // Viewer is on the inside of the curve (opposite of outward normal)
                const dx = last.x2 - first.x1;
                const dy = last.y2 - first.y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = (dy * dirSign) / len;
                const ny = (-dx * dirSign) / len;
                const viewerOffset = 40;
                const vx = viewerSvg.x - nx * viewerOffset;
                const vy = viewerSvg.y - ny * viewerOffset;
                return (
                  <g opacity="0.7">
                    <circle cx={vx} cy={vy} r="14" fill="hsl(var(--muted))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
                    <text
                      x={vx}
                      y={vy}
                      fill="hsl(var(--muted-foreground))"
                      fontSize={Math.max(10, 13 * zoom)}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      V
                    </text>
                    <text
                      x={vx}
                      y={vy + Math.max(18, 22 * zoom)}
                      fill="hsl(var(--muted-foreground))"
                      fontSize={Math.max(8, 10 * zoom)}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      Viewer
                    </text>
                  </g>
                );
              })()}

              {/* Shape label at bottom */}
              <text
                x={Math.ceil(svgW) / 2}
                y={Math.ceil(svgH) - 10}
                fill="hsl(var(--muted-foreground))"
                fontSize={Math.max(10, 12 * zoom)}
                textAnchor="middle"
                fontStyle="italic"
                fontWeight="600"
              >
                {isNearFullCircle
                  ? `Full Circle / Cylinder (${state.direction})`
                  : `${state.direction === 'concave' ? 'Concave' : 'Convex'} Arc — ${arc.totalArcAngleDeg.toFixed(1)}°`}
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
