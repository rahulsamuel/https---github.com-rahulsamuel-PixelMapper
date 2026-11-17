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
  | "verticalTruss"
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
  verticalTruss: "Vertical truss",
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

export interface HeaderBarSpec {
  label: string;
  tilesPerBar: number;
  count: number;
}

/**
 * Header bars hang from the rigging and the tiles hang off them. A 1000mm-wide
 * header carries one 1000mm tile; two 500mm tiles share one double-wide header;
 * a single-wide header carries one 500mm tile.
 */
export function resolveHeaderBar(
  config: ScreenHardwareConfig,
  tileWidthMm: number | null,
  screenWidth: number
): HeaderBarSpec {
  const tw = tileWidthMm ?? 0;
  let tilesPerBar: number;
  let label: string;

  if (config.headerBarType === "double") {
    tilesPerBar = 2;
    label = "Header bars (double wide)";
  } else if (config.headerBarType === "single") {
    tilesPerBar = 1;
    label = "Header bars (single wide)";
  } else if (tw <= 0) {
    tilesPerBar = 1;
    label = "Header bars";
  } else {
    tilesPerBar = Math.max(1, Math.floor(1000 / tw));
    label =
      tilesPerBar === 1
        ? `Header bars (${tw}mm wide)`
        : tilesPerBar === 2
          ? "Header bars (double wide)"
          : `Header bars (${tilesPerBar} tiles wide)`;
  }

  return { label, tilesPerBar, count: Math.max(1, Math.ceil(screenWidth / tilesPerBar)) };
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
    const spec = resolveHeaderBar(config, metrics.tileWidthMm, screenWidth);
    push("headerBars", spec.label, spec.count);
  } else if (config.mountingType === "ground-stack") {
    // Ground stack: base bars on the deck (same count as header bars), towers
    // braced with outriggers, rear clamps restraining the top row, vertical
    // truss sections and sandbag ballast.
    const spec = resolveHeaderBar(config, metrics.tileWidthMm, screenWidth);
    push("baseBars", "Base bars", spec.count);
    push("outriggers", "Outriggers", Math.max(2, Math.ceil(screenWidth / 2)));
    push("rearClamps", "Rear clamps", screenWidth * 2);
    if (metrics.heightM) push("verticalTruss", "Vertical truss", Math.ceil(metrics.heightM / 2) * 2);
    push("sandbags", "Sandbags", Math.max(2, screenWidth));
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

export function hardwareListText(
  projectName: string,
  aggregate: { label: string; quantity: number }[],
  perScreen: { name: string; items: HardwareItem[] }[]
): string {
  const lines: string[] = [];
  lines.push(`Hardware List — ${projectName}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("Total hardware (all screens):");
  for (const item of aggregate) lines.push(`  ${item.label}: ${item.quantity}`);
  lines.push("");
  for (const screen of perScreen) {
    lines.push(`${screen.name}:`);
    if (screen.items.length === 0) lines.push("  (no hardware — configure the screen first)");
    for (const item of screen.items) lines.push(`  ${item.label}: ${item.quantity}`);
    lines.push("");
  }
  lines.push("Quantities are planning estimates only. Verify all support hardware with the manufacturer or a qualified engineer.");
  return lines.join("\n");
}

export function hardwareListCsv(
  projectName: string,
  aggregate: { label: string; quantity: number }[],
  perScreen: { name: string; items: HardwareItem[] }[]
): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(esc(`Hardware List — ${projectName}`));
  rows.push(esc(`Date: ${new Date().toLocaleDateString()}`));
  rows.push("");
  rows.push([esc("Scope"), esc("Item"), esc("Quantity")].join(","));
  for (const item of aggregate) rows.push([esc("All screens"), esc(item.label), String(item.quantity)].join(","));
  for (const screen of perScreen) {
    for (const item of screen.items) {
      rows.push([esc(screen.name), esc(item.label), String(item.quantity)].join(","));
    }
  }
  return rows.join("\n");
}

export { getScreenProductId };
