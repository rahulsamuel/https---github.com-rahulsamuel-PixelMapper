
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
    audioFormat, setAudioFormat,
    audioEmbedded, setAudioEmbedded,
    samplingRate, setSamplingRate,
    audioBitRate, setAudioBitRate,
    imageFormat, setImageFormat
  } = usePixelMap();

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
          <Label>Audio Format</Label>
          <Input
            placeholder="e.g. WAV"
            value={audioFormat}
            onChange={(e) => setAudioFormat(e.target.value)}
          />
        </div>

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
