

"use client";

import { usePixelMap, type TextOverlay, type LogoOverlay } from "@/contexts/pixel-map-context";
import { cn, isColorDark } from "@/lib/utils";
import { useMemo, useRef, useCallback, useState, useEffect } from "react";
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
    customTileWidthMm,
    customTileHeightMm,
    zoom,
    onOffMode,
    alternatingPixels,
    sliceOffsetLabels,
    showSliceOffsetLabels,
    topHalfTile,
    bottomHalfTile,
    leftHalfTile,
    rightHalfTile,
    effectiveScreenHeight,
    effectiveScreenWidth,
    effectiveScreenWidthFromSections,
    showModules,
    moduleBorderColor,
    randomizeModuleColors,
    currentScreen,
    products,
    updateTextOverlay,
    removeTextOverlay,
    logoOverlay,
    setLogoOverlay,
    showLogoOverlay,
    activeTool,
    selectionRect,
    selectedTileIds,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
    sections,
  } = usePixelMap();

  const selectedProduct = useMemo(() => products.find(p => p.id === currentScreen.selectedProductId) ?? null, [products, currentScreen.selectedProductId]);

  const checkerboardBg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2'><rect x='1' width='1' height='1' fill='black'/><rect y='1' width='1' height='1' fill='black'/></svg>")`;

  const hasSections = sections.length > 0;

  const { totalGridPixelWidth, totalGridPixelHeight } = useMemo(() => {
    if (hasSections) {
      let width = 0;
      for (const section of sections) {
        width += section.tileWidthPx * section.columnCount;
      }
      let height = 0;
      for (let i = 0; i < effectiveScreenHeight; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        const isBottomHalfRow = bottomHalfTile && i === effectiveScreenHeight - 1;
        const sectionTileHeight = sections[0]?.tileHeightPx ?? dimensions.tileHeight;
        height += (isTopHalfRow || isBottomHalfRow) ? sectionTileHeight / 2 : sectionTileHeight;
      }
      return { totalGridPixelWidth: width, totalGridPixelHeight: height };
    }
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
  }, [dimensions, effectiveScreenWidth, effectiveScreenHeight, leftHalfTile, rightHalfTile, topHalfTile, bottomHalfTile, sections, hasSections]);


  if (tiles.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
        <p>Set dimensions to see the grid.</p>
      </div>
    );
  }

  const gridStyle: React.CSSProperties = hasSections ? {
    display: "flex",
    width: `${totalGridPixelWidth}px`,
    height: `${totalGridPixelHeight}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  } : {
    display: "grid",
    gridTemplateColumns: `repeat(${effectiveScreenWidth}, auto)`,
    gridTemplateRows: `repeat(${effectiveScreenHeight}, auto)`,
    width: `${totalGridPixelWidth}px`,
    height: `${totalGridPixelHeight}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  };

  const getTileHeight = (y: number, sectionTileHeight?: number) => {
    const baseHeight = sectionTileHeight ?? dimensions.tileHeight;
    const isTopHalfRow = topHalfTile && y === 0;
    const isBottomHalfRow = bottomHalfTile && y === effectiveScreenHeight - 1;

    if (isTopHalfRow || isBottomHalfRow) {
      return baseHeight / 2;
    }
    return baseHeight;
  };

  const getTileWidth = (x: number) => {
    const isLeftHalfCol = leftHalfTile && x === 0;
    const isRightHalfCol = rightHalfTile && x === effectiveScreenWidth - 1;

    if (isLeftHalfCol || isRightHalfCol) {
        return dimensions.tileWidth / 2;
    }
    return dimensions.tileWidth;
  };

  // Compute the tile index offset for each section (for continuous labeling)
  const sectionTileOffsets = useMemo(() => {
    if (!hasSections) return [];
    const offsets: number[] = [];
    let cumulative = 0;
    for (const section of sections) {
      offsets.push(cumulative);
      cumulative += section.columnCount * effectiveScreenHeight;
    }
    return offsets;
  }, [sections, hasSections, effectiveScreenHeight]);

  const columnPixelOffsets = useMemo(() => {
    if (hasSections) return [];
    const offsets = [0];
    for (let x = 0; x < effectiveScreenWidth; x++) {
      const isLeftHalf = leftHalfTile && x === 0;
      const isRightHalf = rightHalfTile && x === effectiveScreenWidth - 1;
      offsets.push(offsets[offsets.length - 1] + ((isLeftHalf || isRightHalf) ? dimensions.tileWidth / 2 : dimensions.tileWidth));
    }
    return offsets;
  }, [hasSections, effectiveScreenWidth, leftHalfTile, rightHalfTile, dimensions.tileWidth]);

  const rowPixelOffsets = useMemo(() => {
    if (hasSections) return [];
    const offsets = [0];
    for (let y = 0; y < effectiveScreenHeight; y++) {
      const isTopHalf = topHalfTile && y === 0;
      const isBottomHalf = bottomHalfTile && y === effectiveScreenHeight - 1;
      offsets.push(offsets[offsets.length - 1] + ((isTopHalf || isBottomHalf) ? dimensions.tileHeight / 2 : dimensions.tileHeight));
    }
    return offsets;
  }, [hasSections, effectiveScreenHeight, topHalfTile, bottomHalfTile, dimensions.tileHeight]);

  const sectionPixelXOffsets = useMemo(() => {
    if (!hasSections) return [];
    const offsets = [0];
    for (const section of sections) {
      offsets.push(offsets[offsets.length - 1] + section.tileWidthPx * section.columnCount);
    }
    return offsets;
  }, [hasSections, sections]);

  const sectionRowPixelOffsets = useMemo(() => {
    if (!hasSections) return [];
    const sectionTileHeight = sections[0]?.tileHeightPx ?? dimensions.tileHeight;
    const offsets = [0];
    for (let y = 0; y < effectiveScreenHeight; y++) {
      const isTopHalf = topHalfTile && y === 0;
      const isBottomHalf = bottomHalfTile && y === effectiveScreenHeight - 1;
      offsets.push(offsets[offsets.length - 1] + ((isTopHalf || isBottomHalf) ? sectionTileHeight / 2 : sectionTileHeight));
    }
    return offsets;
  }, [hasSections, sections, dimensions.tileHeight, effectiveScreenHeight, topHalfTile, bottomHalfTile]);

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
  const tileWmm = hasSections
    ? sections.reduce((sum, section) => sum + (section.tileWidthMm || 0) * section.columnCount, 0) / Math.max(1, effectiveScreenWidthFromSections)
    : (selectedProduct?.tileWidthMm as number | undefined) || customTileWidthMm || 0;
  const tileHmm = hasSections
    ? (sections[0]?.tileHeightMm || 0)
    : (selectedProduct?.tileHeightMm as number | undefined) || customTileHeightMm || 0;
  const screenWmm = hasSections
    ? sections.reduce((sum, section) => sum + (section.tileWidthMm || 0) * section.columnCount, 0)
    : tileWmm ? tileWmm * effectiveScreenWidth : 0;
  const screenHmm = tileHmm ? tileHmm * effectiveScreenHeight : 0;

  const fmtMm = (mm: number) => `${Math.round(mm)}mm`;
  const fmtMeters = (mm: number) => `${(mm / 1000).toFixed(3)}m`;
  const fmtInches = (mm: number) => `${(mm / 25.4).toFixed(2)}"`;
  const fmtDecimalFeet = (mm: number) => `${(mm / 304.8).toFixed(2)}ft`;
  const fmtFeetInches = (mm: number) => {
    const totalInches = mm / 25.4;
    const feet = Math.floor(totalInches / 12);
    const remainingInches = totalInches - feet * 12;
    const inchStr = formatFractionalInch(remainingInches);
    return `${feet}' ${inchStr}"`;
  };
  const fmtLabel = (mm: number) => {
    switch (dimensionUnit) {
      case 'mm': return fmtMm(mm);
      case 'meters': return fmtMeters(mm);
      case 'inches': return fmtInches(mm);
      case 'decimal-feet': return fmtDecimalFeet(mm);
      case 'feet-inches': return fmtFeetInches(mm);
      case 'tiles': return `${effectiveScreenWidthFromSections} tiles`;
      default: return `${fmtFeetInches(mm)} / ${fmtMm(mm)}`;
    }
  };

  const widthLabel = dimensionUnit === 'tiles' ? `${effectiveScreenWidthFromSections} tiles` : (screenWmm ? fmtLabel(screenWmm) : '');
  const heightLabel = dimensionUnit === 'tiles' ? `${effectiveScreenHeight} tiles` : (screenHmm ? fmtLabel(screenHmm) : '');

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
          {hasSections ? (
            sections.map((section, sectionIdx) => {
              const sectionWidth = section.tileWidthPx * section.columnCount;
              const tileOffset = sectionTileOffsets[sectionIdx];
              const sectionColumnOffset = sections
                .slice(0, sectionIdx)
                .reduce((total, previousSection) => total + previousSection.columnCount, 0);
              return (
                <div
                  key={section.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${section.columnCount}, ${section.tileWidthPx}px)`,
                    gridTemplateRows: `repeat(${effectiveScreenHeight}, auto)`,
                    width: `${sectionWidth}px`,
                    height: `${totalGridPixelHeight}px`,
                  }}
                >
                  {Array.from({ length: section.columnCount * effectiveScreenHeight }, (_, i) => {
                    const localX = i % section.columnCount;
                    const localY = Math.floor(i / section.columnCount);
                    const globalX = sectionColumnOffset + localX;
                    const index = tileOffset + i;
                    const tile = tiles[index];
                    if (!tile) return null;

                    let bgColor;
                    if (onOffMode) {
                      bgColor = tile.deleted ? '#000000' : '#FFFFFF';
                    } else {
                      if (tile.deleted) {
                        bgColor = '#000000';
                      } else if (tile.color) {
                        bgColor = tile.color;
                      } else {
                        bgColor = (globalX + localY) % 2 === 0 ? tileColor : tileColorTwo;
                      }
                    }

                    const currentLabelColor = labelColorMode === 'auto'
                      ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
                      : labelColor;

                    const tileEffectiveHeight = getTileHeight(localY, section.tileHeightPx);
                    const tileEffectiveWidth = section.tileWidthPx;

                    const absPxX = (sectionPixelXOffsets[sectionIdx] ?? 0) + localX * section.tileWidthPx;
                    const absPxY = sectionRowPixelOffsets[localY] ?? 0;
                    const tileDynamicStyle: React.CSSProperties = {
                      width: `${tileEffectiveWidth}px`,
                      height: `${tileEffectiveHeight}px`,
                      borderWidth: `${borderWidth}px`,
                      borderColor: borderColor,
                      backgroundColor: randomizeModuleColors ? 'transparent' : bgColor,
                      backgroundImage: alternatingPixels && !tile.deleted ? checkerboardBg : undefined,
                      backgroundSize: alternatingPixels && !tile.deleted ? '2px 2px' : undefined,
                      backgroundPosition: alternatingPixels && !tile.deleted ? `${-(absPxX % 2)}px ${-(absPxY % 2)}px` : undefined,
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
                            {Array.from({ length: totalModules }).map((_, mi) => {
                              const moduleStyle: React.CSSProperties = {
                                border: `1px solid ${moduleBorderColor}`,
                                backgroundColor: alternatingPixels ? 'transparent' : (randomizeModuleColors ? currentScreen.moduleColors[index]?.[mi] ?? '#000000' : bgColor),
                              };
                              return (
                                <div key={mi} style={moduleStyle} />
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
              );
            })
          ) : (
          tiles.map((tile, index) => {
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

            const absPxX = columnPixelOffsets[x] ?? 0;
            const absPxY = rowPixelOffsets[y] ?? 0;
            const tileDynamicStyle: React.CSSProperties = {
              width: `${tileEffectiveWidth}px`,
              height: `${tileEffectiveHeight}px`,
              borderWidth: `${borderWidth}px`,
              borderColor: borderColor,
              backgroundColor: randomizeModuleColors ? 'transparent' : bgColor,
              backgroundImage: alternatingPixels && !tile.deleted ? checkerboardBg : undefined,
              backgroundSize: alternatingPixels && !tile.deleted ? '2px 2px' : undefined,
              backgroundPosition: alternatingPixels && !tile.deleted ? `${-(absPxX % 2)}px ${-(absPxY % 2)}px` : undefined,
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
                        backgroundColor: alternatingPixels ? 'transparent' : (randomizeModuleColors ? currentScreen.moduleColors[index]?.[i] ?? '#000000' : bgColor),
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
          })
        )}
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
        {showDimensions && ((screenWmm > 0 && screenHmm > 0) || dimensionUnit === 'tiles') && (
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
        {logoOverlay && showLogoOverlay && (
          <DraggableLogoOverlay
            overlay={logoOverlay}
            zoom={zoom}
            gridWidth={totalGridPixelWidth}
            gridHeight={totalGridPixelHeight}
            onUpdate={setLogoOverlay}
          />
        )}
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

function formatFractionalInch(inches: number): string {
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const denominators = [2, 4, 8, 16, 32];
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestDiff = frac;
  for (const denom of denominators) {
    const numerator = Math.round(frac * denom);
    const diff = Math.abs(frac - numerator / denom);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestNumerator = numerator;
      bestDenominator = denom;
    }
  }
  if (bestNumerator === 0) return `${whole}`;
  const gcf = (a: number, b: number): number => b === 0 ? a : gcf(b, a % b);
  const divisor = gcf(bestNumerator, bestDenominator);
  const num = bestNumerator / divisor;
  const denom = bestDenominator / divisor;
  return `${whole} ${num}/${denom}`;
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
  const fs = fontSize * zoom;
  const padding = fs * 1.5;
  const arrowSize = Math.max(6, fs * 0.4);
  const stroke = 2;
  const shadow = 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))';

  return (
    <div className="absolute pointer-events-none z-30" style={{ left: 0, top: 0, width: scaledW, height: scaledH }}>
      <svg width={scaledW} height={scaledH} style={{ overflow: 'visible' }}>
        {/* Width dimension (bottom, inside grid) */}
        <g>
          <line x1={0} y1={scaledH} x2={0} y2={scaledH - padding - arrowSize} stroke={color} strokeWidth={1} />
          <line x1={scaledW} y1={scaledH} x2={scaledW} y2={scaledH - padding - arrowSize} stroke={color} strokeWidth={1} />
          <line x1={arrowSize} y1={scaledH - padding} x2={scaledW - arrowSize} y2={scaledH - padding} stroke={color} strokeWidth={stroke} />
          <polygon points={`0,${scaledH - padding} ${arrowSize},${scaledH - padding - arrowSize / 2} ${arrowSize},${scaledH - padding + arrowSize / 2}`} fill={color} />
          <polygon points={`${scaledW},${scaledH - padding} ${scaledW - arrowSize},${scaledH - padding - arrowSize / 2} ${scaledW - arrowSize},${scaledH - padding + arrowSize / 2}`} fill={color} />
          <text x={scaledW / 2} y={scaledH - padding - fs * 0.7} textAnchor="middle" fontSize={fs} fill={color} fontWeight="bold" style={{ filter: shadow }}>
            {widthLabel}
          </text>
        </g>

        {/* Height dimension (right, inside grid) */}
        {heightLabel && (
        <g>
          <line x1={scaledW} y1={0} x2={scaledW - padding - arrowSize} y2={0} stroke={color} strokeWidth={1} />
          <line x1={scaledW} y1={scaledH} x2={scaledW - padding - arrowSize} y2={scaledH} stroke={color} strokeWidth={1} />
          <line x1={scaledW - padding} y1={arrowSize} x2={scaledW - padding} y2={scaledH - arrowSize} stroke={color} strokeWidth={stroke} />
          <polygon points={`${scaledW - padding},0 ${scaledW - padding - arrowSize / 2},${arrowSize} ${scaledW - padding + arrowSize / 2},${arrowSize}`} fill={color} />
          <polygon points={`${scaledW - padding},${scaledH} ${scaledW - padding - arrowSize / 2},${scaledH - arrowSize} ${scaledW - padding + arrowSize / 2},${scaledH - arrowSize}`} fill={color} />
          <text
            x={scaledW - padding - fs * 0.7}
            y={scaledH / 2}
            textAnchor="middle"
            fontSize={fs}
            fill={color}
            fontWeight="bold"
            transform={`rotate(-90, ${scaledW - padding - fs * 0.7}, ${scaledH / 2})`}
            style={{ filter: shadow }}
          >
            {heightLabel}
          </text>
        </g>
        )}
      </svg>
    </div>
  );
}

function DraggableLogoOverlay({
  overlay,
  zoom,
  gridWidth,
  gridHeight,
  onUpdate,
}: {
  overlay: LogoOverlay;
  zoom: number;
  gridWidth: number;
  gridHeight: number;
  onUpdate: (updater: (prev: LogoOverlay | null) => LogoOverlay | null) => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: overlay.x, origY: overlay.y };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      const maxX = gridWidth - overlay.width;
      const maxY = gridHeight - overlay.height;
      const nx = Math.max(0, Math.min(maxX, dragRef.current.origX + dx));
      const ny = Math.max(0, Math.min(maxY, dragRef.current.origY + dy));
      onUpdate(prev => prev ? { ...prev, x: nx, y: ny } : prev);
    };
    const handleUp = () => { setIsDragging(false); dragRef.current = null; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, zoom, gridWidth, gridHeight, overlay.width, overlay.height, onUpdate]);

  return (
    <div
      className="absolute z-40 cursor-move select-none"
      style={{
        left: overlay.x * zoom,
        top: overlay.y * zoom,
        width: overlay.width * zoom,
        height: overlay.height * zoom,
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={overlay.imageData}
        alt="Logo overlay"
        draggable={false}
        className="w-full h-full object-contain pointer-events-none"
        style={{ opacity: isDragging ? 0.7 : 1 }}
      />
      <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-primary/50 rounded pointer-events-none" style={{ display: isDragging ? 'block' : 'none' }} />
    </div>
  );
}
