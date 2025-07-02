"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { cn } from "@/lib/utils";

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
    zoom,
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
    <div
      className="h-full w-full overflow-auto bg-muted/20 p-4"
    >
        <div
            ref={gridRef}
            style={gridStyle}
            className="bg-muted"
        >
            {tiles.map((tile, index) => {
                const x = index % dimensions.screenWidth;
                const y = Math.floor(index / dimensions.screenWidth);
                const bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;

                return (
                    <button
                        key={tile.id}
                        onClick={() => handleTileClick(index)}
                        className={cn(
                        "relative rounded-none transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 flex items-center justify-center",
                        tile.deleted ? "opacity-10" : "opacity-100"
                        )}
                        style={{ ...baseTileStyle, backgroundColor: bgColor }}
                        aria-label={`Tile ${index + 1}`}
                    >
                        <div className="absolute inset-0 border border-white/20 rounded-full" />
                        {showLabels && !tile.deleted && (
                            <span
                                className="font-bold text-center pointer-events-none drop-shadow-sm"
                                style={{
                                    fontSize: `${labelFontSize}px`,
                                    color: labelColor,
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
