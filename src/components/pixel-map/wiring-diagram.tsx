
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { isColorDark } from "@/lib/utils";

export function WiringDiagram() {
  const {
    dimensions,
    tiles,
    tileColor,
    tileColorTwo,
    onOffMode,
    zoom,
    showDataLabels,
    showPowerLabels,
    labels,
    showLabels,
    labelFontSize,
    labelColor,
    labelColorMode,
    arrowheadSize,
    arrowheadLength,
    arrowGap,
    powerArrowheadSize,
    powerArrowheadLength,
    powerArrowGap,
    wiringDiagramRef,
    isWiringMirrored,
    borderWidth,
    borderColor,
    dataLabelSize,
    powerLabelSize,
    dataLabelColor,
    powerLabelColor,
    showSliceOffsetLabels,
    topHalfTile,
    bottomHalfTile,
    leftHalfTile,
    rightHalfTile,
    effectiveScreenHeight,
    effectiveScreenWidth,
    sections,
    wiringData,
    handleTileClick,
  } = usePixelMap();

  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const dataCanvasRef = useRef<HTMLCanvasElement>(null);
  const powerCanvasRef = useRef<HTMLCanvasElement>(null);

  const rowData = useMemo(() => {
    const data: { yPos: number; height: number }[] = [];
    let currentY = 0;
    const sectionHeight = sections[0]?.tileHeightPx ?? dimensions.tileHeight;
    for (let i = 0; i < effectiveScreenHeight; i++) {
      const isTopHalfRow = topHalfTile && i === 0;
      const isBottomHalfRow = bottomHalfTile && i === effectiveScreenHeight - 1;
      const rowHeight = (isTopHalfRow || isBottomHalfRow) ? sectionHeight / 2 : sectionHeight;
      data.push({ yPos: currentY, height: rowHeight });
      currentY += rowHeight;
    }
    return data;
  }, [dimensions, topHalfTile, bottomHalfTile, effectiveScreenHeight, sections]);

  const colData = useMemo(() => {
    const data: { xPos: number; width: number }[] = [];
    let currentX = 0;
    if (sections.length > 0) {
      for (const section of sections) {
        for (let i = 0; i < section.columnCount; i++) {
          data.push({ xPos: currentX, width: section.tileWidthPx });
          currentX += section.tileWidthPx;
        }
      }
      return data;
    }
    for (let i = 0; i < effectiveScreenWidth; i++) {
      const isLeftHalf = leftHalfTile && i === 0;
      const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
      const colWidth = (isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
      data.push({ xPos: currentX, width: colWidth });
      currentX += colWidth;
    }
    return data;
  }, [dimensions, leftHalfTile, rightHalfTile, effectiveScreenWidth, sections]);

  const totalGridPixelWidth = useMemo(
    () => colData.reduce((acc, c) => acc + c.width, 0),
    [colData],
  );
  const totalGridPixelHeight = useMemo(
    () => rowData.reduce((acc, r) => acc + r.height, 0),
    [rowData],
  );

  const visualTileCoordinates = useMemo(() => {
    const coordinates: { x: number; y: number }[] = [];
    if (sections.length === 0) {
      for (let index = 0; index < tiles.length; index++) coordinates.push({ x: index % effectiveScreenWidth, y: Math.floor(index / effectiveScreenWidth) });
      return coordinates;
    }
    let tileOffset = 0;
    let columnOffset = 0;
    for (const section of sections) {
      for (let y = 0; y < effectiveScreenHeight; y++) {
        for (let x = 0; x < section.columnCount; x++) {
          coordinates[tileOffset + y * section.columnCount + x] = { x: columnOffset + x, y };
        }
      }
      tileOffset += section.columnCount * effectiveScreenHeight;
      columnOffset += section.columnCount;
    }
    return coordinates;
  }, [sections, tiles.length, effectiveScreenWidth, effectiveScreenHeight]);

  const tileIndexForVisualCoordinate = useCallback((x: number, y: number) => {
    const coordinateIndex = visualTileCoordinates.findIndex(coordinate => coordinate?.x === x && coordinate?.y === y);
    return coordinateIndex >= 0 ? coordinateIndex : null;
  }, [visualTileCoordinates]);

  const getTileCenter = useCallback(
    (tileIndex: number) => {
      const coord = visualTileCoordinates[tileIndex];
      if (!coord) return null;
      const col = colData[coord.x];
      const row = rowData[coord.y];
      if (!col || !row) return null;
      const cx = isWiringMirrored
        ? totalGridPixelWidth - col.xPos - col.width / 2
        : col.xPos + col.width / 2;
      const cy = row.yPos + row.height / 2;
      return { cx, cy };
    },
    [colData, rowData, isWiringMirrored, totalGridPixelWidth, visualTileCoordinates],
  );

  // ── Draw base layer (tiles, borders, custom labels) ────────────────────
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || tiles.length === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = totalGridPixelWidth;
    const h = totalGridPixelHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    wiringData.forEach(({ x, y, isDeleted }, index) => {
      const originalIndex = index;
      const coordinate = visualTileCoordinates[originalIndex];
      if (!coordinate) return;
      const visualX = coordinate.x;
      const tile = tiles[originalIndex];
      if (!tile) return;

      const row = rowData[coordinate.y];
      const col = colData[visualX];
      if (!row || !col) return;

      const drawX = isWiringMirrored ? totalGridPixelWidth - col.xPos - col.width : col.xPos;
      const drawY = row.yPos;
      const tw = col.width;
      const th = row.height;

      let bgColor: string;
      if (onOffMode) {
        bgColor = isDeleted ? '#000000' : '#FFFFFF';
      } else {
        if (isDeleted) {
          bgColor = '#000000';
        } else if (tile.color) {
          bgColor = tile.color;
        } else {
          bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
        }
      }

      ctx.fillStyle = bgColor;
      ctx.fillRect(drawX, drawY, tw, th);

      if (!isDeleted && borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(drawX + borderWidth / 2, drawY + borderWidth / 2, tw - borderWidth, th - borderWidth);
      }

      if (!isDeleted) {
        const currentLabelColor = labelColorMode === 'auto'
          ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
          : labelColor;

        if (showLabels && labels[originalIndex]) {
          ctx.fillStyle = currentLabelColor;
          ctx.globalAlpha = 0.7;
          ctx.font = `bold ${labelFontSize}px sans-serif`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(labels[originalIndex], drawX + 4, drawY + labelFontSize + 2);
          ctx.globalAlpha = 1;
        }

        if (showSliceOffsetLabels && wiringData[index]?.sliceOffsetLabel) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(drawX + 2, drawY + 2, 40, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textBaseline = 'top';
          ctx.fillText(wiringData[index].sliceOffsetLabel!, drawX + 4, drawY + 3);
        }
      }
    });
  }, [
    tiles, wiringData, rowData, colData, totalGridPixelWidth, totalGridPixelHeight,
    onOffMode, tileColor, tileColorTwo, borderWidth, borderColor,
    showLabels, labels, labelFontSize, labelColor, labelColorMode,
    isWiringMirrored, showSliceOffsetLabels, effectiveScreenWidth, visualTileCoordinates,
  ]);

  // ── Draw data layer (data labels + data arrows) ────────────────────────
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    if (!canvas || tiles.length === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = totalGridPixelWidth;
    const h = totalGridPixelHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (!showDataLabels) return;

    // Data label circles
    wiringData.forEach((entry, index) => {
      const { dataLabel, backupLabel, isDeleted } = entry;
      if (isDeleted || (!backupLabel && !dataLabel)) return;
      const coord = visualTileCoordinates[index];
      if (!coord) return;
      const row = rowData[coord.y];
      const col = colData[coord.x];
      if (!row || !col) return;

      const drawX = isWiringMirrored ? totalGridPixelWidth - col.xPos - col.width : col.xPos;
      const cx = drawX + col.width / 2;
      const cy = row.yPos + row.height / 2;
      const offset = showPowerLabels ? (dataLabelSize / 2) + 2 : 0;
      const labelY = cy - offset;

      const label = backupLabel || dataLabel;
      const r = dataLabelSize / 2;
      ctx.beginPath();
      ctx.arc(cx, labelY, r, 0, Math.PI * 2);
      ctx.fillStyle = backupLabel ? '#ef4444' : dataLabelColor;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, dataLabelSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, labelY);
      ctx.textAlign = 'left';
    });

    // Data arrows
    ctx.strokeStyle = dataLabelColor;
    ctx.fillStyle = dataLabelColor;
    ctx.lineWidth = 3;
    wiringData.forEach((entry, index) => {
      const { nextTile, isDeleted } = entry;
      if (isDeleted || !nextTile) return;
      const nextIndex = visualTileCoordinates.findIndex(c => c && c.x === nextTile.x && c.y === nextTile.y);
      if (nextIndex < 0) return;
      const start = getTileCenter(index);
      const end = getTileCenter(nextIndex);
      if (!start || !end) return;

      const dx = end.cx - start.cx;
      const dy = end.cy - start.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= arrowGap * 2) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const x1 = start.cx + nx * arrowGap;
      const y1 = start.cy + ny * arrowGap;
      const x2 = end.cx - nx * arrowGap;
      const y2 = end.cy - ny * arrowGap;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const baseCX = x2 - nx * arrowheadLength;
      const baseCY = y2 - ny * arrowheadLength;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(baseCX - ny * (arrowheadSize / 2), baseCY + nx * (arrowheadSize / 2));
      ctx.lineTo(baseCX + ny * (arrowheadSize / 2), baseCY - nx * (arrowheadSize / 2));
      ctx.closePath();
      ctx.fill();
    });
  }, [
    wiringData, rowData, colData, totalGridPixelWidth, totalGridPixelHeight,
    showDataLabels, showPowerLabels, dataLabelSize, dataLabelColor,
    arrowheadSize, arrowheadLength, arrowGap, isWiringMirrored, getTileCenter, visualTileCoordinates,
  ]);

  // ── Draw power layer (power labels + power arrows) ─────────────────────
  useEffect(() => {
    const canvas = powerCanvasRef.current;
    if (!canvas || tiles.length === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = totalGridPixelWidth;
    const h = totalGridPixelHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (!showPowerLabels) return;

    // Power label circles
    wiringData.forEach((entry, index) => {
      const { powerPortLabel, isDeleted } = entry;
      if (isDeleted || !powerPortLabel) return;
      const coord = visualTileCoordinates[index];
      if (!coord) return;
      const row = rowData[coord.y];
      const col = colData[coord.x];
      if (!row || !col) return;

      const drawX = isWiringMirrored ? totalGridPixelWidth - col.xPos - col.width : col.xPos;
      const cx = drawX + col.width / 2;
      const cy = row.yPos + row.height / 2;
      const dataInfo = showDataLabels ? entry : null;
      const offset = (dataInfo && (dataInfo.backupLabel || dataInfo.dataLabel))
        ? (powerLabelSize / 2) + 2
        : 0;
      const labelY = cy + offset;

      const r = powerLabelSize / 2;
      ctx.beginPath();
      ctx.arc(cx, labelY, r, 0, Math.PI * 2);
      ctx.fillStyle = powerLabelColor;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, powerLabelSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerPortLabel, cx, labelY);
      ctx.textAlign = 'left';
    });

    // Power arrows
    ctx.strokeStyle = powerLabelColor;
    ctx.fillStyle = powerLabelColor;
    ctx.lineWidth = 2;
    wiringData.forEach((entry, index) => {
      const { nextPowerTile, isDeleted } = entry;
      if (isDeleted || !nextPowerTile) return;
      const nextIndex = visualTileCoordinates.findIndex(c => c && c.x === nextPowerTile.x && c.y === nextPowerTile.y);
      if (nextIndex < 0) return;
      const start = getTileCenter(index);
      const end = getTileCenter(nextIndex);
      if (!start || !end) return;

      const dx = end.cx - start.cx;
      const dy = end.cy - start.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= powerArrowGap * 2) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const x1 = start.cx + nx * powerArrowGap;
      const y1 = start.cy + ny * powerArrowGap;
      const x2 = end.cx - nx * powerArrowGap;
      const y2 = end.cy - ny * powerArrowGap;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const baseCX = x2 - nx * powerArrowheadLength;
      const baseCY = y2 - ny * powerArrowheadLength;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(baseCX - ny * (powerArrowheadSize / 2), baseCY + nx * (powerArrowheadSize / 2));
      ctx.lineTo(baseCX + ny * (powerArrowheadSize / 2), baseCY - nx * (powerArrowheadSize / 2));
      ctx.closePath();
      ctx.fill();
    });
  }, [
    wiringData, rowData, colData, totalGridPixelWidth, totalGridPixelHeight,
    showPowerLabels, showDataLabels, powerLabelSize, powerLabelColor,
    powerArrowheadSize, powerArrowheadLength, powerArrowGap, isWiringMirrored,
    getTileCenter, visualTileCoordinates,
  ]);

  // ── Click handling ─────────────────────────────────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = baseCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = totalGridPixelWidth / rect.width;
      const scaleY = totalGridPixelHeight / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      for (let yi = 0; yi < rowData.length; yi++) {
        const row = rowData[yi];
        if (canvasY < row.yPos || canvasY >= row.yPos + row.height) continue;
        for (let xi = 0; xi < colData.length; xi++) {
          const col = colData[xi];
          const drawX = isWiringMirrored
            ? totalGridPixelWidth - col.xPos - col.width
            : col.xPos;
          if (canvasX >= drawX && canvasX < drawX + col.width) {
            const tileIndex = tileIndexForVisualCoordinate(xi, yi);
            if (tileIndex !== null) {
              const tile = tiles[tileIndex];
              if (tile) handleTileClick(tile.id);
            }
            return;
          }
        }
      }
    },
    [rowData, colData, tiles, handleTileClick, isWiringMirrored, totalGridPixelWidth, totalGridPixelHeight, tileIndexForVisualCoordinate],
  );

  if (tiles.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <p>Set dimensions and apply to see the wiring diagram.</p>
      </div>
    );
  }

  return (
    <div
      ref={wiringDiagramRef}
      style={{
        width: totalGridPixelWidth * zoom,
        height: totalGridPixelHeight * zoom,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <canvas
        ref={baseCanvasRef}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          cursor: 'pointer',
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
        }}
      />
      <canvas
        ref={dataCanvasRef}
        data-wiring-type="data"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
        }}
      />
      <canvas
        ref={powerCanvasRef}
        data-wiring-type="power"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
        }}
      />
    </div>
  );
}
