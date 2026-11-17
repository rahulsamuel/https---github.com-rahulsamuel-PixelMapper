"use client";

import type { Screen } from "@/contexts/pixel-map-types";
import { getScreenProductId } from "@/lib/calculator-screens";

export type MountingType = "flown" | "ground-stack" | "floor";
export type HeaderBarType = "auto" | "double" | "single";
export type SandbagWeight = "25" | "35";

export interface ScreenHardwareConfig {
  mountingType: MountingType;
  // "auto" picks the bar width from the tile width (500mm tiles -> double wide,
  // 1000mm tiles -> single 1000mm header). "double"/"single" force it.
  headerBarType: HeaderBarType;
  cornerBlocks: boolean;
  sandbagWeight: SandbagWeight;
  // Manual additive adjustments per item, applied on top of the calculated estimate.
  adjustments: Partial<Record<HardwareItemId, number>>;
}

export const DEFAULT_HARDWARE_CONFIG: ScreenHardwareConfig = {
  mountingType: "flown",
  headerBarType: "auto",
  cornerBlocks: false,
  sandbagWeight: "25",
  adjustments: {},
};

export type HardwareItemId =
  | "headerBars"
  | "baseBars"
  | "outriggers"
  | "rearClamps"
  | "cornerBlocks"
  | "verticalTruss1000"
  | "verticalTruss500"
  | "sandbags";

export interface HardwareItem {
  id: HardwareItemId;
  label: string;
  quantity: number;
}

export const HARDWARE_ITEM_LABELS: Record<HardwareItemId, string> = {
  headerBars: "Header bars",
  baseBars: "Base bars",
  outriggers: "Outriggers",
  rearClamps: "Rear clamps",
  cornerBlocks: "Corner blocks",
  verticalTruss1000: "Vertical truss (1000mm)",
  verticalTruss500: "Vertical truss (500mm)",
  sandbags: "Sandbags",
};

export const MOUNTING_TYPE_LABELS: Record<MountingType, string> = {
  flown: "Flown",
  "ground-stack": "Ground Stack",
  floor: "Floor",
};

const KG_TO_LB = 2.20462;

export interface ScreenMetrics {
  screenWidth: number;
  screenHeight: number;
  totalTiles: number;
  tileWidthMm: number | null;
  screenWeightKg: number | null;
  widthM: number | null;
  heightM: number | null;
}

function screenTileWidthMm(screen: Screen): number {
  const withSize = screen.sections.find((s) => s.tileWidthMm > 0);
  if (withSize) return withSize.tileWidthMm;
  return screen.customTileWidthMm > 0 ? screen.customTileWidthMm : 0;
}

function screenTileHeightMm(screen: Screen): number {
  const withSize = screen.sections.find((s) => s.tileHeightMm > 0);
  if (withSize) return withSize.tileHeightMm;
  return screen.customTileHeightMm > 0 ? screen.customTileHeightMm : 0;
}

export function getScreenMetrics(screen: Screen, tileWeightKg: number | null | undefined): ScreenMetrics {
  const totalTiles = Math.max(0, screen.dimensions.screenWidth) * Math.max(0, screen.dimensions.screenHeight);
  const hasSize = screen.dimensions.screenWidth > 0 && screen.dimensions.screenHeight > 0;
  const tileWidthMm = screenTileWidthMm(screen) || null;
  return {
    screenWidth: screen.dimensions.screenWidth,
    screenHeight: screen.dimensions.screenHeight,
    totalTiles,
    tileWidthMm,
    screenWeightKg:
      tileWeightKg && tileWeightKg > 0 && totalTiles > 0 ? Math.round(tileWeightKg * totalTiles) : null,
    widthM: hasSize && tileWidthMm ? (tileWidthMm * screen.dimensions.screenWidth) / 1000 : null,
    heightM:
      hasSize && screenTileHeightMm(screen) > 0
        ? (screenTileHeightMm(screen) * screen.dimensions.screenHeight) / 1000
        : null,
  };
}

export function formatWeightLbKg(kg: number | null): string {
  if (kg === null || kg <= 0) return "—";
  const lb = Math.round(kg * KG_TO_LB);
  return `${lb.toLocaleString()} lb (${Math.round(kg).toLocaleString()} kg)`;
}

export interface BarSpec {
  bars: { label: string; count: number }[];
  count: number;
}

/**
 * Bars carry the tiles: header bars hang from the rigging (flown), base bars
 * sit on the deck (ground stack). Odd 500mm tile widths are filled with
 * double-wide bars first and a single-wide bar for the remainder.
 */
function resolveBar(
  config: ScreenHardwareConfig,
  tileWidthMm: number | null,
  screenWidth: number,
  baseLabel: string
): BarSpec {
  const tw = tileWidthMm ?? 0;
  const bars: { label: string; count: number }[] = [];
  const doubleLabel = `${baseLabel} (double wide)`;
  const singleLabel = `${baseLabel} (single wide)`;

  if (config.headerBarType === "single" || tw >= 1000) {
    bars.push({
      label: config.headerBarType === "single" ? singleLabel : `${baseLabel} (${tw}mm wide)`,
      count: screenWidth,
    });
  } else {
    const doubleCount = Math.floor(screenWidth / 2);
    const singleCount = screenWidth % 2;
    if (doubleCount > 0) bars.push({ label: doubleLabel, count: doubleCount });
    if (singleCount > 0) bars.push({ label: singleLabel, count: singleCount });
  }

  if (bars.length === 0) bars.push({ label: singleLabel, count: Math.max(1, screenWidth) });
  return { bars, count: bars.reduce((sum, bar) => sum + bar.count, 0) };
}

/**
 * Planning-rule estimates for screen support hardware. These are ordering guides
 * based on common LED-panel rigging practice, NOT structural calculations.
 * Every quantity can be overridden per screen via config.adjustments (added to
 * the calculated value).
 */
export function calculateHardware(config: ScreenHardwareConfig, metrics: ScreenMetrics): HardwareItem[] {
  const items: HardwareItem[] = [];
  const { screenWidth, screenHeight } = metrics;
  const hasSize = screenWidth > 0 && screenHeight > 0;
  const push = (id: HardwareItemId, label: string, quantity: number) => {
    const adjusted = quantity + (config.adjustments[id] ?? 0);
    if (adjusted > 0) items.push({ id, label, quantity: adjusted });
  };

  if (!hasSize || screenWidth === 0) {
    return Object.entries(config.adjustments)
      .filter(([, v]) => (v ?? 0) > 0)
      .map(([id, v]) => ({ id: id as HardwareItemId, label: HARDWARE_ITEM_LABELS[id as HardwareItemId], quantity: v ?? 0 }));
  }

  if (config.mountingType === "flown") {
    // Flown: tiles hang off header bars. No clamps, outriggers or rear clamps.
    const spec = resolveBar(config, metrics.tileWidthMm, screenWidth, "Header bars");
    for (const bar of spec.bars) push("headerBars", bar.label, bar.count);
  } else if (config.mountingType === "ground-stack") {
    // Ground stack: base bars on the deck, one outrigger per base bar, a truss
    // tower behind each base bar column built from 1000mm sections first and
    // 500mm sections for the remainder, rear clamps matching the truss count,
    // and sandbags ballasting roughly the weight of the screen.
    const spec = resolveBar(config, metrics.tileWidthMm, screenWidth, "Base bars");
    for (const bar of spec.bars) push("baseBars", bar.label, bar.count);
    push("outriggers", "Outriggers", spec.count);

    if (metrics.heightM && metrics.heightM > 0) {
      const heightMm = metrics.heightM * 1000;
      const towers = spec.count;
      const n1000 = Math.floor(heightMm / 1000);
      const remainderMm = heightMm - n1000 * 1000;
      const n500 = remainderMm > 0 ? Math.ceil(remainderMm / 500) : 0;
      push("verticalTruss1000", "Vertical truss (1000mm)", n1000 * towers);
      if (n500 > 0) push("verticalTruss500", "Vertical truss (500mm)", n500 * towers);
      const trussTotal = (n1000 + n500) * towers;
      if (trussTotal > 0) push("rearClamps", "Rear clamps", trussTotal);
    }

    if (metrics.screenWeightKg && metrics.screenWeightKg > 0) {
      const bagLb = Number(config.sandbagWeight);
      const screenLb = metrics.screenWeightKg * KG_TO_LB;
      push("sandbags", `Sandbags (${bagLb} lb)`, Math.ceil(screenLb / bagLb));
    } else {
      push("sandbags", `Sandbags (${Number(config.sandbagWeight)} lb)`, Math.max(2, screenWidth));
    }
  }
  // Floor: the screen sits directly on the ground — no support hardware.

  if (config.cornerBlocks && config.mountingType !== "floor") {
    push("cornerBlocks", "Corner blocks", 4);
  }

  return items;
}

export function aggregateHardware(
  screens: { config: ScreenHardwareConfig; items: HardwareItem[] }[]
): { label: string; quantity: number }[] {
  // Keyed by label, not id, so "double wide" and "1000mm" header bars from
  // different screens are listed separately instead of being summed blindly.
  const totals = new Map<string, number>();
  for (const s of screens) {
    for (const item of s.items) {
      totals.set(item.label, (totals.get(item.label) ?? 0) + item.quantity);
    }
  }
  return [...totals.entries()]
    .map(([label, quantity]) => ({ label, quantity }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface HardwareListExportScreen {
  name: string;
  mountingType: MountingType;
  screenWeightKg: number | null;
  items: HardwareItem[];
}

export function formatExportHardwareLabel(label: string): string {
  return label
    .replace(/^Header bars/, "Header Bar")
    .replace(/^Base bars/, "Stacking Bar")
    .replace(/^Vertical truss \(1000mm\)/, "Vertical Truss (1m)")
    .replace(/^Vertical truss \(500mm\)/, "Vertical Truss (0.5m)")
    .replace(/^Rear clamps/, "Rear Clamp Count")
    .replace(/^Sandbags \((\d+) lb\)/, "Sandbags ($1 Lbs)");
}

function exportScreenLabel(screen: HardwareListExportScreen): string {
  return `${screen.name} (${MOUNTING_TYPE_LABELS[screen.mountingType].toUpperCase()})`;
}

function totalQuantity(items: HardwareItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function hardwareListText(
  projectName: string,
  totalWeightKg: number,
  aggregate: { label: string; quantity: number }[],
  perScreen: HardwareListExportScreen[]
): string {
  const lines: string[] = [];
  lines.push(`PROJECT HARDWARE MANIFEST: ${projectName}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push(`Total Project Screen Weight: ${formatWeightLbKg(totalWeightKg)}`);
  lines.push("");
  lines.push("[ CUMULATIVE HARDWARE TOTALS ]");
  for (const item of aggregate) lines.push(`${formatExportHardwareLabel(item.label)}: ${item.quantity}`);
  lines.push("");
  lines.push("[ BREAKDOWN BY SCREEN ]");
  for (const screen of perScreen) {
    lines.push(`- ${exportScreenLabel(screen)}: ${totalQuantity(screen.items)} items`);
    if (screen.screenWeightKg !== null) lines.push(`  Weight: ${formatWeightLbKg(screen.screenWeightKg)}`);
    if (screen.items.length === 0) lines.push("  • No hardware — configure the screen first");
    for (const item of screen.items) lines.push(`  • ${formatExportHardwareLabel(item.label)}: ${item.quantity}`);
    lines.push("");
  }
  lines.push("Quantities are planning estimates only. Verify all support hardware with the manufacturer or a qualified engineer.");
  return lines.join("\n");
}

export function hardwareListCsv(
  projectName: string,
  totalWeightKg: number,
  aggregate: { label: string; quantity: number }[],
  perScreen: HardwareListExportScreen[]
): string {
  const esc = (v: string): string => `"${v.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push([esc("Category"), esc("Item Name"), esc("Quantity")].join(","));
  rows.push([esc("PROJECT CUMULATIVE TOTALS"), "", ""].join(","));
  rows.push([esc("Project"), esc("Project Screen Weight"), esc(formatWeightLbKg(totalWeightKg))].join(","));
  for (const item of aggregate) {
    rows.push([esc("Master Manifest"), esc(formatExportHardwareLabel(item.label)), String(item.quantity)].join(","));
  }
  rows.push("");
  rows.push([esc("DETAILED SCREEN INVENTORY"), "", ""].join(","));
  for (const screen of perScreen) {
    const category = exportScreenLabel(screen);
    if (screen.screenWeightKg !== null) {
      rows.push([esc(category), esc("Screen Weight"), esc(formatWeightLbKg(screen.screenWeightKg))].join(","));
    }
    for (const item of screen.items) {
      rows.push([esc(category), esc(formatExportHardwareLabel(item.label)), String(item.quantity)].join(","));
    }
    rows.push("");
  }
  return rows.join("\n");
}

export { getScreenProductId };
