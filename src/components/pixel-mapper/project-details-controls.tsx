
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

const MEDIA_SERVERS = [
  "disguise", "Hippotizer", "Pixera", "Resolume", "Watchout", "Millumin", "vMix", "7thSense", "Custom"
];

const CODECS = [
  "HAP", "HAP Q", "HAP Alpha", "DXV3", "ProRes 422", "ProRes 4444", "NotchLC", "H.264", "H.265", "Uncompressed"
];

const CONTAINERS = ["MOV", "MP4", "AVI", "MXF", "DPX Sequence", "TIFF Sequence"];

const FRAME_RATES = ["23.976", "24", "25", "29.97", "30", "50", "59.94", "60", "120", "240"];

const IMAGE_FORMATS = ["PNG", "TIFF", "TGA", "JPG", "EXR"];

const SAMPLING_RATES = ["44.1 kHz", "48 kHz", "96 kHz"];
const BIT_RATES = ["16-bit", "24-bit", "32-bit float"];

export function ProjectDetailsControls() {
  const {
    projectNumber, setProjectNumber,
    versionNumber, setVersionNumber,
    projectNotes, setProjectNotes,
    mediaServer, setMediaServer,
    preferredCodec, setPreferredCodec,
    videoContainer, setVideoContainer,
    frameRate, setFrameRate,
    audioEmbedded, setAudioEmbedded,
    samplingRate, setSamplingRate,
    audioBitRate, setAudioBitRate,
    imageFormat, setImageFormat,
    screens,
    currentScreen,
    updateScreenById,
  } = usePixelMap();

  const OUTPUT_RESOLUTION_PRESETS = [
    { value: 'content', label: 'Match Content' },
    { value: '1920x1080', label: '1920 x 1080 (HD)' },
    { value: '3840x2160', label: '3840 x 2160 (4K UHD)' },
    { value: '4096x2160', label: '4096 x 2160 (4K DCI)' },
    { value: 'custom', label: 'Custom' },
  ];

  const setScreenOutputCount = (screenId: string, count: number) => {
    updateScreenById(screenId, s => ({ ...s, outputCount: Math.max(1, count) }));
  };

  const setScreenOutputPreset = (screenId: string, preset: string) => {
    const dims: Record<string, [number, number]> = {
      '1920x1080': [1920, 1080],
      '3840x2160': [3840, 2160],
      '4096x2160': [4096, 2160],
    };
    updateScreenById(screenId, s => {
      if (preset === 'custom') {
        return { ...s, outputResolutionPreset: 'custom' as const };
      }
      if (preset === 'content') {
        return { ...s, outputResolutionPreset: 'content' as const, outputResolutionWidth: 0, outputResolutionHeight: 0 };
      }
      const [w, h] = dims[preset] ?? [0, 0];
      return { ...s, outputResolutionPreset: preset as any, outputResolutionWidth: w, outputResolutionHeight: h };
    });
  };

  const setScreenCustomResolution = (screenId: string, field: 'width' | 'height', value: number) => {
    updateScreenById(screenId, s => ({
      ...s,
      outputResolutionPreset: 'custom' as const,
      outputResolutionWidth: field === 'width' ? value : s.outputResolutionWidth,
      outputResolutionHeight: field === 'height' ? value : s.outputResolutionHeight,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Core Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Core Details</h3>
        <div className="space-y-2">
          <Label htmlFor="project-number">Project Number</Label>
          <Input
            id="project-number"
            placeholder="e.g. PJ-2024-001"
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version-number">Version Number</Label>
          <Input
            id="version-number"
            placeholder="e.g. 1.0"
            value={versionNumber}
            onChange={(e) => setVersionNumber(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Playback Specs */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Playback Specs</h3>

        <div className="space-y-2">
          <Label>Media Server / Playback</Label>
          <Select value={mediaServer} onValueChange={setMediaServer}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDIA_SERVERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preferred Codec</Label>
          <Select value={preferredCodec} onValueChange={setPreferredCodec}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CODECS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Container</Label>
          <Select value={videoContainer} onValueChange={setVideoContainer}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTAINERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Frame Rate</Label>
          <Select value={frameRate} onValueChange={setFrameRate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FRAME_RATES.map(f => <SelectItem key={f} value={f}>{f} fps</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between gap-3 py-1">
          <Label htmlFor="audio-embedded" className="text-sm">Audio Embedded</Label>
          <Switch id="audio-embedded" checked={audioEmbedded} onCheckedChange={setAudioEmbedded} />
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {audioEmbedded ? "Audio will be embedded in the video file." : "Audio will be delivered as a separate file."}
        </p>

        <div className="space-y-2">
          <Label>Sampling Rate</Label>
          <Select value={samplingRate} onValueChange={setSamplingRate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SAMPLING_RATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bit Rate</Label>
          <Select value={audioBitRate} onValueChange={setAudioBitRate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BIT_RATES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-2" />

        <div className="space-y-2">
          <Label>Image File Format</Label>
          <Select value={imageFormat} onValueChange={setImageFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {IMAGE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Per-Screen Output Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Media Server Outputs</h3>
        <p className="text-sm text-muted-foreground">Define the number of outputs and output resolution for each screen.</p>
        <div className="space-y-4">
          {screens.map(screen => {
            const isCurrent = screen.id === currentScreen.id;
            const preset = screen.outputResolutionPreset ?? 'content';
            const showCustom = preset === 'custom';
            return (
              <div key={screen.id} className={`rounded-lg border p-3 space-y-3 ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{screen.name}</span>
                  {isCurrent && <span className="text-xs text-primary font-medium">Active</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Number of Outputs</Label>
                    <Input
                      type="number"
                      min={1}
                      max={64}
                      value={screen.outputCount ?? 1}
                      onChange={e => setScreenOutputCount(screen.id, parseInt(e.target.value) || 1)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Output Resolution</Label>
                    <Select value={preset} onValueChange={v => setScreenOutputPreset(screen.id, v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OUTPUT_RESOLUTION_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {showCustom && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Custom Width</Label>
                      <Input
                        type="number"
                        min={1}
                        value={screen.outputResolutionWidth ?? 0}
                        onChange={e => setScreenCustomResolution(screen.id, 'width', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Custom Height</Label>
                      <Input
                        type="number"
                        min={1}
                        value={screen.outputResolutionHeight ?? 0}
                        onChange={e => setScreenCustomResolution(screen.id, 'height', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Delivery Instructions */}
      <div className="space-y-2">
        <Label htmlFor="project-notes">Delivery Instructions / Notes</Label>
        <Textarea
          id="project-notes"
          placeholder="Enter content delivery notes, file naming conventions, etc."
          rows={6}
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
