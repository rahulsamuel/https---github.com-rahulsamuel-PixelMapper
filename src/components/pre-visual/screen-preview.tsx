"use client";

import { useMemo } from "react";
import type { PreVisualScreenData, PreVisualSettings } from "./types";

interface ScreenPreviewProps {
  screen: PreVisualScreenData;
  settings: PreVisualSettings;
}

const MM_TO_PX = 0.5;

export function ScreenPreview({ screen, settings }: ScreenPreviewProps) {
  const tiles = useMemo(() => {
    const columns = screen.sections.length > 0
      ? screen.sections.reduce((sum, section) => sum + section.columnCount, 0)
      : screen.screenWidthTiles;
    const rows = screen.screenHeightTiles;
    const result: { color: string }[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        result.push({
          color: (column + row) % 2 === 0 ? screen.tileColor : screen.tileColorTwo,
        });
      }
    }

    return { columns, rows, result };
  }, [screen]);

  const totalWidth = useMemo(() => {
    if (screen.sections.length > 0) {
      return screen.sections.reduce(
        (sum, section) => sum + (section.tileWidthMm ? section.tileWidthMm * MM_TO_PX : section.tileWidthPx) * section.columnCount,
        0,
      );
    }
    return (screen.tileWidthMm ? screen.tileWidthMm * MM_TO_PX : screen.tileWidthPx) * screen.screenWidthTiles;
  }, [screen]);

  const totalHeight = useMemo(() => {
    const height = screen.sections.length > 0
      ? (screen.sections[0].tileHeightMm ? screen.sections[0].tileHeightMm * MM_TO_PX : screen.sections[0].tileHeightPx)
      : (screen.tileHeightMm ? screen.tileHeightMm * MM_TO_PX : screen.tileHeightPx);
    return height * screen.screenHeightTiles;
  }, [screen]);

  const screenWidthMm = screen.sections.length > 0
    ? screen.sections.reduce((sum, section) => sum + (section.tileWidthMm || 0) * section.columnCount, 0)
    : (screen.tileWidthMm || 0) * screen.screenWidthTiles;
  const screenHeightMm = (screen.tileHeightMm || 0) * screen.screenHeightTiles;
  const screenWidthPx = screen.tileWidthPx * screen.screenWidthTiles;
  const screenHeightPx = screen.tileHeightPx * screen.screenHeightTiles;
  const isBack = settings.view === "back";
  const viewTransform = getViewTransform(settings);
  const isFlat = settings.renderMode === "2d" || settings.view === "front" || settings.view === "back";

  const formatDimension = (millimeters: number, pixels: number) =>
    millimeters > 0 ? `${(millimeters / 1000).toFixed(2)}m` : `${Math.round(pixels)}px`;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: totalWidth + 280,
        height: totalHeight + 280,
        perspective: isFlat ? undefined : "1800px",
      }}
    >
      {settings.showGrid && !isFlat && (
        <div
          aria-hidden="true"
          className="absolute rounded-sm opacity-70"
          style={{
            left: 40,
            top: totalHeight + 150,
            width: totalWidth + 80,
            height: Math.max(totalWidth * 0.65, 180),
            backgroundImage: `linear-gradient(rgba(148,163,184,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.24) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            transform: "perspective(900px) rotateX(62deg)",
            transformOrigin: "top center",
          }}
        />
      )}

      <div
        className="absolute"
        style={{
          left: 140,
          top: 140,
          width: totalWidth,
          height: totalHeight,
          transformStyle: "preserve-3d",
          transform: `${viewTransform} scale(${settings.zoom})`,
          transformOrigin: "center center",
          transition: "transform 180ms ease-out",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundColor: isBack ? "#1f2937" : undefined,
            border: `${Math.max(screen.borderWidth, 1)}px solid ${screen.borderColor}`,
            boxShadow: settings.showDepth && !isFlat ? "18px 18px 0 #1f2937, 28px 28px 0 #111827" : undefined,
            backfaceVisibility: "hidden",
          }}
        >
          {!isBack && (
            <div
              className="grid h-full w-full"
              style={{
                gridTemplateColumns: `repeat(${tiles.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${tiles.rows}, minmax(0, 1fr))`,
              }}
            >
              {tiles.result.map((tile, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: tile.color,
                    border: `${Math.max(screen.borderWidth, 1)}px solid ${screen.borderColor}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {isBack && settings.showLabels && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-widest text-white/70">
            BACK
          </div>
        )}
      </div>

      {settings.showDimensions && (
        <>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs font-mono text-white">
            {formatDimension(screenWidthMm, screenWidthPx)}
          </div>
          <div className="absolute bottom-12 right-12 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs font-mono text-white">
            {formatDimension(screenHeightMm, screenHeightPx)}
          </div>
        </>
      )}

      {settings.showLabels && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {screen.name}
        </div>
      )}
    </div>
  );
}

function getViewTransform(settings: PreVisualSettings) {
  switch (settings.view) {
    case "front":
      return "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
    case "back":
      return "rotateX(0deg) rotateY(180deg) rotateZ(0deg)";
    case "side":
      return "rotateX(0deg) rotateY(90deg) rotateZ(0deg)";
    case "top":
      return "rotateX(72deg) rotateY(0deg) rotateZ(0deg)";
    case "isometric-left":
      return `rotateX(${settings.rotateX}deg) rotateY(-35deg) rotateZ(${settings.rotateZ}deg)`;
    case "isometric-right":
      return `rotateX(${settings.rotateX}deg) rotateY(35deg) rotateZ(${settings.rotateZ}deg)`;
    case "isometric":
    default:
      return `rotateX(${settings.rotateX}deg) rotateY(${settings.rotateY}deg) rotateZ(${settings.rotateZ}deg)`;
  }
}
