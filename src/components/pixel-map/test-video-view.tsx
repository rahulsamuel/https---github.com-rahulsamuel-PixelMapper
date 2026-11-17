"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MonitorPlay, Play, Square, Download, Save, Trash2, Pencil, Check, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  type TestVideoPreset,
  type TestVideoPresetSettings,
  type TestVideoPattern,
  loadTestVideoPresets,
  saveTestVideoPreset,
  renameTestVideoPreset,
  deleteTestVideoPreset,
} from "@/lib/test-video-presets";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

type ResolutionChoice = "720p" | "1080p" | "4k" | "screen";

const RESOLUTIONS: { value: ResolutionChoice; label: string; width: number; height: number }[] = [
  { value: "720p", label: "720p (1280 x 720)", width: 1280, height: 720 },
  { value: "1080p", label: "1080p (1920 x 1080)", width: 1920, height: 1080 },
  { value: "4k", label: "4K (3840 x 2160)", width: 3840, height: 2160 },
  { value: "screen", label: "Use current screen resolution", width: 0, height: 0 },
];

const PATTERNS: { value: TestVideoPattern; label: string }[] = [
  { value: "smpte-bars", label: "SMPTE Color Bars" },
  { value: "full-color-bars", label: "100% Color Bars" },
  { value: "color-bars-crosshair", label: "100% Color Bars + Bouncing Crosshair" },
  { value: "moving-grid", label: "Moving Grid" },
  { value: "frame-counter", label: "Frame Counter" },
];

const SAMPLE_RATE = 48000;
const AUDIO_CHANNELS = 2;
const SINE_FREQUENCY = 1000;

function isWebCodecsSupported() {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).VideoEncoder !== "undefined" &&
    typeof (window as any).AudioEncoder !== "undefined" &&
    typeof (window as any).VideoFrame !== "undefined" &&
    typeof (window as any).AudioData !== "undefined"
  );
}

function getResolutionFor(choice: ResolutionChoice, screenW: number, screenH: number) {
  const preset = RESOLUTIONS.find(r => r.value === choice)!;
  if (choice !== "screen") return { width: preset.width, height: preset.height };
  return { width: Math.max(2, Math.round(screenW / 2) * 2), height: Math.max(2, Math.round(screenH / 2) * 2) };
}

function getBitrate(width: number, height: number, fps: number) {
  // ~0.36 bits per pixel per frame: 1080p30 ≈ 22 Mbps, 4K60 ≈ 179 Mbps.
  return Math.min(200_000_000, Math.round(width * height * fps * 0.36));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function rgb(c: number[]) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const SMPTE_TOP = [
  [191, 191, 191], [191, 191, 0], [0, 191, 191], [0, 191, 0],
  [191, 0, 191], [191, 0, 0], [0, 0, 191],
];
const SMPTE_MID = [
  [0, 0, 191], [19, 19, 19], [191, 0, 191], [19, 19, 19],
  [0, 191, 191], [19, 19, 19],
];
const FULL_COLOR_BARS = [
  [255, 255, 255], [255, 255, 0], [0, 255, 255], [0, 255, 0],
  [255, 0, 255], [255, 0, 0], [0, 0, 255], [0, 0, 0],
];

function bounceProgress(frame: number, fps: number) {
  const phase = (frame / fps) % 4;
  return phase <= 2 ? phase / 2 : 1 - (phase - 2) / 2;
}

function drawFullColorBars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const barW = w / FULL_COLOR_BARS.length;
  for (let i = 0; i < FULL_COLOR_BARS.length; i++) {
    ctx.fillStyle = rgb(FULL_COLOR_BARS[i]);
    ctx.fillRect(Math.round(i * barW), 0, Math.ceil(barW), h);
  }
}

export function drawPattern(
  pattern: TestVideoPattern,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  fps: number
) {
  if (pattern === "smpte-bars") {
    const topH = Math.floor(h * 0.625);
    const barW = w / 7;
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = rgb(SMPTE_TOP[i]);
      ctx.fillRect(Math.round(i * barW), 0, Math.ceil(barW), topH);
    }
    const midH = Math.floor(h * 0.125);
    const midW = w / SMPTE_MID.length;
    for (let i = 0; i < SMPTE_MID.length; i++) {
      ctx.fillStyle = rgb(SMPTE_MID[i]);
      ctx.fillRect(Math.round(i * midW), topH, Math.ceil(midW), midH);
    }
    const botH = h - topH - midH;
    const botW = w / 6;
    // Standard SMPTE lower field: alternating dark/white slanted castellations.
    for (let i = 0; i < 6; i++) {
      const start = i * botW - botW * 0.25;
      ctx.fillStyle = "rgb(19,19,19)";
      ctx.fillRect(Math.round(start), topH + midH, Math.ceil(botW), botH);
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.fillRect(Math.round(start + botW * 0.8), topH + midH, Math.ceil(botW * 0.2), botH);
    }
    return;
  }

  if (pattern === "full-color-bars" || pattern === "color-bars-crosshair") {
    drawFullColorBars(ctx, w, h);
    if (pattern === "full-color-bars") return;

    const progress = bounceProgress(frame, fps);
    const verticalThickness = Math.max(4, Math.round(Math.min(w, h) * 0.025));
    const horizontalThickness = verticalThickness;
    const x = progress * (w - verticalThickness);
    const y = progress * (h - horizontalThickness);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(x), 0, verticalThickness, h);
    ctx.fillRect(0, Math.round(y), w, horizontalThickness);
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(Math.round(x + verticalThickness * 0.25), 0, Math.max(1, Math.round(verticalThickness * 0.5)), h);
    ctx.fillRect(0, Math.round(y + horizontalThickness * 0.25), w, Math.max(1, Math.round(horizontalThickness * 0.5)));
    return;
  }

  if (pattern === "moving-grid") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    const cell = Math.max(40, Math.round(w / 16));
    const offset = (frame * (cell / 4)) % cell;
    ctx.strokeStyle = "#00c896";
    ctx.lineWidth = Math.max(2, Math.round(w / 960));
    ctx.beginPath();
    for (let x = -cell + offset; x < w + cell; x += cell) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = -cell + offset; y < h + cell; y += cell) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    const cx = w / 2 + Math.cos(frame / (fps * 2)) * (w * 0.35);
    const cy = h / 2 + Math.sin(frame / (fps * 2)) * (h * 0.35);
    const r = Math.round(h * 0.08);
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, w, h);
  const big = Math.round(h * 0.28);
  const small = Math.round(h * 0.07);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${big}px monospace`;
  ctx.fillText(String(frame), w / 2, h * 0.42);
  const totalSec = frame / fps;
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(Math.floor(totalSec % 60)).padStart(2, "0");
  const ff = String(frame % fps).padStart(2, "0");
  ctx.font = `600 ${small}px monospace`;
  ctx.fillText(`TC ${mm}:${ss}:${ff}  |  ${w}x${h}  |  ${fps}fps`, w / 2, h * 0.68);
}

function videoCodecCandidates(width: number, height: number): string[] {
  if (width > 2560 || height > 1440) {
    return ["avc1.640034", "avc1.640033", "avc1.4d0034", "avc1.42003e"];
  }
  return ["avc1.640033", "avc1.640032", "avc1.4d0034", "avc1.42003e"];
}

async function pickVideoCodec(width: number, height: number, fps: number, bitrate: number): Promise<VideoEncoderConfig | null> {
  for (const codec of videoCodecCandidates(width, height)) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate,
      framerate: fps,
      avc: { format: "avc" as AvcBitstreamFormat },
    };
    const support = await (window as any).VideoEncoder.isConfigSupported(config);
    if (support?.supported) return config;
  }
  return null;
}

async function pickAudioCodec(): Promise<AudioEncoderConfig | null> {
  for (const [codec, muxerCodec] of [["mp4a.40.2", "aac"], ["opus", "opus"]] as const) {
    const config: AudioEncoderConfig = {
      codec,
      sampleRate: SAMPLE_RATE,
      numberOfChannels: AUDIO_CHANNELS,
      bitrate: 192_000,
    };
    const support = await (window as any).AudioEncoder.isConfigSupported(config);
    if (support?.supported) return config;
  }
  return null;
}

interface GenerateOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  pattern: TestVideoPattern;
  onProgress?: (fraction: number, label: string) => boolean;
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function canvasToI420(ctx: CanvasRenderingContext2D, width: number, height: number): ArrayBuffer {
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const chromaWidth = width / 2;
  const chromaHeight = height / 2;
  const ySize = width * height;
  const chromaSize = chromaWidth * chromaHeight;
  const output = new Uint8Array(ySize + chromaSize * 2);
  const uOffset = ySize;
  const vOffset = ySize + chromaSize;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      const r = rgba[source];
      const g = rgba[source + 1];
      const b = rgba[source + 2];
      output[y * width + x] = clampByte(0.257 * r + 0.504 * g + 0.098 * b + 16);
    }
  }

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let row = 0; row < 2; row++) {
        for (let column = 0; column < 2; column++) {
          const source = ((y + row) * width + x + column) * 4;
          r += rgba[source];
          g += rgba[source + 1];
          b += rgba[source + 2];
        }
      }
      r /= 4;
      g /= 4;
      b /= 4;
      const chromaIndex = (y / 2) * chromaWidth + x / 2;
      output[uOffset + chromaIndex] = clampByte(-0.148 * r - 0.291 * g + 0.439 * b + 128);
      output[vOffset + chromaIndex] = clampByte(0.439 * r - 0.368 * g - 0.071 * b + 128);
    }
  }

  return output.buffer;
}

async function generateTestVideo(opts: GenerateOptions): Promise<Blob> {
  const { width, height, fps, duration, pattern, onProgress } = opts;
  const totalFrames = Math.round(duration * fps);
  const report = (f: number, label: string) => {
    if (onProgress?.(f, label)) throw new DOMException("Aborted", "AbortError");
  };

  const bitrate = getBitrate(width, height, fps);
  const videoConfig = await pickVideoCodec(width, height, fps, bitrate);
  if (!videoConfig) throw new Error("No supported video encoder configuration was found.");
  const audioConfig = await pickAudioCodec();

  const target = new ArrayBufferTarget();
  const muxer = new Muxer<ArrayBufferTarget>({
    target,
    fastStart: "in-memory",
    video: { codec: "avc", width, height, frameRate: fps },
    ...(audioConfig ? { audio: { codec: (audioConfig.codec === "mp4a.40.2" ? "aac" : "opus") as "aac" | "opus", numberOfChannels: AUDIO_CHANNELS, sampleRate: SAMPLE_RATE } } : {}),
  });

  let encodeError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e; },
  });
  videoEncoder.configure(videoConfig);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  const keyframeInterval = fps * 2;
  for (let i = 0; i < totalFrames; i++) {
    if (encodeError) throw encodeError;
    report((i / totalFrames) * 0.9, `Rendering frame ${i + 1} of ${totalFrames}`);
    drawPattern(pattern, ctx, width, height, i, fps);
    const timestamp = Math.round((i * 1e6) / fps);
    const i420Buffer = canvasToI420(ctx, width, height);
    const encodedFrame = new VideoFrame(i420Buffer, {
      format: "I420",
      codedWidth: width,
      codedHeight: height,
      timestamp,
      duration: Math.round(1e6 / fps),
    });
    try {
      videoEncoder.encode(encodedFrame, { keyFrame: i % keyframeInterval === 0 });
    } finally {
      encodedFrame.close();
    }
    if (videoEncoder.encodeQueueSize > 8) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (videoEncoder.encodeQueueSize <= 4) resolve();
          else setTimeout(check, 8);
        };
        check();
      });
    }
  }
  report(0.92, "Encoding video");
  await videoEncoder.flush();
  videoEncoder.close();

  if (audioConfig) {
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => { encodeError = e; },
    });
    audioEncoder.configure(audioConfig);
    const totalSamples = SAMPLE_RATE * duration;
    const chunkSamples = SAMPLE_RATE;
    const buffer = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * SINE_FREQUENCY * i) / SAMPLE_RATE) * 0.8;
    }
    for (let start = 0; start < totalSamples; start += chunkSamples) {
      if (encodeError) throw encodeError;
      const count = Math.min(chunkSamples, totalSamples - start);
      report(0.92 + (start / totalSamples) * 0.06, "Encoding audio tone");
      const slice = buffer.subarray(start, start + count);
      const planar = new Float32Array(count * AUDIO_CHANNELS);
      for (let ch = 0; ch < AUDIO_CHANNELS; ch++) planar.set(slice, ch * count);
      const data = new AudioData({
        format: "f32-planar",
        sampleRate: SAMPLE_RATE,
        numberOfFrames: count,
        numberOfChannels: AUDIO_CHANNELS,
        timestamp: Math.round((start / SAMPLE_RATE) * 1e6),
        data: planar,
      });
      try {
        audioEncoder.encode(data);
      } finally {
        data.close();
      }
    }
    report(0.98, "Finalizing audio");
    await audioEncoder.flush();
    audioEncoder.close();
  }

  report(0.99, "Building MP4 file");
  muxer.finalize();
  report(1, "Done");
  return new Blob([target.buffer], { type: "video/mp4" });
}

export function TestVideoView() {
  const { activeProjectId, currentScreen } = usePixelMap();
  const [resolution, setResolution] = useState<ResolutionChoice>("1080p");
  const [frameRate, setFrameRate] = useState<30 | 60>(30);
  const [durationSeconds, setDurationSeconds] = useState<10 | 20 | 30>(10);
  const [pattern, setPattern] = useState<TestVideoPattern>("smpte-bars");

  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  const [presets, setPresets] = useState<TestVideoPreset[] | null>(null);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const cancelRef = useRef(false);

  const screenRes = useMemo(() => {
    const sections = (currentScreen as any)?.sections ?? [];
    const dims = currentScreen?.dimensions;
    if (!dims) return { width: 0, height: 0 };
    if (Array.isArray(sections) && sections.length > 0) {
      const w = sections.reduce((sum: number, s: any) => sum + s.columnCount * s.tileWidthPx, 0);
      const h = (sections[0]?.tileHeightPx ?? dims.tileHeight) * dims.screenHeight;
      return { width: w, height: h };
    }
    return { width: dims.screenWidth * dims.tileWidth, height: dims.screenHeight * dims.tileHeight };
  }, [currentScreen]);

  const effective = getResolutionFor(resolution, screenRes.width, screenRes.height);

  const estimatedSize = useMemo(
    () => Math.round((getBitrate(effective.width, effective.height, frameRate) / 8) * durationSeconds),
    [effective.width, effective.height, frameRate, durationSeconds]
  );

  useEffect(() => {
    setSupported(isWebCodecsSupported());
  }, []);

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrame = 0;
    const startedAt = performance.now();
    const previewFps = 30;
    const animate = (now: number) => {
      const frame = Math.floor(((now - startedAt) / 1000) * previewFps);
      drawPattern(pattern, ctx, canvas.width, canvas.height, frame, previewFps);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [pattern]);

  const refreshPresets = useCallback(async () => {
    if (!activeProjectId) {
      setPresets(null);
      return;
    }
    setPresets(null);
    setPresetsError(null);
    const { data, error: loadError } = await loadTestVideoPresets(activeProjectId);
    if (loadError) setPresetsError(loadError);
    else setPresets(data);
  }, [activeProjectId]);

  useEffect(() => {
    void refreshPresets();
  }, [refreshPresets]);

  const handleGenerate = async () => {
    if (isRendering) return;
    if (supported === false) {
      setError("This browser can't create encoded test videos. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (!effective.width || !effective.height) {
      setError("Could not determine a usable video resolution. Check the screen settings and try again.");
      return;
    }
    setError(null);
    setResultUrl(null);
    setProgress(0);
    setProgressLabel("Starting");
    cancelRef.current = false;
    setIsRendering(true);
    try {
      const blob = await generateTestVideo({
        width: effective.width,
        height: effective.height,
        fps: frameRate,
        duration: durationSeconds,
        pattern,
        onProgress: (f, label) => {
          setProgress(Math.round(f * 100));
          setProgressLabel(label);
          return cancelRef.current;
        },
      });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      setProgressLabel("Done");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setProgressLabel("Canceled");
      } else {
        console.error("src/components/pixel-map/test-video-view.tsx:", err);
        setError("The browser could not encode this frame format. Please use the latest Google Chrome or Microsoft Edge and try again.");
        setProgress(0);
        setProgressLabel("");
      }
    } finally {
      setIsRendering(false);
      cancelRef.current = false;
    }
  };

  const handleSavePreset = async () => {
    if (!activeProjectId || savingPreset) return;
    setPresetsError(null);
    setSavingPreset(true);
    const { success, error: saveError } = await saveTestVideoPreset(activeProjectId, presetName, {
      resolution,
      frameRate,
      durationSeconds,
      pattern,
    });
    setSavingPreset(false);
    if (!success) {
      setPresetsError(saveError);
      return;
    }
    setPresetName("");
    await refreshPresets();
  };

  const handleRename = async (id: string) => {
    setPresetsError(null);
    const { success, error: saveError } = await renameTestVideoPreset(id, renameValue);
    if (!success) {
      setPresetsError(saveError);
      return;
    }
    setRenamingId(null);
    await refreshPresets();
  };

  const handleDelete = async (id: string) => {
    setPresetsError(null);
    const { success, error: saveError } = await deleteTestVideoPreset(id);
    if (!success) {
      setPresetsError(saveError);
      return;
    }
    await refreshPresets();
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const patternSlug = pattern.replace(/[^a-z0-9]+/g, "-");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${patternSlug}-${effective.width}x${effective.height}-${frameRate}fps-${durationSeconds}s.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <MonitorPlay className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Test Video Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {supported === false && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This browser can&apos;t create the encoded test videos. Please use Google Chrome or Microsoft Edge to generate and download them.
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as ResolutionChoice)} disabled={isRendering}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.value === "screen" && screenRes.width > 0
                        ? `Screen (${screenRes.width} x ${screenRes.height})`
                        : r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frame Rate</Label>
              <Select value={String(frameRate)} onValueChange={(v) => setFrameRate(Number(v) as 30 | 60)} disabled={isRendering}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 fps</SelectItem>
                  <SelectItem value="60">60 fps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={String(durationSeconds)} onValueChange={(v) => setDurationSeconds(Number(v) as 10 | 20 | 30)} disabled={isRendering}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pattern</Label>
              <Select value={pattern} onValueChange={(v) => setPattern(v as TestVideoPattern)} disabled={isRendering}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PATTERNS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="overflow-hidden rounded-lg border bg-black">
                <canvas
                  ref={previewRef}
                  width={640}
                  height={360}
                  className="w-full h-auto block"
                  aria-label="Test pattern preview"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The preview animates the selected pattern. The generated video includes the same motion with a synchronized 1 kHz tone.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="font-medium mb-2">Output summary</div>
              <div className="text-muted-foreground">Resolution: <span className="font-mono text-foreground">{effective.width} x {effective.height}</span></div>
              <div className="text-muted-foreground">Frame rate: <span className="font-mono text-foreground">{frameRate} fps</span></div>
              <div className="text-muted-foreground">Duration: <span className="font-mono text-foreground">{durationSeconds}s</span></div>
              <div className="text-muted-foreground">Tone: <span className="font-mono text-foreground">1 kHz sine</span></div>
              <div className="text-muted-foreground">Estimated size: <span className="font-mono text-foreground">{formatBytes(estimatedSize)}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleGenerate} disabled={isRendering || supported === false}>
              {isRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {isRendering ? "Generating" : "Generate Video"}
            </Button>
            {isRendering && (
              <Button variant="outline" onClick={() => { cancelRef.current = true; }}>
                <Square className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
            {resultUrl && !isRendering && (
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download MP4 ({formatBytes(resultSize)})
              </Button>
            )}
          </div>

          {(isRendering || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progressLabel || (isRendering ? "Working" : "Ready")}</span>
                <span className="font-mono">{progress}%</span>
              </div>
            </div>
          )}

          {resultUrl && !isRendering && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Your test video is ready. Click Download MP4 to save it to your computer.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Save className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeProjectId ? (
            <p className="text-sm text-muted-foreground">Save your project to the cloud to keep generator presets.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label htmlFor="preset-name">Preset name</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    maxLength={60}
                    placeholder="e.g. LED Wall Check 1080p"
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                  />
                </div>
                <Button onClick={handleSavePreset} disabled={savingPreset || !presetName.trim()}>
                  {savingPreset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Current Settings
                </Button>
              </div>

              {presetsError && <p className="text-sm text-destructive">{presetsError}</p>}

              {presets === null ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No presets saved yet. Set up a configuration above and save it with a name.</p>
              ) : (
                <div className="space-y-2">
                  {presets.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                      {renamingId === p.id ? (
                        <>
                          <Input
                            autoFocus
                            value={renameValue}
                            maxLength={60}
                            className="h-8 flex-1 min-w-[160px]"
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleRename(p.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Confirm rename" onClick={() => void handleRename(p.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Cancel rename" onClick={() => setRenamingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-[180px]">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {p.settings.resolution === "screen"
                                ? `Screen (${screenRes.width} x ${screenRes.height})`
                                : `${getResolutionFor(p.settings.resolution, screenRes.width, screenRes.height).width} x ${getResolutionFor(p.settings.resolution, screenRes.width, screenRes.height).height}`}
                              {" · "}{p.settings.frameRate}fps · {p.settings.durationSeconds}s · {PATTERNS.find(x => x.value === p.settings.pattern)?.label}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setResolution(p.settings.resolution);
                              setFrameRate(p.settings.frameRate);
                              setDurationSeconds(p.settings.durationSeconds);
                              setPattern(p.settings.pattern);
                            }}
                            disabled={isRendering}
                          >
                            Load
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Rename ${p.name}`}
                            onClick={() => { setRenamingId(p.id); setRenameValue(p.name); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${p.name}`}
                            onClick={() => void handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
