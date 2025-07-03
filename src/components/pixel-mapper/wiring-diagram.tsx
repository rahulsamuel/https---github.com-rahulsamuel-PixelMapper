
"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { getWiringData } from "@/lib/wiring";
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export function WiringDiagram() {
  const { 
    dimensions, 
    tiles, 
    tileColor, 
    tileColorTwo, 
    onOffMode, 
    wiringPortConfig,
    tilesPerPowerString,
    zoom,
    showDataLabels,
    showPowerLabels,
    labels,
    showLabels,
    labelColor,
    wiringPattern,
    powerWiringPattern,
    arrowheadSize,
    arrowheadLength,
    arrowGap,
    powerArrowheadSize,
    powerArrowheadLength,
    powerArrowGap,
    rasterMapConfig,
    activeBounds,
    wiringDiagramRef,
    isWiringMirrored,
    setIsWiringMirrored,
    borderWidth,
    borderColor,
  } = usePixelMapper();

  const [isMounted, setIsMounted] = useState(false);
  const [dataWiringColor, setDataWiringColor] = useState('hsl(140, 60%, 40%)'); // Fallback color
  const [powerWiringColor, setPowerWiringColor] = useState('hsl(0, 84.2%, 60.2%)'); // Fallback color

  useEffect(() => {
    setIsMounted(true);
    // We need to wait for the component to be mounted to access computed styles from CSS variables
    const computedDataColor = getComputedStyle(document.documentElement).getPropertyValue('--data-wiring').trim();
    if (computedDataColor) {
      setDataWiringColor(`hsl(${computedDataColor})`);
    }
    const computedPowerColor = getComputedStyle(document.documentElement).getPropertyValue('--power-wiring').trim();
    if (computedPowerColor) {
      setPowerWiringColor(`hsl(${computedPowerColor})`);
    }
  }, []);

  const wiringData = getWiringData({ dimensions, tiles, wiringPortConfig, wiringPattern, powerWiringPattern, rasterMapConfig, activeBounds, tilesPerPowerString });
  
  const dataPortsCount = wiringData.filter(d => d.dataLabel).length;
  const powerPortsCount = wiringData.filter(d => d.powerPortLabel).length;

  let portCount = 0;
  let portLabelText = '';

  if (showDataLabels) {
    portCount = dataPortsCount;
    portLabelText = 'Data Ports';
  } else if (showPowerLabels) {
    portCount = powerPortsCount;
    portLabelText = 'Power Ports';
  }

  if (tiles.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Set dimensions and apply to see the wiring diagram.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-background p-4 border-b flex justify-between items-center">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">Wiring Diagram</h2>
          {portCount > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              ({portCount} {portLabelText})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="mirror-switch" checked={isWiringMirrored} onCheckedChange={setIsWiringMirrored} />
            <Label htmlFor="mirror-switch" className="flex items-center gap-2"><RefreshCw className="size-4" /> Mirror</Label>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="p-4 bg-muted/20">
          <div 
            ref={wiringDiagramRef}
            className="relative bg-background"
            style={{ 
              width: dimensions.screenWidth * dimensions.tileWidth, 
              height: dimensions.screenHeight * dimensions.tileHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {wiringData.map(({ x, y, dataLabel, powerPortLabel, backupLabel, isDeleted }, index) => {
              const originalIndex = y * dimensions.screenWidth + x;
              const tile = tiles[originalIndex];

              let bgColor;
              if (onOffMode) {
                bgColor = isDeleted ? '#000000' : '#FFFFFF';
              } else {
                if (isDeleted) {
                  bgColor = '#000000';
                } else if (tile?.color) {
                  bgColor = tile.color;
                } else {
                  bgColor = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
                }
              }

              const tileStyle = {
                top: y * dimensions.tileHeight,
                width: dimensions.tileWidth,
                height: dimensions.tileHeight,
                backgroundColor: bgColor,
                border: isDeleted ? 'none' : `${borderWidth}px solid ${borderColor}`,
                boxSizing: 'border-box',
                ...(isWiringMirrored ? { right: x * dimensions.tileWidth } : { left: x * dimensions.tileWidth }),
              };
              
              const currentLabelColor = onOffMode ? '#000000' : labelColor;

              return (
                <div
                  key={`wiring-tile-${x}-${y}`}
                  className="absolute overflow-visible"
                  style={tileStyle}
                >
                  {!isDeleted && (
                    <>
                      {showLabels && labels[originalIndex] && (
                        <span 
                          className="absolute top-1 left-2 font-mono text-lg font-bold pointer-events-none"
                          style={{ color: currentLabelColor, opacity: 0.7 }}
                        >
                          {labels[originalIndex]}
                        </span>
                      )}
                      <div
                        className="flex flex-col items-center justify-center h-full w-full text-foreground relative"
                      >
                        {showDataLabels && (backupLabel || dataLabel) && (
                          <div className={`rounded-full size-10 flex items-center justify-center text-sm font-bold z-10 ${backupLabel ? 'bg-destructive text-destructive-foreground' : 'bg-data-wiring text-data-wiring-foreground'}`}>
                            <span>{backupLabel || dataLabel}</span>
                          </div>
                        )}
                        {showPowerLabels && powerPortLabel && (
                           <div className="bg-power-wiring text-power-wiring-foreground rounded-full size-10 flex items-center justify-center text-sm font-bold z-10">
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
                  height: dimensions.screenHeight * dimensions.tileHeight,
                }}
              >
                {/* Data Arrows */}
                {isMounted && showDataLabels && wiringData.map(({ x, y, nextTile, isDeleted }) => {
                  if (isDeleted || !nextTile) return null;

                  const startX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - x) : x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                  const startY_center = y * dimensions.tileHeight + dimensions.tileHeight / 2;
                  const endX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - nextTile.x) : nextTile.x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                  const endY_center = nextTile.y * dimensions.tileHeight + dimensions.tileHeight / 2;
                  
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
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dataWiringColor} strokeWidth="3" />
                       <polygon points={arrowheadPoints} fill={dataWiringColor} />
                    </g>
                  );
                })}

                {/* Power Arrows */}
                {isMounted && showPowerLabels && wiringData.map(({ x, y, nextPowerTile, isDeleted }) => {
                  if (isDeleted || !nextPowerTile) return null;

                  const startX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - x) : x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                  const startY_center = y * dimensions.tileHeight + dimensions.tileHeight / 2;
                  const endX_center = (isWiringMirrored ? (dimensions.screenWidth - 1 - nextPowerTile.x) : nextPowerTile.x) * dimensions.tileWidth + dimensions.tileWidth / 2;
                  const endY_center = nextPowerTile.y * dimensions.tileHeight + dimensions.tileHeight / 2;
                  
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
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={powerWiringColor} strokeWidth="2" />
                       <polygon points={arrowheadPoints} fill={powerWiringColor} />
                    </g>
                  );
                })}
              </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
