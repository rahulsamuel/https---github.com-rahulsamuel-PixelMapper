

"use client";

import { usePixelMap, type TextOverlay } from "@/contexts/pixel-map-context";
import { cn, isColorDark } from "@/lib/utils";
import { useMemo, useRef, useCallback, useState } from "react";
import { Trash2 } from "lucide-react";

export function LedGrid() {
  const {
    gridRef,
    dimensions,
    tiles,
    labels,
    handleTileClick,
    tileColor,
    tileColorTwo,
    borderWidth,
    borderColor,
    showLabels,
    labelFontSize,
    labelColor,
    labelColorMode,
    labelPosition,
    showScreenName,
    screenNameLabelPosition,
    screenNameLabelFontSize,
    screenNameLabelColor,
    screenNameLabelColorMode,
    showResolution,
    resolutionLabelPosition,
    resolutionLabelFontSize,
    resolutionLabelColor,
    resolutionLabelColorMode,
    showDimensions,
    dimensionUnit,
    dimensionLabelSize,
    dimensionLabelColor,
    zoom,
    onOffMode,
    sliceOffsetLabels,
    showSliceOffsetLabels,
    topHalfTile,
    bottomHalfTile,
    leftHalfTile,
    rightHalfTile,
    effectiveScreenHeight,
    effectiveScreenWidth,
    showModules,
    moduleBorderColor,
    randomizeModuleColors,
    currentScreen,
    products,
    updateTextOverlay,
    removeTextOverlay,
    activeTool,
    selectionRect,
    selectedTileIds,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
  } = usePixelMap();

  const selectedProduct = useMemo(() => products.find(p => p.id === currentScreen.selectedProductId) ?? null, [products, currentScreen.selectedProductId]);

  const { totalGridPixelWidth, totalGridPixelHeight } = useMemo(() => {
    let width = 0;
    for (let i = 0; i < effectiveScreenWidth; i++) {
        const isLeftHalf = leftHalfTile && i === 0;
        const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
        width += isLeftHalf || isRightHalf ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }

    let height = 0;
    for (let i = 0; i < effectiveScreenHeight; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        const isBottomHalfRow = bottomHalfTile && i === effectiveScreenHeight - 1;
        height += (isTopHalfRow || isBottomHalfRow) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }
    return { totalGridPixelWidth: width, totalGridPixelHeight: height };
  }, [dimensions, effectiveScreenWidth, effectiveScreenHeight, leftHalfTile, rightHalfTile, topHalfTile, bottomHalfTile]);


  if (tiles.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <p>Set dimensions to see the grid.</p>
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${effectiveScreenWidth}, auto)`,
    gridTemplateRows: `repeat(${effectiveScreenHeight}, auto)`,
    width: `${totalGridPixelWidth}px`,
    height: `${totalGridPixelHeight}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  };
  
  const getTileHeight = (y: number) => {
    const isTopHalfRow = topHalfTile && y === 0;
    const isBottomHalfRow = bottomHalfTile && y === effectiveScreenHeight - 1;

    if (isTopHalfRow || isBottomHalfRow) {
      return dimensions.tileHeight / 2;
    }
    return dimensions.tileHeight;
  };

  const getTileWidth = (x: number) => {
    const isLeftHalfCol = leftHalfTile && x === 0;
    const isRightHalfCol = rightHalfTile && x === effectiveScreenWidth - 1;

    if (isLeftHalfCol || isRightHalfCol) {
        return dimensions.tileWidth / 2;
    }
    return dimensions.tileWidth;
  };
  
  const averageBackgroundColor = useMemo(() => {
    const activeTiles = tiles.filter(t => !t.deleted);
    if (activeTiles.length === 0) return tileColor;
    // For simplicity, just use the first tile's potential color
    return tiles[0]?.color || tileColor;
  }, [tiles, tileColor]);

  const currentScreenNameLabelColor = screenNameLabelColorMode === 'auto'
    ? isColorDark(averageBackgroundColor) ? '#FFFFFF' : '#000000'
    : screenNameLabelColor;

  const currentResolutionLabelColor = resolutionLabelColorMode === 'auto'
    ? isColorDark(averageBackgroundColor) ? '#FFFFFF' : '#000000'
    : resolutionLabelColor;

  const resolutionText = `Pixel: ${totalGridPixelWidth} x ${totalGridPixelHeight}`;

  // Physical dimension calculations
  const tileWmm = selectedProduct?.tileWidthMm as number | undefined;
  const tileHmm = selectedProduct?.tileHeightMm as number | undefined;
  const screenWmm = tileWmm ? tileWmm * effectiveScreenWidth : 0;
  const screenHmm = tileHmm ? tileHmm * effectiveScreenHeight : 0;

  const fmtMm = (mm: number) => {
    if (mm >= 1000) return `${(mm / 1000).toFixed(2)}m`;
    return `${Math.round(mm)}mm`;
  };
  const fmtInch = (mm: number) => `${(mm / 25.4).toFixed(1)}"`;

  const widthLabel = (() => {
    if (!screenWmm) return '';
    const parts: string[] = [];
    if (dimensionUnit === 'imperial' || dimensionUnit === 'all') parts.push(fmtInch(screenWmm));
    if (dimensionUnit === 'standard' || dimensionUnit === 'all') parts.push(fmtMm(screenWmm));
    return parts.join(' / ');
  })();
  const heightLabel = (() => {
    if (!screenHmm) return '';
    const parts: string[] = [];
    if (dimensionUnit === 'imperial' || dimensionUnit === 'all') parts.push(fmtInch(screenHmm));
    if (dimensionUnit === 'standard' || dimensionUnit === 'all') parts.push(fmtMm(screenHmm));
    return parts.join(' / ');
  })();

  const isSelectionMode = activeTool === 'delete' || activeTool === 'color';

  return (
    <div>
      <div style={{ width: totalGridPixelWidth * zoom, height: totalGridPixelHeight * zoom }} className="relative">
        <div
          ref={gridRef}
          style={gridStyle}
          className="bg-muted"
          onMouseDown={isSelectionMode ? handleGridMouseDown : undefined}
          onMouseMove={isSelectionMode ? handleGridMouseMove : undefined}
          onMouseUp={isSelectionMode ? handleGridMouseUp : undefined}
          onMouseLeave={isSelectionMode ? handleGridMouseUp : undefined}
        >
          {tiles.map((tile, index) => {
            const x = index % effectiveScreenWidth;
            const y = Math.floor(index / effectiveScreenWidth);

            let bgColor;
            if (onOffMode) {
              bgColor = tile.deleted ? '#000000' : '#FFFFFF';
            } else {
              if (tile.deleted) {
                bgColor = '#000000';
              } else if (tile.color) {
                bgColor = tile.color;
              } else {
                bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
              }
            }

            const currentLabelColor = labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : labelColor;

            const tileEffectiveHeight = getTileHeight(y);
            const tileEffectiveWidth = getTileWidth(x);

            const tileDynamicStyle: React.CSSProperties = {
              width: `${tileEffectiveWidth}px`,
              height: `${tileEffectiveHeight}px`,
              borderWidth: `${borderWidth}px`,
              borderColor: borderColor,
              backgroundColor: randomizeModuleColors ? 'transparent' : bgColor,
              borderStyle: tile.deleted ? 'none' : 'solid',
              boxSizing: 'border-box',
            };

            const numModulesX = Math.floor(tileEffectiveWidth / dimensions.moduleWidth);
            const numModulesY = Math.floor(tileEffectiveHeight / dimensions.moduleHeight);
            const totalModules = numModulesX * numModulesY;

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                className={cn(
                  'relative rounded-none transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:z-10',
                  selectedTileIds.includes(tile.id) && 'ring-2 ring-blue-500 z-10'
                )}
                style={{ ...tileDynamicStyle, cursor: isSelectionMode ? 'crosshair' : undefined }}
                aria-label={`Tile ${index + 1}`}
              >
                {showModules && !tile.deleted && (
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${numModulesX}, 1fr)`, gridTemplateRows: `repeat(${numModulesY}, 1fr)`}}>
                    {Array.from({ length: totalModules }).map((_, i) => {
                      const moduleStyle: React.CSSProperties = {
                        border: `1px solid ${moduleBorderColor}`,
                        backgroundColor: randomizeModuleColors ? currentScreen.moduleColors[index]?.[i] ?? '#000000' : bgColor,
                      };
                      return (
                        <div key={i} style={moduleStyle} />
                      );
                    })}
                  </div>
                )}
                {showSliceOffsetLabels && !tile.deleted && sliceOffsetLabels[index] && (
                    <div
                        className="absolute top-1 left-1 bg-black/60 text-white text-xs font-mono px-1 py-0.5 rounded z-20"
                    >
                        {sliceOffsetLabels[index]}
                    </div>
                )}
                {showLabels && !tile.deleted && (
                  <span
                    className={cn(
                      "absolute font-bold pointer-events-none drop-shadow-sm",
                      {
                          'top-1 left-2': labelPosition === 'top-left',
                          'top-1 right-2 text-right': labelPosition === 'top-right',
                          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center': labelPosition === 'center',
                          'bottom-1 left-2': labelPosition === 'bottom-left',
                          'bottom-1 right-2 text-right': labelPosition === 'bottom-right',
                      }
                    )}
                    style={{
                      fontSize: `${labelFontSize}px`,
                      color: currentLabelColor,
                    }}
                  >
                    {labels[index]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectionRect && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.endX) * zoom,
              top: Math.min(selectionRect.startY, selectionRect.endY) * zoom,
              width: Math.abs(selectionRect.endX - selectionRect.startX) * zoom,
              height: Math.abs(selectionRect.endY - selectionRect.startY) * zoom,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.8)',
            }}
          />
        )}
        {showScreenName && (
            <div
                className={cn(
                    "absolute font-bold pointer-events-none drop-shadow-lg z-30",
                    {
                        'top-4 left-4': screenNameLabelPosition === 'top-left',
                        'top-4 right-4 text-right': screenNameLabelPosition === 'top-right',
                        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center': screenNameLabelPosition === 'center',
                        'bottom-4 left-4': screenNameLabelPosition === 'bottom-left',
                        'bottom-4 right-4 text-right': screenNameLabelPosition === 'bottom-right',
                    }
                )}
                 style={{
                    fontSize: `${screenNameLabelFontSize}px`,
                    color: currentScreenNameLabelColor,
                    transform: `scale(${zoom}) ${screenNameLabelPosition.includes('center') ? 'translate(-50%, -50%)' : ''}`,
                    transformOrigin: 'top left',
                    left: screenNameLabelPosition.includes('center') ? '50%' : (screenNameLabelPosition.includes('left') ? '1rem' : undefined),
                    right: screenNameLabelPosition.includes('right') ? '1rem' : undefined,
                 }}
            >
                {currentScreen.name}
            </div>
        )}
        {showResolution && (
            <div
                className="absolute font-bold pointer-events-none drop-shadow-lg z-30"
                style={{
                    fontSize: `${resolutionLabelFontSize * zoom}px`,
                    color: currentResolutionLabelColor,
                    top: resolutionLabelPosition.startsWith('top') ? '1rem' :
                         resolutionLabelPosition === 'center' ? '50%' : undefined,
                    bottom: resolutionLabelPosition.startsWith('bottom') ? '1rem' : undefined,
                    left: resolutionLabelPosition === 'center' || resolutionLabelPosition === 'top-center' || resolutionLabelPosition === 'bottom-center'
                        ? '50%'
                        : resolutionLabelPosition.endsWith('left') ? '1rem' : undefined,
                    right: resolutionLabelPosition.endsWith('right') ? '1rem' : undefined,
                    transform: (resolutionLabelPosition === 'center' || resolutionLabelPosition === 'top-center' || resolutionLabelPosition === 'bottom-center')
                        ? (resolutionLabelPosition === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)')
                        : undefined,
                    textAlign: (resolutionLabelPosition === 'center' || resolutionLabelPosition === 'top-center' || resolutionLabelPosition === 'bottom-center')
                        ? 'center' : resolutionLabelPosition.endsWith('right') ? 'right' : 'left',
                }}
            >
                {resolutionText}
            </div>
        )}
        {showDimensions && selectedProduct && screenWmm > 0 && screenHmm > 0 && (
          <DimensionOverlay
            gridWidth={totalGridPixelWidth}
            gridHeight={totalGridPixelHeight}
            zoom={zoom}
            widthLabel={widthLabel}
            heightLabel={heightLabel}
            fontSize={dimensionLabelSize}
            color={dimensionLabelColor}
          />
        )}
        {(currentScreen.textOverlays ?? []).map((overlay) => (
          <DraggableTextOverlay
            key={overlay.id}
            overlay={overlay}
            zoom={zoom}
            gridWidth={totalGridPixelWidth}
            gridHeight={totalGridPixelHeight}
            averageBgColor={averageBackgroundColor}
            onUpdate={updateTextOverlay}
            onRemove={removeTextOverlay}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTextOverlay({
  overlay,
  zoom,
  gridWidth,
  gridHeight,
  averageBgColor,
  onUpdate,
  onRemove,
}: {
  overlay: TextOverlay;
  zoom: number;
  gridWidth: number;
  gridHeight: number;
  averageBgColor: string;
  onUpdate: (id: string, updates: Partial<TextOverlay>) => void;
  onRemove: (id: string) => void;
}) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const currentColor =
    overlay.colorMode === 'auto'
      ? isColorDark(averageBgColor) ? '#FFFFFF' : '#000000'
      : overlay.color;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: overlay.x,
      origY: overlay.y,
    };
    setIsDragging(true);
  }, [overlay.x, overlay.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current || !isDragging) return;
    const dx = (e.clientX - dragState.current.startX) / zoom;
    const dy = (e.clientY - dragState.current.startY) / zoom;
    const newX = Math.max(0, Math.min(gridWidth - 20, dragState.current.origX + dx));
    const newY = Math.max(0, Math.min(gridHeight - 10, dragState.current.origY + dy));
    onUpdate(overlay.id, { x: newX, y: newY });
  }, [isDragging, zoom, gridWidth, gridHeight, overlay.id, onUpdate]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragState.current = null;
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={dragRef}
      className="absolute z-40 select-none"
      style={{
        left: `${overlay.x * zoom}px`,
        top: `${overlay.y * zoom}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative group"
        style={{
          transform: `rotate(${overlay.rotation}deg)`,
          transformOrigin: 'center',
        }}
      >
        <div
          className="font-bold whitespace-nowrap drop-shadow-lg"
          style={{
            fontSize: `${overlay.fontSize * zoom}px`,
            color: currentColor,
            fontWeight: overlay.fontWeight,
            backgroundColor: overlay.showBackground ? overlay.backgroundColor : 'transparent',
            padding: overlay.showBackground ? '4px 10px' : '0',
            borderRadius: overlay.showBackground ? '4px' : '0',
            lineHeight: 1.2,
          }}
        >
          {overlay.text || ' '}
        </div>
        {(isHovered || isDragging) && (
          <button
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors z-50"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onRemove(overlay.id); }}
            title="Delete text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function DimensionOverlay({
  gridWidth,
  gridHeight,
  zoom,
  widthLabel,
  heightLabel,
  fontSize,
  color,
}: {
  gridWidth: number;
  gridHeight: number;
  zoom: number;
  widthLabel: string;
  heightLabel: string;
  fontSize: number;
  color: string;
}) {
  const scaledW = gridWidth * zoom;
  const scaledH = gridHeight * zoom;
  const offset = 28;
  const arrowSize = 8;
  const fs = fontSize * zoom;
  const stroke = 2;

  return (
    <div className="absolute pointer-events-none z-30" style={{ left: -offset, top: -offset }}>
      <svg
        width={scaledW + offset * 2}
        height={scaledH + offset * 2}
        style={{ overflow: 'visible' }}
      >
        {/* Width dimension (bottom) */}
        <g>
          <line
            x1={offset} y1={scaledH + offset / 2}
            x2={scaledW + offset} y2={scaledH + offset / 2}
            stroke={color} strokeWidth={stroke}
          />
          <polygon
            points={`${offset},${scaledH + offset / 2} ${offset + arrowSize},${scaledH + offset / 2 - arrowSize / 2} ${offset + arrowSize},${scaledH + offset / 2 + arrowSize / 2}`}
            fill={color}
          />
          <polygon
            points={`${scaledW + offset},${scaledH + offset / 2} ${scaledW + offset - arrowSize},${scaledH + offset / 2 - arrowSize / 2} ${scaledW + offset - arrowSize},${scaledH + offset / 2 + arrowSize / 2}`}
            fill={color}
          />
          <line x1={offset} y1={scaledH + offset / 2 - 6} x2={offset} y2={scaledH + offset / 2 + 6} stroke={color} strokeWidth={1} />
          <line x1={scaledW + offset} y1={scaledH + offset / 2 - 6} x2={scaledW + offset} y2={scaledH + offset / 2 + 6} stroke={color} strokeWidth={1} />
          <text
            x={offset + scaledW / 2}
            y={scaledH + offset / 2 + fs + 4}
            textAnchor="middle"
            fontSize={fs}
            fill={color}
            fontWeight="bold"
          >
            {widthLabel}
          </text>
        </g>

        {/* Height dimension (right side) */}
        <g>
          <line
            x1={scaledW + offset / 2 + offset} y1={offset}
            x2={scaledW + offset / 2 + offset} y2={scaledH + offset}
            stroke={color} strokeWidth={stroke}
          />
          <polygon
            points={`${scaledW + offset / 2 + offset},${offset} ${scaledW + offset / 2 + offset - arrowSize / 2},${offset + arrowSize} ${scaledW + offset / 2 + offset + arrowSize / 2},${offset + arrowSize}`}
            fill={color}
          />
          <polygon
            points={`${scaledW + offset / 2 + offset},${scaledH + offset} ${scaledW + offset / 2 + offset - arrowSize / 2},${scaledH + offset - arrowSize} ${scaledW + offset / 2 + offset + arrowSize / 2},${scaledH + offset - arrowSize}`}
            fill={color}
          />
          <line x1={scaledW + offset / 2 + offset - 6} y1={offset} x2={scaledW + offset / 2 + offset + 6} y2={offset} stroke={color} strokeWidth={1} />
          <line x1={scaledW + offset / 2 + offset - 6} y1={scaledH + offset} x2={scaledW + offset / 2 + offset + 6} y2={scaledH + offset} stroke={color} strokeWidth={1} />
          <text
            x={scaledW + offset / 2 + offset + fs + 4}
            y={offset + scaledH / 2}
            textAnchor="middle"
            fontSize={fs}
            fill={color}
            fontWeight="bold"
            transform={`rotate(90, ${scaledW + offset / 2 + offset + fs + 4}, ${offset + scaledH / 2})`}
          >
            {heightLabel}
          </text>
        </g>
      </svg>
    </div>
  );
}
