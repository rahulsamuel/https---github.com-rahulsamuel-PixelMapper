
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { cn, isColorDark } from "@/lib/utils";

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
    showDataLabels,
  } = usePixelMapper();

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
    gridTemplateRows: `repeat(${dimensions.screenHeight}, 1fr)`,
    width: `${dimensions.screenWidth * dimensions.tileWidth}px`,
    height: `${dimensions.screenHeight * dimensions.tileHeight}px`,
    borderWidth: '1px',
    borderColor: 'hsl(var(--border))',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  };

  const baseTileStyle: React.CSSProperties = {
    width: `${dimensions.tileWidth}px`,
    height: `${dimensions.tileHeight}px`,
    borderWidth: `${borderWidth}px`,
    borderColor: borderColor,
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

          const tileDynamicStyle = {
            ...baseTileStyle,
            backgroundColor: bgColor,
            borderWidth: tile.deleted ? '0px' : `${borderWidth}px`,
          };

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(index)}
              className={cn(
                'relative rounded-none transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:z-10'
              )}
              style={tileDynamicStyle}
              aria-label={`Tile ${index + 1}`}
            >
              {showDataLabels && !tile.deleted && sliceOffsetLabels[index] && (
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
