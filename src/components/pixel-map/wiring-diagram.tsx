
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { useState, useEffect, useMemo } from "react";
import { cn, isColorDark } from "@/lib/utils";

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
    labelPosition,
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
    showSliceOffsetLabels,
    topHalfTile,
    bottomHalfTile,
    effectiveScreenHeight,
    wiringData,
    rasterMapConfig,
    currentScreen
  } = usePixelMap();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const rowData = useMemo(() => {
    const data: { yPos: number; height: number }[] = [];
    let currentY = 0;
    for (let i = 0; i < effectiveScreenHeight; i++) {
        const isTopHalfRow = topHalfTile && i === 0;
        const isBottomHalfRow = bottomHalfTile && i === effectiveScreenHeight - 1;
        
        let rowHeight = dimensions.tileHeight;
        if (isTopHalfRow || isBottomHalfRow) {
            rowHeight /= 2;
        }

        data.push({ yPos: currentY, height: rowHeight });
        currentY += rowHeight;
    }
    return data;
  }, [dimensions, topHalfTile, bottomHalfTile, effectiveScreenHeight]);

  const totalGridPixelHeight = rowData.reduce((acc, curr) => acc + curr.height, 0);
  const totalGridPixelWidth = dimensions.screenWidth * dimensions.tileWidth;

  const getSliceBorderColor = () => {
    if (!rasterMapConfig) return '';
    switch(rasterMapConfig.resolutionType) {
        case 'hd': return 'border-chart-1';
        case '4k-uhd': return 'border-chart-2';
        case '4k-dci': return 'border-chart-4';
        case 'custom': return 'border-chart-3';
        case 'content':
        default: return 'border-primary';
    }
  }

  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div className="p-4 bg-muted/20">
      <div style={{ width: totalGridPixelWidth * zoom, height: totalGridPixelHeight * zoom }}>
        <div 
          ref={wiringDiagramRef}
          className="relative bg-background"
          style={{ 
            width: totalGridPixelWidth, 
            height: totalGridPixelHeight,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {wiringData.map(({ x, y, dataLabel, powerPortLabel, backupLabel, isDeleted, sliceOffsetLabel }, index) => {
            const originalIndex = y * dimensions.screenWidth + x;
            const tile = tiles[originalIndex];
            if (!tile) return null; // Guard against out of bounds if arrays desync
            
            const { yPos, height: tileHeight } = rowData[y];

            let bgColor;
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

            const tileStyle = {
              top: yPos,
              width: dimensions.tileWidth,
              height: tileHeight,
              backgroundColor: bgColor,
              border: isDeleted ? 'none' : `${borderWidth}px solid ${borderColor}`,
              boxSizing: 'border-box',
              ...(isWiringMirrored ? { right: x * dimensions.tileWidth } : { left: x * dimensions.tileWidth }),
            };
            
            const currentLabelColor = labelColorMode === 'auto'
              ? isColorDark(bgColor) ? '#FFFFFF' : '#000000'
              : labelColor;

            return (
              <div
                key={`wiring-tile-${tile.id}`}
                className="absolute overflow-visible"
                style={tileStyle}
              >
                {!isDeleted && (
                  <>
                    {showLabels && labels[originalIndex] && (
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
                          opacity: 0.7,
                        }}
                      >
                        {labels[originalIndex]}
                      </span>
                    )}
                    {showSliceOffsetLabels && sliceOffsetLabel && (
                        <div
                            className="absolute top-1 left-1 bg-black/60 text-white text-xs font-mono px-1 py-0.5 rounded z-20"
                        >
                            {sliceOffsetLabel}
                        </div>
                    )}
                    <div
                      className="flex flex-col items-center justify-center h-full w-full text-foreground relative"
                    >
                      {showDataLabels && (backupLabel || dataLabel) && (
                        <div 
                          className={`rounded-full flex items-center justify-center font-bold z-10 ${backupLabel ? 'bg-destructive text-destructive-foreground' : 'bg-data-wiring text-data-wiring-foreground'}`}
                          style={{
                            width: `${dataLabelSize}px`,
                            height: `${dataLabelSize}px`,
                            fontSize: `${Math.max(8, dataLabelSize * 0.4)}px`,
                          }}
                        >
                          <span>{backupLabel || dataLabel}</span>
                        </div>
                      )}
                      {showPowerLabels && powerPortLabel && (
                         <div 
                            className="bg-power-wiring text-power-wiring-foreground rounded-full flex items-center justify-center font-bold z-10"
                            style={{
                              width: `${powerLabelSize}px`,
                              height: `${powerLabelSize}px`,
                              fontSize: `${Math.max(8, powerLabelSize * 0.4)}px`,
                            }}
                         >
                            <span>{powerPortLabel}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
           <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
              style={{
                width: dimensions.screenWidth * dimensions.tileWidth,
                height: totalGridPixelHeight,
              }}
            >
              {/* Data Arrows */}
              {isClient && showDataLabels && wiringData.map(({ x, y, nextTile, isDeleted }) => {
                if (isDeleted || !nextTile) return null;
                
                const startRow = rowData[y];
                const endRow = rowData[nextTile.y];

                const startX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - x) : x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                const startY_center = startRow.yPos + startRow.height / 2;
                const endX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - nextTile.x) : nextTile.x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                const endY_center = endRow.yPos + endRow.height / 2;
                
                const dx = endX_center - startX_center;
                const dy = endY_center - startY_center;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= arrowGap * 2) return null;

                const nx = dx / distance;
                const ny = dy / distance;
                const x1 = startX_center + nx * arrowGap;
                const y1 = startY_center + ny * arrowGap;
                const x2 = endX_center - nx * arrowGap;
                const y2 = endY_center - ny * arrowGap;
                
                const tipX = x2;
                const tipY = y2;
                const baseCenterX = tipX - nx * arrowheadLength;
                const baseCenterY = tipY - ny * arrowheadLength;
                const p2x = baseCenterX - ny * (arrowheadSize / 2);
                const p2y = baseCenterY + nx * (arrowheadSize / 2);
                const p3x = baseCenterX + ny * (arrowheadSize / 2);
                const p3y = baseCenterY - nx * (arrowheadSize / 2);
                const arrowheadPoints = `${tipX},${tipY} ${p2x},${p2y} ${p3x},${p3y}`;

                return (
                  <g key={`data-arrow-${x}-${y}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--data-wiring))" strokeWidth="3" />
                     <polygon points={arrowheadPoints} fill="hsl(var(--data-wiring))" />
                  </g>
                );
              })}

              {/* Power Arrows */}
              {isClient && showPowerLabels && wiringData.map(({ x, y, nextPowerTile, isDeleted }) => {
                if (isDeleted || !nextPowerTile) return null;

                const startRow = rowData[y];
                const endRow = rowData[nextPowerTile.y];

                const startX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - x) : x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                const startY_center = startRow.yPos + startRow.height / 2;
                const endX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - nextPowerTile.x) : nextPowerTile.x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                const endY_center = endRow.yPos + endRow.height / 2;
                
                const dx = endX_center - startX_center;
                const dy = endY_center - startY_center;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= powerArrowGap * 2) return null;

                const nx = dx / distance;
                const ny = dy / distance;

                const x1 = startX_center + nx * powerArrowGap;
                const y1 = startY_center + ny * powerArrowGap;
                const x2 = endX_center - nx * powerArrowGap;
                const y2 = endY_center - ny * powerArrowGap;
                
                const tipX = x2;
                const tipY = y2;
                const baseCenterX = tipX - nx * powerArrowheadLength;
                const baseCenterY = tipY - ny * powerArrowheadLength;
                const p2x = baseCenterX - ny * (powerArrowheadSize / 2);
                const p2y = baseCenterY + nx * (powerArrowheadSize / 2);
                const p3x = baseCenterX + ny * (powerArrowheadSize / 2);
                const p3y = baseCenterY - nx * (powerArrowheadSize / 2);
                const arrowheadPoints = `${tipX},${tipY} ${p2x},${p2y} ${p3x},${p3y}`;

                return (
                  <g key={`power-arrow-${x}-${y}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--power-wiring))" strokeWidth="2" />
                     <polygon points={arrowheadPoints} fill="hsl(var(--power-wiring))" />
                  </g>
                );
              })}
            </svg>
        </div>
        {/* Raster Slice Borders - rendered outside the ref so they don't get downloaded */}
        {rasterMapConfig && rasterMapConfig.slices && (
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
            style={{ 
              width: totalGridPixelWidth, 
              height: totalGridPixelHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {rasterMapConfig.screenArrangement.map(arrangement => {
              if (arrangement.screenId !== currentScreen.id) return null;

              return rasterMapConfig.slices.map(slice => {
                  // Check if the slice overlaps with the current screen arrangement
                  const overlap = (
                      arrangement.x < slice.x + slice.width &&
                      arrangement.x + arrangement.width > slice.x &&
                      arrangement.y < slice.y + slice.height &&
                      arrangement.y + arrangement.height > slice.y
                  );
                  if (!overlap) return null;

                  return (
                      <div 
                          key={slice.key} 
                          className={cn(
                              "absolute border-2 border-dashed flex items-center justify-center",
                              getSliceBorderColor()
                          )}
                          style={{
                              left: slice.x - arrangement.x,
                              top: slice.y - arrangement.y,
                              width: slice.width,
                              height: slice.height,
                              boxSizing: 'border-box'
                          }}
                      >
                         <div 
                            className="text-center p-2 rounded-md bg-background/80"
                            style={{
                                transform: `scale(${Math.min(2, Math.max(0.5, 1 / zoom))})`, // Adjust label size based on zoom
                                transformOrigin: 'center center',
                            }}
                          >
                              <p className="font-bold whitespace-nowrap">{slice.filename.split('/').pop()?.replace('.png','').replace('raster-map-','')}</p>
                              <p className="font-mono text-xs whitespace-nowrap">Size: {slice.width}x{slice.height}</p>
                          </div>
                      </div>
                  )
              });
            })}
          </div>
        )}
      </div>
    </div>
  );
}

    