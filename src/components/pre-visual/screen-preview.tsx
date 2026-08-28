"use client";

import { useMemo } from "react";
import type { PreVisualScreenData, PreVisualSettings } from "./types";
import { cn } from "@/lib/utils";

interface ScreenPreviewProps {
  screen: PreVisualScreenData;
  settings: PreVisualSettings;
}

const MM_TO_PX = 0.5;

export function ScreenPreview({ screen, settings }: ScreenPreviewProps) {
  const tiles = useMemo(() => {
    const cols = screen.sections.length > 0
      ? screen.sections.reduce((sum, s) => sum + s.columnCount, 0)
      : screen.screenWidthTiles;
    const rows = screen.screenHeightTiles;
    const arr: { x: number; y: number; w: number; h: number; color: string }[] = [];
    let xOff = 0;
    if (screen.sections.length > 0) {
      for (let r = 0; r < rows; r++) {
        xOff = 0;
        for (const section of screen.sections) {
          for (let c = 0; c < section.columnCount; c++) {
            const w = section.tileWidthMm ? section.tileWidthMm * MM_TO_PX : section.tileWidthPx;
            const h = section.tileHeightMm ? section.tileHeightMm * MM_TO_PX : section.tileHeightPx;
            const color = (c + r) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
            arr.push({ x: xOff, y: r * h, w, h, color });
            xOff += w;
          }
        }
      }
    } else {
      const w = screen.tileWidthMm ? screen.tileWidthMm * MM_TO_PX : screen.tileWidthPx;
      const h = screen.tileHeightMm ? screen.tileHeightMm * MM_TO_PX : screen.tileHeightPx;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const color = (c + r) % 2 === 0 ? screen.tileColor : screen.tileColorTwo;
          arr.push({ x: c * w, y: r * h, w, h, color });
        }
      }
    }
    return arr;
  }, [screen]);

  const totalWidth = useMemo(() => {
    if (screen.sections.length > 0) {
      return screen.sections.reduce((sum, s) => sum + (s.tileWidthMm ? s.tileWidthMm * MM_TO_PX : s.tileWidthPx) * s.columnCount, 0);
    }
    return (screen.tileWidthMm ? screen.tileWidthMm * MM_TO_PX : screen.tileWidthPx) * screen.screenWidthTiles;
  }, [screen]);

  const totalHeight = useMemo(() => {
    const h = screen.sections.length > 0
      ? (screen.sections[0].tileHeightMm ? screen.sections[0].tileHeightMm * MM_TO_PX : screen.sections[0].tileHeightPx)
      : (screen.tileHeightMm ? screen.tileHeightMm * MM_TO_PX : screen.tileHeightPx);
    return h * screen.screenHeightTiles;
  }, [screen]);

  const depth = settings.showDepth ? Math.max(20, (screen.tileDepthMm || 80) * MM_TO_PX) : 0;

  const screenWmm = screen.sections.length > 0
    ? screen.sections.reduce((sum, s) => sum + (s.tileWidthMm || 0) * s.columnCount, 0)
    : (screen.tileWidthMm || 0) * screen.screenWidthTiles;
  const screenHmm = (screen.tileHeightMm || 0) * screen.screenHeightTiles;

  const fmtDim = (mm: number) => {
    if (mm <= 0) return "";
    return `${(mm / 1000).toFixed(2)}m`;
  };

  const viewTransform = useMemo(() => {
    switch (settings.view) {
      case "front":
        return "rotateX(0deg) rotateY(0deg)";
      case "side":
        return "rotateX(0deg) rotateY(90deg)";
      case "top":
        return "rotateX(90deg) rotateY(0deg)";
      case "isometric":
      default:
        return `rotateX(${settings.rotateX}deg) rotateY(${settings.rotateY}deg) rotateZ(${settings.rotateZ}deg)`;
    }
  }, [settings.view, settings.rotateX, settings.rotateY, settings.rotateZ]);

  const isFlat = settings.renderMode === "2d" || settings.view === "front";

  return (
    <div
      className="relative"
      style={{
        width: totalWidth + 120,
        height: totalHeight + 120,
        perspective: "2000px",
      }}
    >
      {/* Dimension labels */}
      {settings.showDimensions && (
        <>
          <div
            className="absolute text-xs font-mono text-blue-400 whitespace-nowrap"
            style={{
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {fmtDim(screenWmm)}
          </div>
          <div
            className="absolute text-xs font-mono text-blue-400 whitespace-nowrap"
            style={{
              right: 8,
              top: "50%",
              transform: "translateY(-50%) rotate(90deg)",
              transformOrigin: "right center",
            }}
          >
            {fmtDim(screenHmm)}
          </div>
        </>
      )}

      {/* Screen name label */}
      {settings.showLabels && (
        <div
          className="absolute text-sm font-semibold text-white/80 whitespace-nowrap"
          style={{ top: 8, left: "50%", transform: "translateX(-50%)" }}
        >
          {screen.name}
        </div>
      )}

      <div
        className="absolute"
        style={{
          left: 60,
          top: 60,
          width: totalWidth,
          height: totalHeight,
          transformStyle: "preserve-3d",
          transform: `${viewTransform} scale(${settings.zoom})`,
          transformOrigin: "center center",
        }}
      >
        {/* Front face - the LED tiles */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(${depth / 2}px)`,
            backfaceVisibility: "hidden",
          }}
        >
          <div
            className="grid"
            style={{
              width: totalWidth,
              height: totalHeight,
              gridTemplateColumns: `repeat(${screen.sections.length > 0 ? screen.sections.reduce((sum, s) => sum + s.columnCount, 0) : screen.screenWidthTiles}, 1fr)`,
              gridTemplateRows: `repeat(${screen.screenHeightTiles}, 1fr)`,
            }}
          >
            {tiles.map((tile, i) => (
              <div
                key={i}
                className="border"
                style={{
                  backgroundColor: tile.color,
                  borderColor: screen.borderColor,
                  borderWidth: `${screen.borderWidth}px`,
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>
        </div>

        {/* Back face */}
        {settings.showDepth && (
          <div
            className="absolute inset-0 bg-neutral-800"
            style={{
              transform: `translateZ(${-depth / 2}px)`,
              backfaceVisibility: "hidden",
            }}
          />
        )}

        {/* Top face */}
        {settings.showDepth && (
          <div
            className="absolute bg-neutral-700"
            style={{
              width: totalWidth,
              height: depth,
              top: 0,
              left: 0,
              transform: `rotateX(90deg) translateZ(${totalHeight / 2}px)`,
              transformOrigin: "top center",
              backfaceVisibility: "hidden",
            }}
          />
        )}

        {/* Bottom face */}
        {settings.showDepth && (
          <div
            className="absolute bg-neutral-900"
            style={{
              width: totalWidth,
              height: depth,
              bottom: 0,
              left: 0,
              transform: `rotateX(-90deg) translateZ(${totalHeight / 2}px)`,
              transformOrigin: "bottom center",
              backfaceVisibility: "hidden",
            }}
          />
        )}

        {/* Left face */}
        {settings.showDepth && (
          <div
            className="absolute bg-neutral-600"
            style={{
              width: depth,
              height: totalHeight,
              top: 0,
              left: 0,
              transform: `rotateY(-90deg) translateZ(${totalWidth / 2}px)`,
              transformOrigin: "left center",
              backfaceVisibility: "hidden",
            }}
          />
        )}

        {/* Right face */}
        {settings.showDepth && (
          <div
            className="absolute bg-neutral-600"
            style={{
              width: depth,
              height: totalHeight,
              top: 0,
              right: 0,
              transform: `rotateY(90deg) translateZ(${totalWidth / 2}px)`,
              transformOrigin: "right center",
              backfaceVisibility: "hidden",
            }}
          />
        )}
      </div>

      {/* Ground grid */}
      {settings.showGrid && settings.renderMode === "3d" && (
        <div
          className="absolute"
          style={{
            left: 60,
            top: 60 + totalHeight + depth / 2,
            width: totalWidth,
            height: totalWidth,
            transform: `rotateX(90deg) scale(${settings.zoom})`,
            transformOrigin: "top left",
            backgroundImage: `
              linear-gradient(rgba(100,100,100,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,100,100,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
