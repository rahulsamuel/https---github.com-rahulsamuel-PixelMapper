"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Server, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MediaOutputControls() {
  const {
    mapType,
    setMapType,
    resolution,
    setResolution,
    aiResult,
    isGenerating,
    generateMap,
    handleDownloadText,
  } = usePixelMapper();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="size-5" />
          <CardTitle>Media Output</CardTitle>
        </div>
        <CardDescription>
          Generate a pixel map or a raster map for your media server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={mapType} onValueChange={(v) => setMapType(v as "pixel" | "raster")}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pixel" id="pixel" />
            <Label htmlFor="pixel">Pixel Map</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="raster" id="raster" />
            <Label htmlFor="raster">Raster Map (AI)</Label>
          </div>
        </RadioGroup>

        {mapType === "raster" && (
          <div className="space-y-2">
            <Label htmlFor="resolution">Output Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as "HD" | "4K" | "DCI")}>
              <SelectTrigger id="resolution">
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HD">HD (1920x1080)</SelectItem>
                <SelectItem value="4K">4K (3840x2160)</SelectItem>
                <SelectItem value="DCI">DCI (4096x2160)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={generateMap} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate
        </Button>
        {aiResult && (
          <Alert>
            <AlertTitle>Generated Raster Map</AlertTitle>
            <AlertDescription className="mt-2">
                <Textarea value={aiResult} readOnly rows={8} className="text-xs bg-muted/50 font-mono"/>
                 <Button onClick={() => handleDownloadText(aiResult, 'raster-map.txt')} variant="outline" size="sm" className="mt-2">Download Map</Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
