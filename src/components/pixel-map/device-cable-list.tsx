import type { DeviceRoute } from "@/lib/device-wiring-layout";

function CableGroup({ title, routes }: { title: string; routes: DeviceRoute[] }) {
  if (routes.length === 0) return null;
  const totalM = routes.reduce((sum, r) => sum + r.lengthM, 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">{title}</p>
        <p className="tabular-nums text-muted-foreground">{routes.length} cables · {totalM.toFixed(1)} m</p>
      </div>
      <ul className="divide-y rounded-md border">
        {routes.map(route => (
          <li key={route.key} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>{route.dataLabel} to {route.deviceLabel}, port {route.port}</span>
            <span className="tabular-nums">{route.lengthM.toFixed(1)} m</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeviceCableList({ routes }: { routes: DeviceRoute[] }) {
  if (routes.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a device and connect it to data labels to see cable lengths.</p>;
  }
  const totalM = routes.reduce((sum, r) => sum + r.lengthM, 0);
  return (
    <div className="space-y-4">
      <CableGroup title="Primary cables" routes={routes.filter(r => !r.isBackup)} />
      <CableGroup title="Backup cables" routes={routes.filter(r => r.isBackup)} />
      <p className="text-sm font-medium tabular-nums">Total: {totalM.toFixed(1)} m across {routes.length} cables</p>
    </div>
  );
}
