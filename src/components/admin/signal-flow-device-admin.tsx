'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Cable, Search, X, ChevronDown, ChevronRight, Upload, Sparkles, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  CATEGORY_INFO,
  PRESET_CATEGORY_MAP,
  DEFAULT_CABLE_TYPES,
  CABLE_TYPE_NAMES,
  type DeviceType,
  type DeviceCategory,
  type DevicePreset,
  type PortDirection,
  type SignalFlowPort,
} from '@/lib/signal-flow-types';
import { useAuth } from '@/contexts/auth-context';

interface DBDevice {
  id: string;
  name: string;
  device_type: DeviceType;
  category: DeviceCategory;
  color: string;
  width: number;
  height: number;
  ports: Omit<SignalFlowPort, 'id'>[];
  is_active: boolean;
  sort_order: number;
}

interface DBCategory {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface DBCableType {
  id: string;
  slug: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
}

const DEVICE_TYPES: DeviceType[] = [
  'processor', 'led-screen', 'media-server', 'power-supply',
  'network-switch', 'matrix', 'distribution', 'converter', 'custom',
];

const CATEGORY_OPTIONS: DeviceCategory[] = [
  'processor', 'media-server', 'led-screen', 'converter', 'power', 'network', 'other',
];

const DEFAULT_PORTS: Omit<SignalFlowPort, 'id'>[] = [
  { label: 'IN', direction: 'input', portType: 'custom' },
  { label: 'OUT', direction: 'output', portType: 'custom' },
];

function dbToDevicePreset(d: DBDevice): DevicePreset {
  return {
    type: d.device_type,
    name: d.name,
    color: d.color,
    width: d.width,
    height: d.height,
    ports: d.ports,
  };
}

function DevicePreview({
  name,
  deviceType,
  color,
  width,
  height,
  ports,
  cableTypes,
}: {
  name: string;
  deviceType: DeviceType;
  color: string;
  width: number;
  height: number;
  ports: Omit<SignalFlowPort, 'id'>[];
  cableTypes: DBCableType[];
}) {
  const previewWidth = Math.max(80, Number(width) || 180);
  const previewHeight = Math.max(80, Number(height) || 120);
  const requiredHeight = 70 + ports.length * 22;
  const scale = Math.min(1, 280 / previewWidth, 150 / Math.max(previewHeight, requiredHeight));
  const inputs = ports.filter(port => port.direction === 'input');
  const outputs = ports.filter(port => port.direction === 'output');
  const getPortColor = (portType: string) => {
    const cable = cableTypes.find(ct => ct.slug === portType);
    if (cable) return cable.color;
    return DEFAULT_CABLE_TYPES.find(ct => ct.id === portType)?.color ?? '#64748b';
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-primary" />
        <div>
          <p className="text-xs font-semibold">Live Preview</p>
          <p className="text-[10px] text-muted-foreground">Updates as you edit the device</p>
        </div>
      </div>
      <div className="relative h-[190px] overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <div
          className="absolute left-1/2 top-1/2 rounded-lg border-2 border-white/20 shadow-lg"
          style={{
            width: previewWidth,
            height: Math.max(previewHeight, requiredHeight),
            backgroundColor: color || '#475569',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <div className="flex h-[34px] min-w-0 items-center gap-2 rounded-t-md border-b border-white/10 bg-black/20 px-2.5">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white" title={name || 'Unnamed device'}>{name || 'Unnamed device'}</span>
            <span className="max-w-[52px] truncate text-[9px] uppercase tracking-wider text-white/55" title={deviceType}>{deviceType}</span>
          </div>
          {inputs.map((port, index) => (
            <div key={`input-${index}`} className="absolute left-[-5px] flex items-center" style={{ top: 70 + index * 22 }}>
              <span className="ml-2 block w-[68px] truncate text-[10px] leading-4 text-white/80" title={port.label}>{port.label}</span>
              <span className="absolute left-0 h-2.5 w-2.5 rounded-full border-2 border-white/60" style={{ backgroundColor: getPortColor(port.portType) }} />
            </div>
          ))}
          {outputs.map((port, index) => (
            <div key={`output-${index}`} className="absolute right-[-5px] flex items-center justify-end" style={{ top: 70 + index * 22 }}>
              <span className="mr-2 block w-[68px] truncate text-right text-[10px] leading-4 text-white/80" title={port.label}>{port.label}</span>
              <span className="absolute right-0 h-2.5 w-2.5 rounded-full border-2 border-white/60" style={{ backgroundColor: getPortColor(port.portType) }} />
            </div>
          ))}
        </div>
      </div>
      {Number(height) < requiredHeight && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Recommended height: {requiredHeight}px for {ports.length} ports.
        </p>
      )}
    </div>
  );
}

function DeviceForm({
  initial,
  onClose,
  deviceId,
  cableTypes,
}: {
  initial: Partial<DBDevice> | null;
  onClose: () => void;
  deviceId?: string;
  cableTypes: DBCableType[];
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [deviceType, setDeviceType] = useState<DeviceType>(initial?.device_type ?? 'custom');
  const [category, setCategory] = useState<DeviceCategory>(initial?.category ?? 'other');
  const [color, setColor] = useState(initial?.color ?? '#475569');
  const [width, setWidth] = useState(initial?.width ?? 180);
  const [height, setHeight] = useState(initial?.height ?? 120);
  const [ports, setPorts] = useState<Omit<SignalFlowPort, 'id'>[]>(initial?.ports ?? DEFAULT_PORTS);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setCategory(PRESET_CATEGORY_MAP[deviceType] ?? 'other');
    }
  }, [deviceType]);

  const addPort = () => {
    setPorts(prev => [...prev, { label: `PORT ${prev.length + 1}`, direction: 'output', portType: 'custom' }]);
  };

  const removePort = (i: number) => setPorts(prev => prev.filter((_, idx) => idx !== i));

  const updatePort = (i: number, field: keyof Omit<SignalFlowPort, 'id'>, value: string) => {
    setPorts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Device name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        device_type: deviceType,
        category,
        color,
        width,
        height,
        ports,
        is_active: isActive,
      };
      if (deviceId) {
        const { error: err } = await supabase.from('signal_flow_devices').update(payload).eq('id', deviceId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('signal_flow_devices').insert(payload);
        if (err) throw err;
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save device');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <ScrollArea className="h-[55vh] pr-4">
          <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Device Name<span className="text-destructive ml-0.5">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Brompton SX40" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Device Type</Label>
              <Select value={deviceType} onValueChange={(v) => setDeviceType(v as DeviceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as DeviceCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_INFO[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" className="h-8 w-12 rounded border cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
                <span className="text-xs font-mono text-muted-foreground">{color}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Width (px)</Label>
              <Input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Height (px)</Label>
              <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ports</Label>
              <button type="button" className="text-xs text-primary hover:underline" onClick={addPort}>+ Add Port</button>
            </div>
            <div className="space-y-1.5">
              {ports.map((port, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    className="flex-1 min-w-0 text-xs"
                    placeholder="Port label"
                    value={port.label}
                    onChange={e => updatePort(i, 'label', e.target.value)}
                  />
                  <Select value={port.direction} onValueChange={(v) => updatePort(i, 'direction', v as PortDirection)}>
                    <SelectTrigger className="w-[80px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="input">IN</SelectItem>
                      <SelectItem value="output">OUT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={port.portType} onValueChange={(v) => updatePort(i, 'portType', v)}>
                    <SelectTrigger className="w-[110px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cableTypes.length > 0
                        ? cableTypes.map(ct => (
                          <SelectItem key={ct.id} value={ct.slug}>{ct.name}</SelectItem>
                        ))
                        : DEFAULT_CABLE_TYPES.map(ct => (
                          <SelectItem key={ct.id} value={ct.id}>{CABLE_TYPE_NAMES[ct.id] ?? ct.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <button type="button" className="text-muted-foreground hover:text-destructive px-1" onClick={() => removePort(i)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="text-xs">Active (visible in signal flow sidebar)</Label>
          </div>

          </div>
        </ScrollArea>

        <div className="self-start md:sticky md:top-0">
          <DevicePreview
            key={`${name}|${deviceType}|${color}|${width}|${height}|${ports.map(port => `${port.label}:${port.direction}:${port.portType}`).join('|')}`}
            name={name}
            deviceType={deviceType}
            color={color}
            width={width}
            height={height}
            ports={ports}
            cableTypes={cableTypes}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {deviceId ? 'Save Changes' : 'Add Device'}
        </Button>
      </div>
    </div>
  );
}

function DeviceCard({
  device,
  onEdit,
  onDelete,
}: {
  device: DBDevice;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-lg border bg-card hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-stretch gap-3 p-3">
        <div className="w-12 h-12 rounded-md shrink-0 border flex items-center justify-center" style={{ backgroundColor: device.color }}>
          <Cable className="w-5 h-5 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm font-semibold truncate block">{device.name}</span>
              <p className="text-xs text-muted-foreground truncate">{device.device_type} · {device.ports.length} ports</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="flex gap-1 mt-1.5">
            <Badge variant={device.is_active ? 'default' : 'secondary'} className="text-[9px] py-0 px-1.5">
              {device.is_active ? 'Active' : 'Hidden'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignalFlowDeviceAdmin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<DBDevice[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [cableTypes, setCableTypes] = useState<DBCableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DBDevice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DBDevice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCableDialog, setShowCableDialog] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [prefilledDevice, setPrefilledDevice] = useState<Partial<DBDevice> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: devs, error: devErr } = await supabase
        .from('signal_flow_devices')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      const { data: cats, error: catErr } = await supabase
        .from('signal_flow_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      const { data: cables, error: cableErr } = await supabase
        .from('signal_flow_cable_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (devErr || catErr || cableErr) {
        setLoading(false);
        return;
      }
      setDevices((devs as DBDevice[]) ?? []);
      setCategories((cats as DBCategory[]) ?? []);
      setCableTypes((cables as DBCableType[]) ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) loadData();
  }, [authLoading, isAdmin, loadData]);

  const toggleGroup = (cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filtered = devices.filter(d => {
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      if (!d.name.toLowerCase().includes(q) && !d.device_type.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, DBDevice[]>>((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort();

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('signal_flow_devices').delete().eq('id', deleteTarget.id);
      if (!error) {
        setDevices(prev => prev.filter(d => d.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddCategory(name: string, color: string) {
    try {
      const { error } = await supabase.from('signal_flow_categories').insert({
        name: name.trim(),
        color,
        sort_order: categories.length,
      });
      if (!error) {
        setShowCategoryDialog(false);
        loadData();
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteCategory(cat: DBCategory) {
    try {
      await supabase.from('signal_flow_categories').delete().eq('id', cat.id);
      loadData();
    } catch {
      // ignore
    }
  }

  async function handleAddCableType(slug: string, name: string, color: string) {
    try {
      const { error } = await supabase.from('signal_flow_cable_types').insert({
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        color,
        sort_order: cableTypes.length,
        is_system: false,
      });
      if (!error) {
        setShowCableDialog(false);
        loadData();
      }
    } catch {
      // ignore
    }
  }

  async function handleToggleCableType(ct: DBCableType) {
    try {
      await supabase.from('signal_flow_cable_types')
        .update({ is_active: !ct.is_active })
        .eq('id', ct.id);
      loadData();
    } catch {
      // ignore
    }
  }

  async function handleDeleteCableType(ct: DBCableType) {
    if (ct.is_system) return;
    try {
      await supabase.from('signal_flow_cable_types').delete().eq('id', ct.id);
      loadData();
    } catch {
      // ignore
    }
  }

  async function handleUpdateCableColor(ct: DBCableType, color: string) {
    try {
      await supabase.from('signal_flow_cable_types')
        .update({ color })
        .eq('id', ct.id);
      loadData();
    } catch {
      // ignore
    }
  }

  async function handleImageUpload(file: File) {
    setParsing(true);
    setParseError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${supabaseUrl}/functions/v1/parse-signal-flow-device`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'Apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.device) {
        throw new Error('No device data returned from AI.');
      }
      const d = data.device;
      setPrefilledDevice({
        name: d.name ?? '',
        device_type: d.deviceType ?? 'custom',
        category: d.category ?? 'other',
        color: d.color ?? '#475569',
        width: d.width ?? 200,
        height: d.height ?? 120,
        ports: Array.isArray(d.ports) ? d.ports : [],
        is_active: true,
      });
      setEditing(null);
      setDialogOpen(true);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse image');
    } finally {
      setParsing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold">Admin Access Required</p>
          <p className="text-sm mt-1">You need admin privileges to manage signal flow devices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Signal Flow Device Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage devices, converters, and categories available in the Signal Flow tool.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
              e.target.value = '';
            }}
          />
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Image
          </Button>
          <Button onClick={() => { setEditing(null); setPrefilledDevice(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Device
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search devices…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_INFO[c].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {parseError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {parseError}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {devices.length} devices
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Cable className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No devices match your filters.</p>
        </div>
      )}

      <div className="space-y-3">
        {groupKeys.map(cat => {
          const items = grouped[cat];
          const info = CATEGORY_INFO[cat as DeviceCategory] ?? { label: cat, color: '#475569' };
          const isCollapsed = collapsed.has(cat);
          return (
            <div key={cat} className="rounded-xl border bg-card/50 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(cat)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                <div className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: info.color }} />
                <h3 className="text-sm font-semibold flex-1 text-left">{info.label}</h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 pt-1">
                  {items.map(d => (
                    <DeviceCard
                      key={d.id}
                      device={d}
                      onEdit={() => { setEditing(d); setDialogOpen(true); }}
                      onDelete={() => setDeleteTarget(d)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom categories list */}
      {categories.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Custom Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                <span className="text-sm">{cat.name}</span>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteCategory(cat)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cable Types section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Cable Types</h2>
            <p className="text-xs text-muted-foreground">Manage cable/connector types available in Signal Flow ports and cables.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCableDialog(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Cable Type
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {cableTypes.map(ct => (
            <div key={ct.id} className="rounded-lg border bg-card p-3 flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <input
                  type="color"
                  className="h-7 w-10 rounded border cursor-pointer"
                  value={ct.color}
                  onChange={e => handleUpdateCableColor(ct, e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold block truncate">{ct.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{ct.slug}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {ct.is_system && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Standard</Badge>}
                  <Badge variant={ct.is_active ? 'default' : 'secondary'} className="text-[9px] py-0 px-1.5">
                    {ct.is_active ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleToggleCableType(ct)}
                  title={ct.is_active ? 'Hide' : 'Show'}
                >
                  {ct.is_active ? 'Hide' : 'Show'}
                </button>
                {!ct.is_system && (
                  <button
                    className="text-xs text-destructive hover:text-destructive/80"
                    onClick={() => handleDeleteCableType(ct)}
                    title="Delete"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); setEditing(null); setPrefilledDevice(null); loadData(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.name}` : prefilledDevice ? 'Review AI-Extracted Device' : 'Add New Device'}</DialogTitle>
            {prefilledDevice && !editing && (
              <div className="flex items-center gap-2 mt-1 rounded-md bg-primary/10 border border-primary/20 px-3 py-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">AI extracted the device details from your image. Review and adjust before saving.</p>
              </div>
            )}
          </DialogHeader>
          <DeviceForm
            initial={editing ?? prefilledDevice}
            deviceId={editing?.id}
            cableTypes={cableTypes}
            onClose={() => { setDialogOpen(false); setEditing(null); setPrefilledDevice(null); loadData(); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from the library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryDialog
        open={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        onCreate={handleAddCategory}
      />

      <CableTypeDialog
        open={showCableDialog}
        onClose={() => setShowCableDialog(false)}
        onCreate={handleAddCableType}
        existingSlugs={cableTypes.map(c => c.slug)}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#475569');

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setName(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Category Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Accessories" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2 items-center">
              <input type="color" className="h-8 w-12 rounded border cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
              <span className="text-xs font-mono text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => { setName(''); onClose(); }}>Cancel</Button>
          <Button onClick={() => onCreate(name, color)} disabled={!name.trim()}>
            Add Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CableTypeDialog({
  open,
  onClose,
  onCreate,
  existingSlugs,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (slug: string, name: string, color: string) => void;
  existingSlugs: string[];
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const slugConflict = existingSlugs.includes(slug);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setName(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Cable Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cable Name<span className="text-destructive ml-0.5">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DisplayPort" autoFocus />
            {name.trim() && (
              <p className="text-[10px] text-muted-foreground font-mono">
                ID: {slug}{slugConflict && <span className="text-destructive"> (already exists)</span>}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2 items-center">
              <input type="color" className="h-8 w-12 rounded border cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
              <span className="text-xs font-mono text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => { setName(''); onClose(); }}>Cancel</Button>
          <Button onClick={() => onCreate(slug, name, color)} disabled={!name.trim() || slugConflict}>Add Cable Type</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
