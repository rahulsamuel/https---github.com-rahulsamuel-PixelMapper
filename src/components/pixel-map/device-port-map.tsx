import { usePixelMap } from "@/contexts/pixel-map-context";
import { dataLabelFor } from "@/lib/device-wiring-layout";

export function DevicePortMap() {
  const { devices } = usePixelMap();

  if (devices.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a device in the Devices section to see its port connections.</p>;
  }

  return (
    <div className="space-y-3">
      {devices.map(device => (
        <div key={device.id} className="rounded-md border p-3 bg-muted/20">
          <p className="text-sm font-medium mb-2">{device.label}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
            {Array.from({ length: device.portCount }, (_, i) => i + 1).map(port => (
              <div key={port} className="rounded border bg-background px-2 py-1 text-xs tabular-nums text-foreground">
                Port {port} to {dataLabelFor(device, port)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
