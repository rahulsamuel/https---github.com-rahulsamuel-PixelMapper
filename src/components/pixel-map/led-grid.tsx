

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
    updateTextOverlay,
    removeTextOverlay,
  } = usePixelMap();

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

  return (
    <div>
      <div style={{ width: totalGridPixelWidth * zoom, height: totalGridPixelHeight * zoom }} className="relative">
        <div ref={gridRef} style={gridStyle} className="bg-muted">
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
                  'relative rounded-none transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:z-10'
                )}
                style={tileDynamicStyle}
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
