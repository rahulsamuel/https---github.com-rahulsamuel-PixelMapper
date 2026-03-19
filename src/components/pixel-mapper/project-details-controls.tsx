
"use client";

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const MEDIA_SERVERS = [
  "disguise", "Hippotizer", "Pixera", "Resolume", "Watchout", "Millumin", "vMix", "7thSense", "Custom"
];

const CODECS = [
  "HAP", "HAP Q", "HAP Alpha", "DXV3", "ProRes 422", "ProRes 4444", "NotchLC", "H.264", "H.265", "Uncompressed"
];

const IMAGE_FORMATS = [
  "PNG", "TIFF", "TGA", "JPG", "EXR"
];

export function ProjectDetailsControls() {
  const { 
    projectNumber, setProjectNumber,
    versionNumber, setVersionNumber,
    projectNotes, setProjectNotes,
    mediaServer, setMediaServer,
    preferredCodec, setPreferredCodec,
    audioFormat, setAudioFormat,
    imageFormat, setImageFormat
  } = usePixelMap();

  return (
    <div className="space-y-6">
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
          <Label>Image File Format</Label>
          <Select value={imageFormat} onValueChange={setImageFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {IMAGE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio-format">Audio Requirements</Label>
          <Input 
            id="audio-format" 
            placeholder="e.g. WAV 48kHz 24-bit Stereo" 
            value={audioFormat} 
            onChange={(e) => setAudioFormat(e.target.value)}
          />
        </div>
      </div>

      <Separator />

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
