"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTestVideoSettings } from "./test-video-settings";
import type { TestVideoBackground, TestVideoBarMode, TestVideoCodec, TestVideoAudioSampleRate } from "@/lib/test-video-presets";

type ResolutionChoice = "720p" | "1080p" | "4k" | "screen";

const RESOLUTIONS: { value: ResolutionChoice; label: string }[] = [
  { value: "720p", label: "720p (1280 x 720)" },
  { value: "1080p", label: "1080p (1920 x 1080)" },
  { value: "4k", label: "4K (3840 x 2160)" },
  { value: "screen", label: "Use current screen resolution" },
];

const SAMPLE_RATES: { value: TestVideoAudioSampleRate; label: string }[] = [
  { value: 8000, label: "8 kHz" },
  { value: 16000, label: "16 kHz" },
  { value: 24000, label: "24 kHz" },
  { value: 44100, label: "44.1 kHz" },
  { value: 48000, label: "48 kHz" },
  { value: 96000, label: "96 kHz" },
];

const CODECS: { value: TestVideoCodec; label: string }[] = [
  { value: "h264-high", label: "H.264 High" },
  { value: "h264-main", label: "H.264 Main" },
  { value: "h264-baseline", label: "H.264 Baseline" },
];

const BACKGROUNDS: { value: TestVideoBackground; label: string }[] = [
  { value: "black", label: "Black" },
  { value: "smpte-bars", label: "SMPTE Color Bars" },
  { value: "full-color-bars", label: "100% Color Bars" },
  { value: "moving-grid", label: "Moving Grid" },
  { value: "frame-counter", label: "Frame Counter" },
];

const BAR_MODES: { value: TestVideoBarMode; label: string }[] = [
  { value: "none", label: "No Bouncing Bars" },
  { value: "bouncing-crosshair", label: "Bouncing Vertical + Horizontal Bars" },
];

export function TestVideoControls() {
  const { currentScreen } = usePixelMap();
  const { settings, setSettings } = useTestVideoSettings();
  const sections = (currentScreen as { sections?: { columnCount: number; tileWidthPx: number; tileHeightPx?: number }[] } | null)?.sections ?? [];
  const dimensions = currentScreen?.dimensions;
  const screenWidth = sections.length > 0
    ? sections.reduce((sum, section) => sum + section.columnCount * section.tileWidthPx, 0)
    : dimensions ? dimensions.screenWidth * dimensions.tileWidth : 0;
  const screenHeight = sections.length > 0
    ? (sections[0]?.tileHeightPx ?? dimensions?.tileHeight ?? 0) * (dimensions?.screenHeight ?? 0)
    : dimensions ? dimensions.screenHeight * dimensions.tileHeight : 0;
  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Resolution</Label>
        <Select value={settings.resolution} onValueChange={(value) => update("resolution", value as ResolutionChoice)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RESOLUTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.value === "screen" && screenWidth > 0 ? `Screen (${screenWidth} x ${screenHeight})` : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Frame Rate</Label>
          <Select value={String(settings.frameRate)} onValueChange={(value) => update("frameRate", Number(value) as 30 | 60)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 fps</SelectItem>
              <SelectItem value="60">60 fps</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={String(settings.durationSeconds)} onValueChange={(value) => update("durationSeconds", Number(value) as 10 | 20 | 30)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="20">20 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Background</Label>
        <Select value={settings.background} onValueChange={(value) => update("background", value as TestVideoBackground)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{BACKGROUNDS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Moving Bars</Label>
        <Select value={settings.bars} onValueChange={(value) => update("bars", value as TestVideoBarMode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{BAR_MODES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-video-bar-width">Bar Width (pixels)</Label>
        <Input
          id="test-video-bar-width"
          type="number"
          min={1}
          max={200}
          step={1}
          value={settings.barWidth}
          disabled={settings.bars === "none"}
          onChange={(event) => update("barWidth", Math.max(1, Math.min(200, Number(event.target.value) || 1)))}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <Label htmlFor="test-video-audio" className="cursor-pointer">Audio tone</Label>
        <Switch id="test-video-audio" checked={settings.audioEnabled} onCheckedChange={(checked) => update("audioEnabled", checked)} />
      </div>

      <div className="space-y-2">
        <Label>Audio Sample Rate</Label>
        <Select value={String(settings.sampleRate)} onValueChange={(value) => update("sampleRate", Number(value) as TestVideoAudioSampleRate)} disabled={!settings.audioEnabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SAMPLE_RATES.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Video Codec</Label>
        <Select value={settings.videoCodec} onValueChange={(value) => update("videoCodec", value as TestVideoCodec)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CODECS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
