"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";

const VIDEO_FORMATS = {
  HD: { width: 1920, height: 1080, label: "HD (1920x1080)" },
  "4K_UHD": { width: 3840, height: 2160, label: "4K UHD (3840x2160)" },
  "4K_DCI": { width: 4096, height: 2160, label: "4K DCI (4096x2160)" },
};

export function OutputCalculator() {
  const { dimensions, activeBounds } = usePixelMapper();
  
  const totalPixelWidth = activeBounds ? (activeBounds.maxX - activeBounds.minX + 1) * dimensions.tileWidth : 0;
  const totalPixelHeight = activeBounds ? (activeBounds.maxY - activeBounds.minY + 1) * dimensions.tileHeight : 0;
  
  if (totalPixelWidth * totalPixelHeight === 0) {
    return (
       <div>
          <p className="text-sm text-muted-foreground">No active tiles to calculate.</p>
        </div>
    )
  }

  const calculateOutputs = (format: { width: number; height: number; }) => {
    if (format.width === 0 || format.height === 0) return 0;
    
    const outputsWide = Math.ceil(totalPixelWidth / format.width);
    const outputsHigh = Math.ceil(totalPixelHeight / format.height);
    
    return outputsWide * outputsHigh;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Outputs required for an active resolution of <span className="font-mono">{totalPixelWidth}x{totalPixelHeight}</span>.
      </p>
      {Object.entries(VIDEO_FORMATS).map(([key, format]) => (
         <div key={key} className="flex items-center justify-between rounded-lg border p-3">
           <span className="text-sm font-medium">{format.label}</span>
           <span className="font-mono text-lg font-bold">{calculateOutputs(format)}</span>
         </div>
      ))}
    </div>
  );
}
