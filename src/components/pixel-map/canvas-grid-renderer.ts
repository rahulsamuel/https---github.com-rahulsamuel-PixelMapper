import type { Screen, Tile, ScreenSection } from "@/contexts/pixel-map-types";
import { isColorDark } from "@/lib/utils";

export interface GridRenderParams {
  ctx: CanvasRenderingContext2D;
  screen: Screen;
  tiles: Tile[];
  labels: string[];
  sliceOffsetLabels: string[];
  sections: ScreenSection[];
  effectiveScreenWidth: number;
  effectiveScreenHeight: number;
  effectiveScreenWidthFromSections: number;
  tileColor: string;
  tileColorTwo: string;
  borderWidth: number;
  borderColor: string;
  onOffMode: boolean;
  alternatingPixels: boolean;
  showLabels: boolean;
  labelFontSize: number;
  labelColor: string;
  labelColorMode: string;
  labelPosition: string;
  showModules: boolean;
  moduleBorderColor: string;
  randomizeModuleColors: boolean;
  showSliceOffsetLabels: boolean;
  selectedTileIds: number[];
  topHalfTile: boolean;
  bottomHalfTile: boolean;
  leftHalfTile: boolean;
  rightHalfTile: boolean;
  zoom: number;
  totalGridPixelWidth: number;
  totalGridPixelHeight: number;
}

export interface GridLayout {
  columnPixelOffsets: number[];
  rowPixelOffsets: number[];
  sectionPixelXOffsets: number[];
  sectionRowPixelOffsets: number[];
  sectionTileOffsets: number[];
  totalGridPixelWidth: number;
  totalGridPixelHeight: number;
}

export function computeGridLayout(
  screen: Screen,
  sections: ScreenSection[],
  effectiveScreenWidth: number,
  effectiveScreenHeight: number,
  hasSections: boolean,
): GridLayout {
  if (hasSections) {
    const sectionPixelXOffsets = [0];
    for (const section of sections) {
      sectionPixelXOffsets.push(sectionPixelXOffsets[sectionPixelXOffsets.length - 1] + section.tileWidthPx * section.columnCount);
    }
    const sectionTileHeight = sections[0]?.tileHeightPx ?? screen.dimensions.tileHeight;
    const sectionRowPixelOffsets = [0];
    for (let y = 0; y < effectiveScreenHeight; y++) {
      const isTopHalf = screen.topHalfTile && y === 0;
      const isBottomHalf = screen.bottomHalfTile && y === effectiveScreenHeight - 1;
      sectionRowPixelOffsets.push(sectionRowPixelOffsets[sectionRowPixelOffsets.length - 1] + ((isTopHalf || isBottomHalf) ? sectionTileHeight / 2 : sectionTileHeight));
    }
    const sectionTileOffsets: number[] = [];
    let cumulative = 0;
    for (const section of sections) {
      sectionTileOffsets.push(cumulative);
      cumulative += section.columnCount * effectiveScreenHeight;
    }
    const totalGridPixelWidth = sectionPixelXOffsets[sectionPixelXOffsets.length - 1] || 0;
    const totalGridPixelHeight = sectionRowPixelOffsets[effectiveScreenHeight] || 0;
    return {
      columnPixelOffsets: [],
      rowPixelOffsets: [],
      sectionPixelXOffsets,
      sectionRowPixelOffsets,
      sectionTileOffsets,
      totalGridPixelWidth,
      totalGridPixelHeight,
    };
  }

  const { tileWidth, tileHeight } = screen.dimensions;
  const columnPixelOffsets = [0];
  for (let x = 0; x < effectiveScreenWidth; x++) {
    const isLeftHalf = screen.leftHalfTile && x === 0;
    const isRightHalf = screen.rightHalfTile && x === effectiveScreenWidth - 1;
    columnPixelOffsets.push(columnPixelOffsets[columnPixelOffsets.length - 1] + ((isLeftHalf || isRightHalf) ? tileWidth / 2 : tileWidth));
  }
  const rowPixelOffsets = [0];
  for (let y = 0; y < effectiveScreenHeight; y++) {
    const isTopHalf = screen.topHalfTile && y === 0;
    const isBottomHalf = screen.bottomHalfTile && y === effectiveScreenHeight - 1;
    rowPixelOffsets.push(rowPixelOffsets[rowPixelOffsets.length - 1] + ((isTopHalf || isBottomHalf) ? tileHeight / 2 : tileHeight));
  }
  return {
    columnPixelOffsets,
    rowPixelOffsets,
    sectionPixelXOffsets: [],
    sectionRowPixelOffsets: [],
    sectionTileOffsets: [],
    totalGridPixelWidth: columnPixelOffsets[effectiveScreenWidth] || 0,
    totalGridPixelHeight: rowPixelOffsets[effectiveScreenHeight] || 0,
  };
}

function getTileBgColor(
  tile: Tile,
  x: number,
  y: number,
  tileColor: string,
  tileColorTwo: string,
  onOffMode: boolean,
): string {
  if (onOffMode) return tile.deleted ? '#000000' : '#FFFFFF';
  if (tile.deleted) return '#000000';
  if (tile.color) return tile.color;
  return (x + y) % 2 === 0 ? tileColor : tileColorTwo;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  drawX: number,
  drawY: number,
  w: number,
  h: number,
  fontSize: number,
  color: string,
  position: string,
  zoom: number,
) {
  const fs = fontSize * zoom;
  ctx.font = `bold ${fs}px sans-serif`;
  let textX = drawX + w / 2;
  let textY = drawY + h / 2;
  switch (position) {
    case 'top-left': ctx.textAlign = 'left'; ctx.textBaseline = 'top'; textX = drawX + 8 * zoom; textY = drawY + 4 * zoom; break;
    case 'top-center': ctx.textAlign = 'center'; ctx.textBaseline = 'top'; textY = drawY + 4 * zoom; break;
    case 'top-right': ctx.textAlign = 'right'; ctx.textBaseline = 'top'; textX = drawX + w - 8 * zoom; textY = drawY + 4 * zoom; break;
    case 'bottom-left': ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; textX = drawX + 8 * zoom; textY = drawY + h - 4 * zoom; break;
    case 'bottom-center': ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; textY = drawY + h - 4 * zoom; break;
    case 'bottom-right': ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; textX = drawX + w - 8 * zoom; textY = drawY + h - 4 * zoom; break;
    default: ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  }
  ctx.fillText(text, textX, textY);
}

function drawSliceOffsetLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  drawX: number,
  drawY: number,
  zoom: number,
) {
  const padX = 4 * zoom;
  const padY = 2 * zoom;
  ctx.font = `${10 * zoom}px monospace`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + padX * 2;
  const h = 10 * zoom + padY * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  const r = 3 * zoom;
  ctx.moveTo(drawX + r, drawY);
  ctx.lineTo(drawX + w - r, drawY);
  ctx.arcTo(drawX + w, drawY, drawX + w, drawY + r, r);
  ctx.lineTo(drawX + w, drawY + h - r);
  ctx.arcTo(drawX + w, drawY + h, drawX + w - r, drawY + h, r);
  ctx.lineTo(drawX + r, drawY + h);
  ctx.arcTo(drawX, drawY + h, drawX, drawY + h - r, r);
  ctx.lineTo(drawX, drawY + r);
  ctx.arcTo(drawX, drawY, drawX + r, drawY, r);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, drawX + padX, drawY + padY);
}

export function renderGridToCanvas(
  canvas: HTMLCanvasElement,
  params: GridRenderParams,
  layout: GridLayout,
) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = params.totalGridPixelWidth * params.zoom;
  const cssH = params.totalGridPixelHeight * params.zoom;
  const pxW = Math.ceil(cssW * dpr);
  const pxH = Math.ceil(cssH * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, cssW, cssH);

  const z = params.zoom;
  const hasSections = params.sections.length > 0;

  let checkerPattern: CanvasPattern | null = null;
  if (params.alternatingPixels) {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 2;
    patternCanvas.height = 2;
    const pctx = patternCanvas.getContext('2d');
    if (pctx) {
      pctx.fillStyle = '#000000';
      pctx.fillRect(1, 0, 1, 1);
      pctx.fillRect(0, 1, 1, 1);
      checkerPattern = ctx.createPattern(patternCanvas, 'repeat');
    }
  }

  const selectedSet = new Set(params.selectedTileIds);

  const drawTile = (
    tile: Tile | undefined,
    index: number,
    gx: number,
    gy: number,
    drawX: number,
    drawY: number,
    w: number,
    h: number,
  ) => {
    if (!tile) return;
    const sx = drawX * z;
    const sy = drawY * z;
    const sw = w * z;
    const sh = h * z;

    if (tile.deleted) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx, sy, sw, sh);
      return;
    }

    let bgColor = getTileBgColor(tile, gx, gy, params.tileColor, params.tileColorTwo, params.onOffMode);

    if (params.randomizeModuleColors) {
      // Draw modules individually
      const numModulesX = Math.floor(w / params.screen.dimensions.moduleWidth);
      const numModulesY = Math.floor(h / params.screen.dimensions.moduleHeight);
      const modW = sw / numModulesX;
      const modH = sh / numModulesY;
      for (let my = 0; my < numModulesY; my++) {
        for (let mx = 0; mx < numModulesX; mx++) {
          const mi = my * numModulesX + mx;
          const modColor = params.screen.moduleColors[index]?.[mi] ?? bgColor;
          ctx.fillStyle = params.alternatingPixels ? bgColor : modColor;
          ctx.fillRect(sx + mx * modW, sy + my * modH, modW, modH);
          if (params.showModules) {
            ctx.strokeStyle = params.moduleBorderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + mx * modW, sy + my * modH, modW, modH);
          }
        }
      }
      if (params.alternatingPixels && checkerPattern) {
        ctx.fillStyle = checkerPattern;
        ctx.fillRect(sx, sy, sw, sh);
      }
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(sx, sy, sw, sh);
      if (params.alternatingPixels && checkerPattern) {
        ctx.fillStyle = checkerPattern;
        ctx.fillRect(sx, sy, sw, sh);
      }
      if (params.showModules) {
        const numModulesX = Math.floor(w / params.screen.dimensions.moduleWidth);
        const numModulesY = Math.floor(h / params.screen.dimensions.moduleHeight);
        const modW = sw / numModulesX;
        const modH = sh / numModulesY;
        ctx.strokeStyle = params.moduleBorderColor;
        ctx.lineWidth = 1;
        for (let my = 0; my < numModulesY; my++) {
          for (let mx = 0; mx < numModulesX; mx++) {
            ctx.strokeRect(sx + mx * modW, sy + my * modH, modW, modH);
          }
        }
      }
    }

    if (params.borderWidth > 0) {
      ctx.strokeStyle = params.borderColor;
      ctx.lineWidth = params.borderWidth * z;
      const half = (params.borderWidth * z) / 2;
      ctx.strokeRect(sx + half, sy + half, sw - params.borderWidth * z, sh - params.borderWidth * z);
    }

    if (params.showLabels && params.labels[index]) {
      const labelColor = params.labelColorMode === 'auto'
        ? (isColorDark(bgColor) ? '#FFFFFF' : '#000000')
        : params.labelColor;
      ctx.fillStyle = labelColor;
      drawLabel(ctx, params.labels[index], sx, sy, sw, sh, params.labelFontSize, labelColor, params.labelPosition, z);
    }

    if (params.showSliceOffsetLabels && params.sliceOffsetLabels[index]) {
      drawSliceOffsetLabel(ctx, params.sliceOffsetLabels[index], sx + 4 * z, sy + 4 * z, z);
    }

    if (selectedSet.has(tile.id)) {
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.lineWidth = 2 * z;
      ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
    }
  };

  if (hasSections) {
    let tileOffset = 0;
    let globalColOffset = 0;
    for (let si = 0; si < params.sections.length; si++) {
      const section = params.sections[si];
      const sectionX = (layout.sectionPixelXOffsets[si] ?? 0);
      for (let y = 0; y < params.effectiveScreenHeight; y++) {
        const isTopHalf = params.topHalfTile && y === 0;
        const isBottomHalf = params.bottomHalfTile && y === params.effectiveScreenHeight - 1;
        const rowH = (isTopHalf || isBottomHalf) ? section.tileHeightPx / 2 : section.tileHeightPx;
        const rowY = layout.sectionRowPixelOffsets[y] ?? 0;
        for (let x = 0; x < section.columnCount; x++) {
          const index = tileOffset + y * section.columnCount + x;
          const tile = params.tiles[index];
          if (!tile) continue;
          const drawX = sectionX + x * section.tileWidthPx;
          drawTile(tile, index, globalColOffset + x, y, drawX, rowY, section.tileWidthPx, rowH);
        }
      }
      tileOffset += section.columnCount * params.effectiveScreenHeight;
      globalColOffset += section.columnCount;
    }
  } else {
    for (let y = 0; y < params.effectiveScreenHeight; y++) {
      const isTopHalf = params.topHalfTile && y === 0;
      const isBottomHalf = params.bottomHalfTile && y === params.effectiveScreenHeight - 1;
      const rowH = (isTopHalf || isBottomHalf) ? params.screen.dimensions.tileHeight / 2 : params.screen.dimensions.tileHeight;
      const rowY = layout.rowPixelOffsets[y] ?? 0;
      for (let x = 0; x < params.effectiveScreenWidth; x++) {
        const isLeftHalf = params.leftHalfTile && x === 0;
        const isRightHalf = params.rightHalfTile && x === params.effectiveScreenWidth - 1;
        const colW = (isLeftHalf || isRightHalf) ? params.screen.dimensions.tileWidth / 2 : params.screen.dimensions.tileWidth;
        const colX = layout.columnPixelOffsets[x] ?? 0;
        const index = y * params.effectiveScreenWidth + x;
        const tile = params.tiles[index];
        if (!tile) continue;
        drawTile(tile, index, x, y, colX, rowY, colW, rowH);
      }
    }
  }

  ctx.restore();
}

export function hitTestTile(
  mouseGridX: number,
  mouseGridY: number,
  layout: GridLayout,
  effectiveScreenWidth: number,
  effectiveScreenHeight: number,
  hasSections: boolean,
  sections: ScreenSection[],
): number | null {
  if (hasSections) {
    let tileOffset = 0;
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      const sectionX = layout.sectionPixelXOffsets[si] ?? 0;
      const sectionW = section.tileWidthPx * section.columnCount;
      if (mouseGridX < sectionX || mouseGridX >= sectionX + sectionW) {
        tileOffset += section.columnCount * effectiveScreenHeight;
        continue;
      }
      const localX = Math.floor((mouseGridX - sectionX) / section.tileWidthPx);
      if (localX < 0 || localX >= section.columnCount) return null;
      // Find y by scanning row offsets
      for (let y = 0; y < effectiveScreenHeight; y++) {
        const rowTop = layout.sectionRowPixelOffsets[y] ?? 0;
        const rowBottom = layout.sectionRowPixelOffsets[y + 1] ?? 0;
        if (mouseGridY >= rowTop && mouseGridY < rowBottom) {
          return tileOffset + y * section.columnCount + localX;
        }
      }
      return null;
    }
    return null;
  }
  if (mouseGridX < 0 || mouseGridY < 0) return null;
  let tileX = -1;
  for (let x = 0; x < effectiveScreenWidth; x++) {
    if (mouseGridX >= (layout.columnPixelOffsets[x] ?? 0) && mouseGridX < (layout.columnPixelOffsets[x + 1] ?? 0)) {
      tileX = x;
      break;
    }
  }
  if (tileX < 0) return null;
  let tileY = -1;
  for (let y = 0; y < effectiveScreenHeight; y++) {
    if (mouseGridY >= (layout.rowPixelOffsets[y] ?? 0) && mouseGridY < (layout.rowPixelOffsets[y + 1] ?? 0)) {
      tileY = y;
      break;
    }
  }
  if (tileY < 0) return null;
  return tileY * effectiveScreenWidth + tileX;
}
