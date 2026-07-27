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
  aspectRatio?: number;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const CANVAS_W = 680;
const CANVAS_H = 420;
const MIN_CROP = 30;

interface CropRect { x: number; y: number; w: number; h: number }
type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

function hitHandle(rect: CropRect, px: number, py: number): Handle | null {
  const { x, y, w, h } = rect;
  const r = 10;
  const corners: [Handle, number, number][] = [
    ['nw', x, y], ['ne', x + w, y], ['sw', x, y + h], ['se', x + w, y + h],
  ];
  for (const [name, cx, cy] of corners) {
    if (Math.abs(px - cx) <= r && Math.abs(py - cy) <= r) return name;
  }
  const edges: [Handle, boolean][] = [
    ['n', Math.abs(py - y) <= r && px > x && px < x + w],
    ['s', Math.abs(py - (y + h)) <= r && px > x && px < x + w],
    ['w', Math.abs(px - x) <= r && py > y && py < y + h],
    ['e', Math.abs(px - (x + w)) <= r && py > y && py < y + h],
  ];
  for (const [name, hit] of edges) { if (hit) return name; }
  if (px > x + r && px < x + w - r && py > y + r && py < y + h - r) return 'move';
  return null;
}

function cursorFor(h: Handle | null): string {
  if (!h) return 'crosshair';
  const map: Record<Handle, string> = {
    move: 'move', nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
    n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  };
  return map[h];
}

export function ImageCropModal({
  open,
  imageSrc,
  aspectRatio,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 40, y: 40, w: CANVAS_W - 80, h: CANVAS_H - 80 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const dragState = useRef<{
    mode: 'pan' | 'crop';
    handle: Handle | null;
    startX: number; startY: number;
    startPan: { x: number; y: number };
    startCrop: CropRect;
  } | null>(null);

  const [cursor, setCursor] = useState('crosshair');

  // Reset on new image
  useEffect(() => {
    if (!open) return;
    setImgLoaded(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCrop({ x: 40, y: 40, w: CANVAS_W - 80, h: CANVAS_H - 80 });
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image to canvas
      const scale = Math.min(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight, 1);
      setZoom(scale);
      setPan({
        x: (CANVAS_W - img.naturalWidth * scale) / 2,
        y: (CANVAS_H - img.naturalHeight * scale) / 2,
      });
      // Default crop: full canvas minus padding, locked to aspectRatio if given
      let cw = CANVAS_W - 80;
      let ch = CANVAS_H - 80;
      if (aspectRatio) { ch = Math.round(cw / aspectRatio); }
      const cx = (CANVAS_W - cw) / 2;
      const cy = (CANVAS_H - ch) / 2;
      setCrop({ x: cx, y: cy, w: cw, h: ch });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [open, imageSrc, aspectRatio]);

  // Redraw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Black bg
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Draw image
    const img = imgRef.current;
    if (img && imgLoaded) {
      ctx.drawImage(img, pan.x, pan.y, img.naturalWidth * zoom, img.naturalHeight * zoom);
    }
    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, crop.y);                                          // top
    ctx.fillRect(0, crop.y + crop.h, CANVAS_W, CANVAS_H - crop.y - crop.h);       // bottom
    ctx.fillRect(0, crop.y, crop.x, crop.h);                                       // left
    ctx.fillRect(crop.x + crop.w, crop.y, CANVAS_W - crop.x - crop.w, crop.h);   // right
    // Crop border
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    // Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.75;
    for (let i = 1; i <= 2; i++) {
      const gx = crop.x + (crop.w * i) / 3;
      const gy = crop.y + (crop.h * i) / 3;
      ctx.beginPath(); ctx.moveTo(gx, crop.y); ctx.lineTo(gx, crop.y + crop.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crop.x, gy); ctx.lineTo(crop.x + crop.w, gy); ctx.stroke();
    }
    // Corner handles
    const handles: [number, number][] = [
      [crop.x, crop.y], [crop.x + crop.w, crop.y],
      [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h],
    ];
    for (const [hx, hy] of handles) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Edge mid-handles
    const mids: [number, number][] = [
      [crop.x + crop.w / 2, crop.y], [crop.x + crop.w / 2, crop.y + crop.h],
      [crop.x, crop.y + crop.h / 2], [crop.x + crop.w, crop.y + crop.h / 2],
    ];
    for (const [hx, hy] of mids) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [zoom, pan, crop, imgLoaded]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const clampCrop = useCallback((r: CropRect): CropRect => {
    let { x, y, w, h } = r;
    w = Math.max(MIN_CROP, w);
    h = Math.max(MIN_CROP, h);
    x = Math.max(0, Math.min(CANVAS_W - w, x));
    y = Math.max(0, Math.min(CANVAS_H - h, y));
    return { x, y, w, h };
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const handle = hitHandle(crop, x, y);
    if (handle) {
      dragState.current = { mode: 'crop', handle, startX: x, startY: y, startPan: pan, startCrop: { ...crop } };
    } else {
      // Pan the image
      dragState.current = { mode: 'pan', handle: null, startX: x, startY: y, startPan: { ...pan }, startCrop: { ...crop } };
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const ds = dragState.current;
    if (!ds) {
      setCursor(cursorFor(hitHandle(crop, x, y)));
      return;
    }
    const dx = x - ds.startX;
    const dy = y - ds.startY;
    if (ds.mode === 'pan') {
      setPan({ x: ds.startPan.x + dx, y: ds.startPan.y + dy });
      return;
    }
    const { handle, startCrop: sc } = ds;
    let { x: cx, y: cy, w: cw, h: ch } = sc;
    if (handle === 'move') {
      cx += dx; cy += dy;
    } else {
      if (handle === 'nw' || handle === 'w' || handle === 'sw') { cx += dx; cw -= dx; }
      if (handle === 'ne' || handle === 'e' || handle === 'se') { cw += dx; }
      if (handle === 'nw' || handle === 'n' || handle === 'ne') { cy += dy; ch -= dy; }
      if (handle === 'sw' || handle === 's' || handle === 'se') { ch += dy; }
    }
    if (aspectRatio && handle !== 'move') {
      // Lock aspect ratio on corner drags
      if (['nw', 'ne', 'sw', 'se'].includes(handle)) {
        const newH = cw / aspectRatio;
        if (['nw', 'ne'].includes(handle)) { cy = sc.y + sc.h - newH; }
        ch = newH;
      }
    }
    setCrop(clampCrop({ x: cx, y: cy, w: cw, h: ch }));
  };

  const onMouseUp = () => { dragState.current = null; };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasPos(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta));
      const ratio = next / prev;
      setPan(p => ({ x: x + (p.x - x) * ratio, y: y + (p.y - y) * ratio }));
      return next;
    });
  };

  const handleZoom = (dir: 1 | -1) => {
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prev * (dir > 0 ? 1.25 : 0.8)).toFixed(3)));
      const cx = CANVAS_W / 2; const cy = CANVAS_H / 2;
      const ratio = next / prev;
      setPan(p => ({ x: cx + (p.x - cx) * ratio, y: cy + (p.y - cy) * ratio }));
      return next;
    });
  };

  const reset = () => {
    const img = imgRef.current;
    if (!img) return;
    const scale = Math.min(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight, 1);
    setZoom(scale);
    setPan({ x: (CANVAS_W - img.naturalWidth * scale) / 2, y: (CANVAS_H - img.naturalHeight * scale) / 2 });
    let cw = CANVAS_W - 80; let ch = CANVAS_H - 80;
    if (aspectRatio) { ch = Math.round(cw / aspectRatio); }
    setCrop({ x: (CANVAS_W - cw) / 2, y: (CANVAS_H - ch) / 2, w: cw, h: ch });
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const outW = 600;
    const outH = aspectRatio ? Math.round(outW / aspectRatio) : Math.round(outW * crop.h / crop.w);
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, outW, outH);
    // Map crop rect back to image natural coords
    const sx = (crop.x - pan.x) / zoom;
    const sy = (crop.y - pan.y) / zoom;
    const sw = crop.w / zoom;
    const sh = crop.h / zoom;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    onConfirm(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className="max-w-[760px] p-4">
        <DialogHeader>
          <DialogTitle>Crop &amp; adjust image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground self-start">
            Drag handles to resize the crop area &middot; Drag outside the box to pan &middot; Scroll to zoom
          </p>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-md w-full"
            style={{ cursor, touchAction: 'none', maxHeight: '52vh', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleZoom(-1)}>
              <ZoomOut className="h-4 w-4 mr-1" /> Zoom out
            </Button>
            <span className="text-xs text-muted-foreground w-14 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => handleZoom(1)}>
              <ZoomIn className="h-4 w-4 mr-1" /> Zoom in
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>
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
