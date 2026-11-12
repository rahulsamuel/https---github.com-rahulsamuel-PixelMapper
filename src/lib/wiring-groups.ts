import type { Screen, Tile, WiringGroup } from "@/contexts/pixel-map-types";
import { getPathOrder } from "@/lib/wiring";

export function formatGroupLabel(template: string, number: number): string {
  return template.split("{n}").join(String(number));
}

export function getGroupCircuitLabels(group: WiringGroup, circuitIndex: number): { main: string; backup: string } {
  const number = group.startNumber + circuitIndex;
  const override = group.customLabels[circuitIndex];
  return {
    main: override?.main ?? formatGroupLabel(group.mainTemplate, number),
    backup: override?.backup ?? formatGroupLabel(group.backupTemplate, number),
  };
}

export function getGroupCircuitCount(tileCount: number, tilesPerCircuit: number): number {
  return Math.ceil(tileCount / tilesPerCircuit);
}

function removeGroupCircuits(tiles: Tile[], groupId: string): Tile[] {
  return tiles.map(tile => {
    const hasData = tile.dataCircuit?.groupId === groupId;
    const hasPower = tile.powerCircuit?.groupId === groupId;
    if (!hasData && !hasPower) return tile;
    return {
      ...tile,
      ...(hasData ? { dataCircuit: undefined } : {}),
      ...(hasPower ? { powerCircuit: undefined, powerPortLabel: undefined } : {}),
    };
  });
}

function applyGroupCircuits(tiles: Tile[], group: WiringGroup, screenWidth: number, screenHeight: number): Tile[] {
  const indices = group.tileCoords
    .map(({ x, y }) => y * screenWidth + x)
    .filter(index => index < tiles.length && !tiles[index].deleted);
  const ordered = getPathOrder(indices, group.pattern, screenWidth, screenHeight, group.runLength);
  const result = [...tiles];

  for (let circuitIndex = 0; circuitIndex * group.tilesPerCircuit < ordered.length; circuitIndex++) {
    const chunk = ordered.slice(circuitIndex * group.tilesPerCircuit, (circuitIndex + 1) * group.tilesPerCircuit);
    const { main, backup } = getGroupCircuitLabels(group, circuitIndex);
    const circuitBase = {
      groupId: group.id,
      tileCount: chunk.length,
      pattern: group.pattern,
      runLength: group.runLength,
    };
    const start = { ...result[chunk[0]] };
    if (group.kind === "data") {
      start.dataCircuit = { ...circuitBase, mainLabel: main, backupLabel: backup };
    } else {
      start.powerCircuit = { ...circuitBase, label: main };
      start.powerPortLabel = main;
    }
    result[chunk[0]] = start;
  }

  return result;
}

export function rebuildWiringGroups(tiles: Tile[], groups: WiringGroup[], screenWidth: number, screenHeight: number): Tile[] {
  let result = tiles;
  for (const group of groups) result = removeGroupCircuits(result, group.id);
  for (const group of groups) result = applyGroupCircuits(result, group, screenWidth, screenHeight);
  return result;
}

export function removeWiringGroup(screen: Screen, groupId: string): Screen {
  return {
    ...screen,
    wiringGroups: screen.wiringGroups.filter(group => group.id !== groupId),
    tiles: removeGroupCircuits(screen.tiles, groupId),
  };
}

export function replaceScreenWiring(screen: Screen, groups: WiringGroup[]): Screen {
  const cleared = screen.tiles.map(tile => ({
    ...tile,
    dataCircuit: undefined,
    powerCircuit: undefined,
    powerPortLabel: undefined,
  }));
  const { screenWidth, screenHeight } = screen.dimensions;
  return {
    ...screen,
    wiringGroups: groups,
    tiles: rebuildWiringGroups(cleared, groups, screenWidth, screenHeight),
  };
}

export function groupsFitScreen(groups: WiringGroup[], screen: Screen): boolean {
  const { screenWidth, screenHeight } = screen.dimensions;
  return groups.every(group =>
    group.tileCoords.every(({ x, y }) => {
      if (x < 0 || y < 0 || x >= screenWidth || y >= screenHeight) return false;
      const tile = screen.tiles[y * screenWidth + x];
      return !!tile && !tile.deleted;
    })
  );
}
