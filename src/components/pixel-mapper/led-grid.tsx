"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

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
  } = usePixelMapper();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setZoom((prevZoom) => Math.max(0.1, Math.min(prevZoom + scaleAmount, 5)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return; // Middle mouse button for panning
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };
  
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
        container.addEventListener('mouseup', handleMouseUp);
        return () => container.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isPanning]);


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
  };

  const baseTileStyle: React.CSSProperties = {
    width: `${dimensions.tileWidth}px`,
    height: `${dimensions.tileHeight}px`,
    borderWidth: `${borderWidth}px`,
    borderColor: borderColor,
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{ cursor: 'grab' }}
    >
        <div 
            className="absolute inset-0 transition-transform duration-100 ease-out"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
            <div
                ref={gridRef}
                style={gridStyle}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted"
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
                            <div className="absolute inset-2 border border-white/20 rounded-full" />
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
        <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 5))}><ZoomIn/></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))}><ZoomOut/></Button>
            <Button variant="outline" size="icon" onClick={resetZoomAndPan}><Maximize/></Button>
        </div>
    </div>
  );
}
