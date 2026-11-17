"use client";

import type { Screen } from "@/contexts/pixel-map-types";
import { getScreenProductId } from "@/lib/calculator-screens";

export type MountingType = "flown" | "ground-stack" | "floor";
export type RiggingBarType = "mixed" | "double" | "single";
export type SandbagWeight = "25" | "35";

export interface ScreenHardwareConfig {
  mountingType: MountingType;
  riggingBarType: RiggingBarType;
  cornerBlocks: boolean;
  sandbagWeight: SandbagWeight;
  // Manual additive adjustments per item, applied on top of the calculated estimate.
  adjustments: Partial<Record<HardwareItemId, number>>;
}

export const DEFAULT_HARDWARE_CONFIG: ScreenHardwareConfig = {
  mountingType: "flown",
  riggingBarType: "mixed",
  cornerBlocks: false,
  sandbagWeight: "25",
  adjustments: {},
};

export type HardwareItemId =
  | "riggingBars"
  | "outriggers"
  | "rearClamps"
  | "clamps"
  | "cornerBlocks"
  | "stackingBars"
  | "verticalTruss"
  | "sandbags"
  | "safetyCables";

export interface HardwareItem {
  id: HardwareItemId;
  label: string;
  quantity: number;
}

export interface ScreenWeightInput {
  tileWeightKg: number | null;
  totalTiles: number;
}

export interface ScreenMetrics {
  screenWidth: number;
  screenHeight: number;
  totalTiles: number;
  screenWeightKg: number | null;
  widthM: number | null;
  heightM: number | null;
}

export const HARDWARE_ITEM_LABELS: Record<HardwareItemId, string> = {
  riggingBars: "Rigging bars",
  outriggers: "Outriggers",
  rearClamps: "Rear clamps",
  clamps: "Clamps",
  cornerBlocks: "Corner blocks",
  stackingBars: "Stacking bars",
  verticalTruss: "Vertical truss",
  sandbags: "Sandbags",
  safetyCables: "Safety cables",
};

export function getScreenMetrics(screen: Screen, tileWeightKg: number | null | undefined): ScreenMetrics {
  const totalTiles = Math.max(0, screen.dimensions.screenWidth) * Math.max(0, screen.dimensions.screenHeight);
  const hasSize = screen.dimensions.screenWidth > 0 && screen.dimensions.screenHeight > 0;
  return {
    screenWidth: screen.dimensions.screenWidth,
    screenHeight: screen.dimensions.screenHeight,
    totalTiles,
    screenWeightKg:
      tileWeightKg && tileWeightKg > 0 && totalTiles > 0 ? Math.round(tileWeightKg * totalTiles * 10) / 10 : null,
    widthM: hasSize && tileWidthMm(screen) > 0 ? (tileWidthMm(screen) * screen.dimensions.screenWidth) / 1000 : null,
    heightM: hasSize && tileHeightMm(screen) > 0 ? (tileHeightMm(screen) * screen.dimensions.screenHeight) / 1000 : null,
  };
}

function tileWidthMm(screen: Screen): number {
  const withSize = screen.sections.find((s) => s.tileWidthMm > 0);
  if (withSize) return withSize.tileWidthMm;
  return screen.customTileWidthMm > 0 ? screen.customTileWidthMm : 0;
}

function tileHeightMm(screen: Screen): number {
  const withSize = screen.sections.find((s) => s.tileHeightMm > 0);
  if (withSize) return withSize.tileHeightMm;
  return screen.customTileHeightMm > 0 ? screen.customTileHeightMm : 0;
}

/**
 * Planning-rule estimates for screen support hardware. These are ordering guides
 * based on common LED-panel rigging practice, NOT structural calculations.
 * Every quantity can be overridden per screen via config.adjustments (added to
 * the calculated value).
 */
export function calculateHardware(config: ScreenHardwareConfig, metrics: ScreenMetrics): HardwareItem[] {
  const items: HardwareItem[] = [];
  const { totalTiles, screenWidth, screenHeight } = metrics;
  const hasSize = screenWidth > 0 && screenHeight > 0;
  const push = (id: HardwareItemId, quantity: number) => {
    const adjusted = quantity + (config.adjustments[id] ?? 0);
    if (adjusted > 0) items.push({ id, label: HARDWARE_ITEM_LABELS[id], quantity: adjusted });
  };

  if (!hasSize || totalTiles === 0) {
    return Object.entries(config.adjustments)
      .filter(([, v]) => (v ?? 0) > 0)
      .map(([id, v]) => ({ id: id as HardwareItemId, label: HARDWARE_ITEM_LABELS[id as HardwareItemId], quantity: v ?? 0 }));
  }

  if (config.mountingType === "flown") {
    // Rigging bars: one per tile column (bars run vertically down each column),
    // chosen per the selected bar type. Mixed = alternating single/double.
    const barCount = screenWidth;
    push("riggingBars", barCount);

    // Outriggers: one per rigging point pair, roughly every 2 columns, min 2.
    push("outriggers", Math.max(2, Math.ceil(screenWidth / 2)));

    // Rear clamps: two per column of tiles for rear support, top and bottom rows.
    push("rearClamps", screenWidth * 2);

    // Clamps: two per rigging bar to attach to the truss.
    push("clamps", barCount * 2);

    // Safety cables: one per rigging bar.
    push("safetyCables", barCount);
  } else {
    // Ground stack / floor: stacking bars between rows, one set per row joint.
    const rowJoints = Math.max(0, screenHeight - 1);
    if (config.mountingType === "ground-stack") push("stackingBars", rowJoints * Math.ceil(screenWidth / 2) || screenWidth);
    else push("stackingBars", rowJoints);

    // Vertical truss: two towers (sides) for ground support frames, per 2m section.
    if (config.mountingType === "ground-stack" && metrics.heightM) {
      push("verticalTruss", Math.ceil(metrics.heightM / 2) * 2);
    }

    // Rear clamps on ground builds: top-row restraint, two per column.
    push("rearClamps", screenWidth * 2);
  }

  if (config.cornerBlocks) {
    push("cornerBlocks", 4);
  }

  // Sandbags: ballast for ground builds, or stabilising for flown builds on the deck.
  const sandbagBase =
    config.mountingType === "flown" ? Math.max(2, Math.ceil(screenWidth / 4)) : Math.max(2, screenWidth);
  push("sandbags", sandbagBase);

  return items;
}

export function aggregateHardware(
  screens: { config: ScreenHardwareConfig; items: HardwareItem[] }[]
): { id: HardwareItemId; label: string; quantity: number }[] {
  const totals = new Map<HardwareItemId, number>();
  for (const s of screens) {
    for (const item of s.items) {
      totals.set(item.id, (totals.get(item.id) ?? 0) + item.quantity);
    }
  }
  return [...totals.entries()]
    .map(([id, quantity]) => ({ id, label: HARDWARE_ITEM_LABELS[id], quantity }))
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

export function screenHardwareKey(screen: Screen, config: ScreenHardwareConfig): string {
  return JSON.stringify([screen.id, config.mountingType, config.riggingBarType, config.cornerBlocks, config.sandbagWeight, config.adjustments]);
}

export { getScreenProductId };
