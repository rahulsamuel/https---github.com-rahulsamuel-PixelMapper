"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { usePixelMap } from "@/contexts/pixel-map-context";

const SCALE = 0.001;

function LedTile({
  position,
  width,
  height,
  color,
  borderWidth,
  borderColor,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  color: string;
  borderWidth: number;
  borderColor: string;
}) {
  const depth = 0.08;
  const frameW = width + borderWidth * 2;
  const frameH = height + borderWidth * 2;

  return (
    <group position={position}>
      {/* Bezel / frame */}
      <mesh position={[0, 0, -depth / 2]}>
        <boxGeometry args={[frameW, frameH, depth]} />
        <meshStandardMaterial color={borderColor} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* LED surface */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function LedWall() {
  const {
    tiles,
    dimensions,
    tileColor,
    tileColorTwo,
    borderWidth,
    borderColor,
    onOffMode,
    effectiveScreenWidth,
    effectiveScreenHeight,
    topHalfTile,
    bottomHalfTile,
    leftHalfTile,
    rightHalfTile,
    currentScreen,
  } = usePixelMap();

  const { tileData, totalWidth, totalHeight } = useMemo(() => {
    let w = 0;
    for (let i = 0; i < effectiveScreenWidth; i++) {
      const isLeftHalf = leftHalfTile && i === 0;
      const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
      w += isLeftHalf || isRightHalf ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }
    let h = 0;
    for (let i = 0; i < effectiveScreenHeight; i++) {
      const isTopHalf = topHalfTile && i === 0;
      const isBottomHalf = bottomHalfTile && i === effectiveScreenHeight - 1;
      h += isTopHalf || isBottomHalf ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }
    return { tileData: tiles, totalWidth: w, totalHeight: h };
  }, [tiles, dimensions, effectiveScreenWidth, effectiveScreenHeight, leftHalfTile, rightHalfTile, topHalfTile, bottomHalfTile]);

  const tileMeshes = useMemo(() => {
    if (!tileData.length) return [];

    const meshes: {
      pos: [number, number, number];
      w: number;
      h: number;
      color: string;
    }[] = [];

    const scaledW = totalWidth * SCALE;
    const scaledH = totalHeight * SCALE;
    let cursorX = -scaledW / 2;
    let cursorY = scaledH / 2;

    for (let y = 0; y < effectiveScreenHeight; y++) {
      const isTopHalfRow = topHalfTile && y === 0;
      const isBottomHalfRow = bottomHalfTile && y === effectiveScreenHeight - 1;
      const tileH = (isTopHalfRow || isBottomHalfRow) ? dimensions.tileHeight / 2 : dimensions.tileHeight;
      const scaledTileH = tileH * SCALE;
      cursorX = -scaledW / 2;

      for (let x = 0; x < effectiveScreenWidth; x++) {
        const index = y * effectiveScreenWidth + x;
        const tile = tileData[index];
        if (!tile) continue;

        const isLeftHalfCol = leftHalfTile && x === 0;
        const isRightHalfCol = rightHalfTile && x === effectiveScreenWidth - 1;
        const tileW = (isLeftHalfCol || isRightHalfCol) ? dimensions.tileWidth / 2 : dimensions.tileWidth;
        const scaledTileW = tileW * SCALE;

        let color: string;
        if (onOffMode) {
          color = tile.deleted ? "#000000" : "#FFFFFF";
        } else {
          if (tile.deleted) {
            color = "#000000";
          } else if (tile.color) {
            color = tile.color;
          } else {
            color = (x + y) % 2 === 0 ? tileColor : tileColorTwo;
          }
        }

        const px = cursorX + scaledTileW / 2;
        const py = cursorY - scaledTileH / 2;

        meshes.push({
          pos: [px, py, 0],
          w: scaledTileW,
          h: scaledTileH,
          color,
        });

        cursorX += scaledTileW;
      }
      cursorY -= scaledTileH;
    }

    return meshes;
  }, [tileData, dimensions, effectiveScreenWidth, effectiveScreenHeight, tileColor, tileColorTwo, onOffMode, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile, totalWidth, totalHeight]);

  if (!tileData.length) {
    return (
      <Html center>
        <div className="text-muted-foreground text-sm bg-background/80 px-4 py-2 rounded-lg">
          Set dimensions to see the 3D preview.
        </div>
      </Html>
    );
  }

  const scaledW = totalWidth * SCALE;
  const scaledH = totalHeight * SCALE;
  const frameDepth = 0.15;

  return (
    <group>
      {/* Backing structure */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[scaledW + 0.04, scaledH + 0.04, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Support frame */}
      <mesh position={[0, -scaledH / 2 - 0.1, -0.04]}>
        <boxGeometry args={[scaledW + 0.3, 0.08, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, scaledH / 2 + 0.1, -0.04]}>
        <boxGeometry args={[scaledW + 0.3, 0.08, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Tiles */}
      {tileMeshes.map((m, i) => (
        <LedTile
          key={i}
          position={m.pos}
          width={m.w}
          height={m.h}
          color={m.color}
          borderWidth={Math.max(borderWidth * SCALE, 0.002)}
          borderColor={borderColor}
        />
      ))}
    </group>
  );
}

function SceneSetup() {
  const { currentScreen } = usePixelMap();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={lightRef}
        position={[3, 5, 4]}
        intensity={0.6}
        castShadow
      />
      <pointLight position={[-3, 2, 3]} intensity={0.3} color="#88aaff" />
      <Environment preset="warehouse" />
      <ContactShadows
        position={[0, -3, 0]}
        opacity={0.4}
        scale={15}
        blur={2}
        far={5}
      />
    </>
  );
}

function CameraRig() {
  const { totalWidth, totalHeight } = usePixelMapDimensions();
  const controlsRef = useRef<any>(null);

  const distance = useMemo(() => {
    const maxDim = Math.max(totalWidth, totalHeight) * SCALE;
    return Math.max(maxDim * 2.5, 3);
  }, [totalWidth, totalHeight]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={distance * 3}
      maxPolarAngle={Math.PI * 0.85}
      target={[0, 0, 0]}
    />
  );
}

function usePixelMapDimensions() {
  const { dimensions, effectiveScreenWidth, effectiveScreenHeight, topHalfTile, bottomHalfTile, leftHalfTile, rightHalfTile } = usePixelMap();

  const { totalWidth, totalHeight } = useMemo(() => {
    let w = 0;
    for (let i = 0; i < effectiveScreenWidth; i++) {
      const isLeftHalf = leftHalfTile && i === 0;
      const isRightHalf = rightHalfTile && i === effectiveScreenWidth - 1;
      w += isLeftHalf || isRightHalf ? dimensions.tileWidth / 2 : dimensions.tileWidth;
    }
    let h = 0;
    for (let i = 0; i < effectiveScreenHeight; i++) {
      const isTopHalf = topHalfTile && i === 0;
      const isBottomHalf = bottomHalfTile && i === effectiveScreenHeight - 1;
      h += isTopHalf || isBottomHalf ? dimensions.tileHeight / 2 : dimensions.tileHeight;
    }
    return { totalWidth: w, totalHeight: h };
  }, [dimensions, effectiveScreenWidth, effectiveScreenHeight, leftHalfTile, rightHalfTile, topHalfTile, bottomHalfTile]);

  return { totalWidth, totalHeight };
}

export function Led3DView() {
  return (
    <div className="w-full h-full" style={{ minHeight: "400px" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneSetup />
          <LedWall />
          <CameraRig />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/60 backdrop-blur px-3 py-1.5 rounded-lg pointer-events-none">
        Drag to orbit &middot; Scroll to zoom &middot; Right-click to pan
      </div>
    </div>
  );
}
