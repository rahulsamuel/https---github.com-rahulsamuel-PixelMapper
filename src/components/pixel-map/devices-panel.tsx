import { useRef, useState, type ChangeEvent } from "react";
import { Plus, Trash, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePixelMap } from "@/contexts/pixel-map-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { BUILT_IN_DEVICE_IMAGES } from "@/lib/device-wiring-layout";

export const DEVICE_MODELS = [
  { value: "XD Box", defaultPorts: 10 },
  { value: "Helios Switch", defaultPorts: 12 },
  { value: "CVT4K", defaultPorts: 16 },
  { value: "CVT10", defaultPorts: 10 },
  { value: "CVT10 Pro", defaultPorts: 10 },
] as const;

function DevicePictureRow({ model }: { model: string }) {
  const { deviceModelImages, uploadDeviceModelImage } = usePixelMap();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const pictureSrc = deviceModelImages[model] ?? BUILT_IN_DEVICE_IMAGES[model];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadDeviceModelImage(model, file);
      toast({ title: "Picture saved", description: `The ${model} picture has been updated.` });
    } catch {
      toast({ title: "Upload failed", description: "The picture could not be saved. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border p-2 bg-muted/20">
      {pictureSrc ? (
        <img src={pictureSrc} alt={`${model} picture`} className="h-10 w-28 shrink-0 rounded-sm border object-cover" />
      ) : (
        <div className="flex h-10 w-28 shrink-0 items-center justify-center rounded-sm border bg-muted text-xs text-muted-foreground">
          No picture
        </div>
      )}
      <p className="flex-grow min-w-0 text-sm text-muted-foreground">Picture for {model}</p>
      {isAdmin && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 size-4" />
            {uploading ? "Uploading..." : pictureSrc ? "Replace" : "Upload"}
          </Button>
        </>
      )}
    </div>
  );
}

export function DevicesPanel() {
  const { devices, addScreenDevice, updateScreenDevice, removeScreenDevice } = usePixelMap();
  const [model, setModel] = useState<string>(DEVICE_MODELS[0].value);

  const selectedModel = DEVICE_MODELS.find(m => m.value === model) ?? DEVICE_MODELS[0];

  const handleAdd = () => {
    const sameModel = devices.filter(d => d.model === model).length;
    addScreenDevice({
      model,
      label: `${model} ${sameModel + 1}`,
      portCount: selectedModel.defaultPorts,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Device type</Label>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="flex-grow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.value} ({m.defaultPorts} ports)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>
        <DevicePictureRow model={model} />
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No devices on this screen yet. Add the fiber box that sits behind this screen.
        </p>
      ) : (
        <div className="space-y-2">
          {devices.map(device => (
            <div key={device.id} className="flex items-center gap-2 rounded-md border p-2 bg-muted/20">
              <Input
                value={device.label}
                onChange={(e) => updateScreenDevice(device.id, { label: e.target.value })}
                className="h-8 flex-grow min-w-0"
                aria-label="Device name"
              />
              <Select
                value={device.role ?? "primary"}
                onValueChange={(v) => updateScreenDevice(device.id, { role: v as "primary" | "backup" })}
              >
                <SelectTrigger className="h-8 w-28 shrink-0" aria-label="Device role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={device.portCount}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (n >= 1) updateScreenDevice(device.id, { portCount: n });
                }}
                className="h-8 w-20 shrink-0"
                aria-label="Port count"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                onClick={() => removeScreenDevice(device.id)}
                aria-label="Remove device"
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
