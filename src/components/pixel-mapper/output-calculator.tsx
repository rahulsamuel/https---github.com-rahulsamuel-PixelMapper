"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator } from "lucide-react";

const VIDEO_FORMATS = {
  HD: { width: 1920, height: 1080, label: "HD (1920x1080)" },
  "4K_UHD": { width: 3840, height: 2160, label: "4K UHD (3840x2160)" },
  "4K_DCI": { width: 4096, height: 2160, label: "4K DCI (4096x2160)" },
};

export function OutputCalculator() {
  const { dimensions, activeBounds } = usePixelMapper();
  
  const totalPixelWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : 0;
  const totalPixelHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : 0;
  const totalPixels = totalPixelWidth * totalPixelHeight;

  if (totalPixels === 0) {
    return (
       <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="size-5" />
            <CardTitle>Output Calculator</CardTitle>
          </div>
          <CardDescription>
            Calculates the required media server outputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active tiles to calculate.</p>
        </CardContent>
      </Card>
    )
  }

  const calculateOutputs = (format: { width: number; height: number; }) => {
    const outputPixels = format.width * format.height;
    if (outputPixels === 0) return 'N/A';
    // If the total resolution is larger than the output, it takes at least one.
    // If it's smaller, it still takes one output.
    if (totalPixels > outputPixels) {
        return Math.ceil(totalPixels / outputPixels);
    }
    return 1;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="size-5" />
          <CardTitle>Output Calculator</CardTitle>
        </div>
        <CardDescription>
          Outputs required for an active resolution of <span className="font-mono">{totalPixelWidth}x{totalPixelHeight}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(VIDEO_FORMATS).map(([key, format]) => (
           <div key={key} className="flex items-center justify-between rounded-lg border p-3">
             <span className="text-sm font-medium">{format.label}</span>
             <span className="font-mono text-lg font-bold">{calculateOutputs(format)}</span>
           </div>
        ))}
      </CardContent>
    </Card>
  );
}
