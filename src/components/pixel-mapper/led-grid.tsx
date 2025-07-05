
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
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
    zoom,
    onOffMode,
    sliceOffsetLabels,
    showSliceOffsetLabels,
    topHalfTile,
    bottomHalfTile,
    effectiveScreenHeight,
  } = usePixelMapper();

  const totalGridPixelHeight = useMemo(() => {
    return (dimensions.screenHeight * dimensions.tileHeight) + 
           (topHalfTile ? dimensions.tileHeight / 2 : 0) + 
           (bottomHalfTile ? dimensions.tileHeight / 2 : 0);
  }, [dimensions.screenHeight, dimensions.tileHeight, topHalfTile, bottomHalfTile]);


  if (tiles.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <p>Set dimensions to see the grid.</p>
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${dimensions.screenWidth}, 1fr)`,
    gridTemplateRows: `repeat(${effectiveScreenHeight}, auto)`,
    width: `${dimensions.screenWidth * dimensions.tileWidth}px`,
    height: `${totalGridPixelHeight}px`,
    borderWidth: '1px',
    borderColor: 'hsl(var(--border))',
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

  return (
    <div className="bg-muted/20 p-4">
      <div ref={gridRef} style={gridStyle} className="bg-muted">
        {tiles.map((tile, index) => {
          const x = index % dimensions.screenWidth;
          const y = Math.floor(index / dimensions.screenWidth);

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

          const tileDynamicStyle: React.CSSProperties = {
            width: `${dimensions.tileWidth}px`,
            height: `${tileEffectiveHeight}px`,
            borderWidth: `${borderWidth}px`,
            borderColor: borderColor,
            backgroundColor: bgColor,
            borderStyle: tile.deleted ? 'none' : 'solid',
          };

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
    </div>
  );
}
