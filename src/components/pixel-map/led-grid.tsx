

"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { cn, isColorDark } from "@/lib/utils";
import { useMemo } from "react";

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


  return (
    <div className="bg-muted/20 p-4">
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
      </div>
    </div>
  );
}
