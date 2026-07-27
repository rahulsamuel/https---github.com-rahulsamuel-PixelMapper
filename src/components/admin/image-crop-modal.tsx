'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, RotateCcw, Crop } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  aspectRatio?: number; // width / height; default 1.5 (equipment-ish)
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export function ImageCropModal({
  open,
  imageSrc,
  aspectRatio = 1.5,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Reset state when a new image is loaded
  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [open, imageSrc]);

  const clampOffset = useCallback(
    (off: { x: number; y: number }, z: number) => {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return off;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaledW = img.naturalWidth * z;
      const scaledH = img.naturalHeight * z;
      const maxX = Math.max(0, (scaledW - cw) / 2);
      const maxY = Math.max(0, (scaledH - ch) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, off.x)),
        y: Math.max(-maxY, Math.min(maxY, off.y)),
      };
    },
    [],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy }, zoom));
  };

  const onPointerUp = () => setDragging(false);

  const handleZoom = (delta: number) => {
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prev + delta).toFixed(2)));
      setOffset(o => clampOffset(o, next));
      return next;
    });
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    // Determine the crop window (the visible area of the container, sized to aspect ratio)
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const cropW = cw;
    const cropH = cropW / aspectRatio;
    const cropX = 0;
    const cropY = (ch - cropH) / 2;

    const canvas = document.createElement('canvas');
    const outW = 600;
    const outH = Math.round(outW / aspectRatio);
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background (dark) in case image doesn't cover
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, outW, outH);

    // Map crop window (in container space) back to image natural pixels
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    const imgLeft = (cw - scaledW) / 2 + offset.x;
    const imgTop = (ch - scaledH) / 2 + offset.y;

    // Source rectangle in natural image coords
    const sx = (cropX - imgLeft) / zoom;
    const sy = (cropY - imgTop) / zoom;
    const sw = cropW / zoom;
    const sh = cropH / zoom;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onConfirm(dataUrl);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop &amp; adjust image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-black rounded-md select-none"
            style={{ height: 320, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {imageSrc ? (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="crop preview"
                onLoad={() => setImgLoaded(true)}
                draggable={false}
                className="max-w-none origin-top-left"
                style={{
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transition: dragging ? 'none' : 'transform 0.05s',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No image
              </div>
            )}
            {/* Crop overlay */}
            <div
              className="absolute left-0 pointer-events-none border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={{ width: '100%', height: 320 / aspectRatio, top: (320 - 320 / aspectRatio) / 2 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleZoom(-0.2)} disabled={zoom <= MIN_ZOOM}>
              <ZoomOut className="h-4 w-4 mr-1" /> Zoom out
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <Button type="button" variant="outline" size="sm" onClick={() => handleZoom(0.2)} disabled={zoom >= MAX_ZOOM}>
              <ZoomIn className="h-4 w-4 mr-1" /> Zoom in
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Drag to pan, use zoom controls to focus on the equipment.</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} disabled={!imgLoaded}>
            <Crop className="h-4 w-4 mr-1" /> Apply crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
