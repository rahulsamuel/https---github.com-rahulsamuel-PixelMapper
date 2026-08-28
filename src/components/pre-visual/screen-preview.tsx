"use client";

import { useMemo } from "react";
import type { PreVisualScreenData, PreVisualSettings } from "./types";

interface ScreenPreviewProps {
  screen: PreVisualScreenData;
  settings: PreVisualSettings;
}

const MM_TO_PX = 0.5;

export function ScreenPreview({ screen, settings }: ScreenPreviewProps) {
  const tileLayout = useMemo(() => ({
    columns: screen.sections.length > 0
      ? screen.sections.reduce((sum, section) => sum + section.columnCount, 0)
      : screen.screenWidthTiles,
    rows: screen.screenHeightTiles,
  }), [screen]);

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

  const depth = settings.showDepth ? Math.max(18, (screen.tileDepthMm || 80) * MM_TO_PX) : 0;
  const screenWidthMm = screen.sections.length > 0
    ? screen.sections.reduce((sum, section) => sum + (section.tileWidthMm || 0) * section.columnCount, 0)
    : (screen.tileWidthMm || 0) * screen.screenWidthTiles;
  const screenHeightMm = (screen.tileHeightMm || 0) * screen.screenHeightTiles;
  const screenWidthPx = screen.tileWidthPx * screen.screenWidthTiles;
  const screenHeightPx = screen.tileHeightPx * screen.screenHeightTiles;
  const isBack = settings.view === "back";
  const isFlat = settings.renderMode === "2d" || settings.view === "front" || settings.view === "back";
  const viewTransform = getViewTransform(settings);
  const objectWidth = totalWidth + depth;
  const objectHeight = totalHeight + depth;

  const formatDimension = (millimeters: number, pixels: number) =>
    millimeters > 0 ? `${(millimeters / 1000).toFixed(2)}m` : `${Math.round(pixels)}px`;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: Math.max(totalWidth + 360, 760),
        height: Math.max(totalHeight + 360, 620),
        perspective: isFlat ? undefined : "1400px",
      }}
    >
      {settings.showGrid && !isFlat && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[54%] h-[70%] w-[150%] -translate-x-1/2 opacity-80"
          style={{
            backgroundImage: "linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            transform: "translateX(-50%) rotateX(62deg)",
            transformOrigin: "top center",
          }}
        />
      )}

      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: objectWidth,
          height: objectHeight,
          perspective: isFlat ? undefined : "1400px",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: totalWidth,
            height: totalHeight,
            transformStyle: "preserve-3d",
            transform: `${viewTransform} scale(${settings.zoom})`,
            transformOrigin: "center center",
            transition: "transform 180ms ease-out",
          }}
        >
          <PanelFace
            className="bg-neutral-950"
            width={totalWidth}
            height={totalHeight}
            transform={`translate(-50%, -50%) translateZ(${depth / 2}px)`}
            borderColor={screen.borderColor}
          >
            {isBack ? (
              <div
                className="h-full w-full"
                style={{
                  backgroundColor: "#20262e",
                  backgroundImage: `linear-gradient(${screen.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${screen.borderColor} 1px, transparent 1px)`,
                  backgroundSize: `${Math.max(totalWidth / tileLayout.columns, 24)}px ${Math.max(totalHeight / tileLayout.rows, 24)}px`,
                  opacity: 0.95,
                }}
              />
            ) : (
              <TileGrid
                columns={tileLayout.columns}
                rows={tileLayout.rows}
                screen={screen}
              />
            )}
          </PanelFace>

          <PanelFace
            className="bg-neutral-800"
            width={totalWidth}
            height={totalHeight}
            transform={`translate(-50%, -50%) rotateY(180deg) translateZ(${depth / 2}px)`}
            borderColor={screen.borderColor}
          >
            <div
              className="h-full w-full"
              style={{
                backgroundColor: "#20262e",
                backgroundImage: `linear-gradient(${screen.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${screen.borderColor} 1px, transparent 1px)`,
                backgroundSize: `${Math.max(totalWidth / tileLayout.columns, 24)}px ${Math.max(totalHeight / tileLayout.rows, 24)}px`,
              }}
            />
          </PanelFace>

          {depth > 0 && (
            <>
              <PanelFace width={depth} height={totalHeight} transform={`translate(-50%, -50%) rotateY(90deg) translateZ(${totalWidth / 2}px)`} borderColor="#111827" className="bg-neutral-700" />
              <PanelFace width={depth} height={totalHeight} transform={`translate(-50%, -50%) rotateY(-90deg) translateZ(${totalWidth / 2}px)`} borderColor="#111827" className="bg-neutral-700" />
              <PanelFace width={totalWidth} height={depth} transform={`translate(-50%, -50%) rotateX(90deg) translateZ(${totalHeight / 2}px)`} borderColor="#111827" className="bg-neutral-600" />
              <PanelFace width={totalWidth} height={depth} transform={`translate(-50%, -50%) rotateX(-90deg) translateZ(${totalHeight / 2}px)`} borderColor="#111827" className="bg-neutral-900" />
            </>
          )}
        </div>
      </div>

      {settings.showDimensions && (
        <>
          <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-2 py-1 text-xs font-mono text-white">
            Width: {formatDimension(screenWidthMm, screenWidthPx)}
          </div>
          <div className="absolute bottom-10 right-10 whitespace-nowrap rounded bg-black/75 px-2 py-1 text-xs font-mono text-white">
            Height: {formatDimension(screenHeightMm, screenHeightPx)}
          </div>
        </>
      )}

      {settings.showLabels && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {screen.name}{isBack ? " · Back" : ""}
        </div>
      )}
    </div>
  );
}

function PanelFace({
  children,
  className,
  width,
  height,
  transform,
  borderColor,
}: {
  children?: React.ReactNode;
  className: string;
  width: number;
  height: number;
  transform: string;
  borderColor: string;
}) {
  return (
    <div
      className={`absolute left-1/2 top-1/2 overflow-hidden ${className}`}
      style={{
        width,
        height,
        transform,
        border: `1px solid ${borderColor}`,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function TileGrid({
  columns,
  rows,
  screen,
}: {
  columns: number;
  rows: number;
  screen: PreVisualScreenData;
}) {
  return (
    <div
      className="grid h-full w-full"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        return (
          <div
            key={index}
            style={{
              backgroundColor: (column + row) % 2 === 0 ? screen.tileColor : screen.tileColorTwo,
              border: `${Math.max(screen.borderWidth, 1)}px solid ${screen.borderColor}`,
            }}
          />
        );
      })}
    </div>
  );
}

function getViewTransform(settings: PreVisualSettings) {
  switch (settings.view) {
    case "front":
      return "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
    case "back":
      return "rotateX(-14deg) rotateY(180deg) rotateZ(0deg)";
    case "side":
      return "rotateX(-10deg) rotateY(90deg) rotateZ(0deg)";
    case "top":
      return "rotateX(90deg) rotateY(0deg) rotateZ(0deg)";
    case "isometric-left":
      return `rotateX(${settings.rotateX}deg) rotateY(-35deg) rotateZ(${settings.rotateZ}deg)`;
    case "isometric-right":
      return `rotateX(${settings.rotateX}deg) rotateY(35deg) rotateZ(${settings.rotateZ}deg)`;
    case "isometric":
    default:
      return `rotateX(${settings.rotateX}deg) rotateY(${settings.rotateY}deg) rotateZ(${settings.rotateZ}deg)`;
  }
}
