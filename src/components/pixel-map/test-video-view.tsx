"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MonitorPlay, Play, Square, Download, Save, Trash2, Pencil, Check, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  type TestVideoPreset,
  type TestVideoPresetSettings,
  type TestVideoCodec,
  loadTestVideoPresets,
  saveTestVideoPreset,
  renameTestVideoPreset,
  deleteTestVideoPreset,
} from "@/lib/test-video-presets";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { useTestVideoSettings } from "./test-video-settings";

type ResolutionChoice = TestVideoPresetSettings["resolution"];
const RESOLUTIONS: { value: ResolutionChoice; width: number; height: number }[] = [
  { value: "720p", width: 1280, height: 720 },
  { value: "1080p", width: 1920, height: 1080 },
  { value: "4k", width: 3840, height: 2160 },
  { value: "screen", width: 0, height: 0 },
];
const AUDIO_CHANNELS = 2;
const SINE_FREQUENCY = 1000;

function isWebCodecsSupported() {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).VideoEncoder !== "undefined" &&
    typeof (window as any).VideoFrame !== "undefined"
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

function drawSmpteBars(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
  for (let i = 0; i < 6; i++) {
    const start = i * botW - botW * 0.25;
    ctx.fillStyle = "rgb(19,19,19)";
    ctx.fillRect(Math.round(start), topH + midH, Math.ceil(botW), botH);
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(Math.round(start + botW * 0.8), topH + midH, Math.ceil(botW * 0.2), botH);
  }
}

export function drawPattern(
  settings: Pick<TestVideoPresetSettings, "background" | "bars" | "barWidth">,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  fps: number
) {
  if (settings.background === "smpte-bars") drawSmpteBars(ctx, w, h);
  else if (settings.background === "full-color-bars") drawFullColorBars(ctx, w, h);
  else if (settings.background === "moving-grid") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    const cell = Math.max(40, Math.round(w / 16));
    const offset = (frame * (cell / 4)) % cell;
    ctx.strokeStyle = "#00c896";
    ctx.lineWidth = Math.max(2, Math.round(w / 960));
    ctx.beginPath();
    for (let x = -cell + offset; x < w + cell; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = -cell + offset; y < h + cell; y += cell) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    const cx = w / 2 + Math.cos(frame / (fps * 2)) * (w * 0.35);
    const cy = h / 2 + Math.sin(frame / (fps * 2)) * (h * 0.35);
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.round(h * 0.08), 0, Math.PI * 2);
    ctx.fill();
  } else if (settings.background === "frame-counter") {
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);
    const totalSec = frame / fps;
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(Math.floor(totalSec % 60)).padStart(2, "0");
    const ff = String(frame % fps).padStart(2, "0");
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(h * 0.28)}px monospace`;
    ctx.fillText(String(frame), w / 2, h * 0.42);
    ctx.font = `600 ${Math.round(h * 0.07)}px monospace`;
    ctx.fillText(`TC ${mm}:${ss}:${ff}  |  ${w}x${h}  |  ${fps}fps`, w / 2, h * 0.68);
  } else {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);
  }

  if (settings.bars === "bouncing-crosshair") {
    const thickness = Math.max(1, Math.round(settings.barWidth));
    const progress = bounceProgress(frame, fps);
    const x = progress * (w - thickness);
    const y = progress * (h - thickness);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(x), 0, thickness, h);
    ctx.fillRect(0, Math.round(y), w, thickness);
    ctx.fillStyle = "#00e5ff";
    const inner = Math.max(1, Math.round(thickness * 0.5));
    ctx.fillRect(Math.round(x + thickness * 0.25), 0, inner, h);
    ctx.fillRect(0, Math.round(y + thickness * 0.25), w, inner);
  }
}

function videoCodecCandidates(codec: TestVideoCodec, width: number, height: number): string[] {
  const level = width > 2560 || height > 1440 ? "34" : "33";
  if (codec === "h264-main") return [`avc1.4d00${level}`];
  if (codec === "h264-baseline") return ["avc1.42003e"];
  return [`avc1.6400${level}`];
}

async function pickVideoCodec(codecChoice: TestVideoCodec, width: number, height: number, fps: number, bitrate: number): Promise<VideoEncoderConfig | null> {
  for (const codec of videoCodecCandidates(codecChoice, width, height)) {
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

async function pickAudioCodec(sampleRate: TestVideoPresetSettings["sampleRate"]): Promise<AudioEncoderConfig | null> {
  for (const codec of ["mp4a.40.2", "opus"] as const) {
    const config: AudioEncoderConfig = {
      codec,
      sampleRate,
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
  settings: Pick<TestVideoPresetSettings, "background" | "bars" | "barWidth" | "audioEnabled" | "sampleRate" | "videoCodec">;
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
  const { width, height, fps, duration, settings, onProgress } = opts;
  const totalFrames = Math.round(duration * fps);
  const report = (f: number, label: string) => {
    if (onProgress?.(f, label)) throw new DOMException("Aborted", "AbortError");
  };

  const bitrate = getBitrate(width, height, fps);
  const videoConfig = await pickVideoCodec(settings.videoCodec, width, height, fps, bitrate);
  if (!videoConfig) throw new Error("The selected H.264 codec is not supported by this browser.");
  const audioConfig = settings.audioEnabled ? await pickAudioCodec(settings.sampleRate) : null;
  if (settings.audioEnabled && !audioConfig) throw new Error("The selected audio sample rate is not supported by this browser.");

  const target = new ArrayBufferTarget();
  const muxer = new Muxer<ArrayBufferTarget>({
    target,
    fastStart: "in-memory",
    video: { codec: "avc", width, height, frameRate: fps },
    ...(audioConfig ? { audio: { codec: (audioConfig.codec === "mp4a.40.2" ? "aac" : "opus") as "aac" | "opus", numberOfChannels: AUDIO_CHANNELS, sampleRate: settings.sampleRate } } : {}),
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
    drawPattern(settings, ctx, width, height, i, fps);
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
    const totalSamples = settings.sampleRate * duration;
    const chunkSamples = settings.sampleRate;
    const buffer = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * SINE_FREQUENCY * i) / settings.sampleRate) * 0.8;
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
        sampleRate: settings.sampleRate,
        numberOfFrames: count,
        numberOfChannels: AUDIO_CHANNELS,
        timestamp: Math.round((start / settings.sampleRate) * 1e6),
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
  const { settings, setSettings } = useTestVideoSettings();
  const { resolution, frameRate, durationSeconds } = settings;

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
      drawPattern(settings, ctx, canvas.width, canvas.height, frame, previewFps);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [settings]);

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
        settings,
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
    const { success, error: saveError } = await saveTestVideoPreset(activeProjectId, presetName, settings);
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
    const patternSlug = `${settings.background}-${settings.bars}`.replace(/[^a-z0-9]+/g, "-");
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
                The preview uses the selected background and moving bars. The generated video includes the same motion.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="font-medium mb-2">Output summary</div>
              <div className="text-muted-foreground">Resolution: <span className="font-mono text-foreground">{effective.width} x {effective.height}</span></div>
              <div className="text-muted-foreground">Frame rate: <span className="font-mono text-foreground">{frameRate} fps</span></div>
              <div className="text-muted-foreground">Duration: <span className="font-mono text-foreground">{durationSeconds}s</span></div>
              <div className="text-muted-foreground">Audio: <span className="font-mono text-foreground">{settings.audioEnabled ? `1 kHz sine · ${settings.sampleRate / 1000} kHz` : "Off"}</span></div>
              <div className="text-muted-foreground">Codec: <span className="font-mono text-foreground">{settings.videoCodec.replace("h264-", "H.264 ")}</span></div>
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
                              {" · "}{p.settings.frameRate}fps · {p.settings.durationSeconds}s · {p.settings.background} · {p.settings.bars}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSettings(p.settings);
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
