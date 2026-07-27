'use client';

import { useState, useActionState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Plus, Pencil, Trash2, Sparkles, Link2, Upload, Loader2, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { addProcessorAction, updateProcessorAction, deleteProcessorAction } from '@/app/admin/processors/actions';
import type { ProcessorFormState } from '@/app/admin/processors/actions';
import type { Processor } from '@/services/supabase';
import { supabase } from '@/lib/supabase/client';

interface Props {
  processors: Processor[];
}

const EMPTY: Partial<Processor> = {
  manufacturer: '', modelName: '',
  totalPixelCapacity: 0, outputPortCount: 1, pixelsPerPort: 0, baseRefreshRateHz: 60,
  maxInputResolutionW: undefined, maxInputResolutionH: undefined, inputTypes: '',
  rackUnits: 2, weightKg: undefined, powerWatts: undefined, powerInput: '',
  depthMm: undefined, widthMm: undefined, heightMm: undefined,
  distributionPerPort: 1, distributionUnitName: '',
  notes: '', specSheetUrl: '', productImageUrl: '', isActive: true,
};

type ParsedProduct = Record<string, unknown>;

function ProcessorForm({
  initial,
  onClose,
  processorId,
}: {
  initial: Partial<Processor>;
  onClose: () => void;
  processorId?: string;
}) {
  const [vals, setVals] = useState<Partial<Processor>>(initial);
  const [parseUrl, setParseUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedOptions, setParsedOptions] = useState<ParsedProduct[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const action = processorId
    ? updateProcessorAction.bind(null, processorId)
    : addProcessorAction;

  const initState: ProcessorFormState = { message: '', success: false };
  const [state, formAction, pending] = useActionState(action, initState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const set = (k: keyof Processor, v: unknown) => setVals(p => ({ ...p, [k]: v }));

  const autoCalcPixelsPerPort = () => {
    const total = Number(vals.totalPixelCapacity) || 0;
    const ports = Number(vals.outputPortCount) || 1;
    set('pixelsPerPort', Math.round(total / ports));
  };

  async function parseFromUrl() {
    if (!parseUrl) return;
    setParsing(true);
    setParseError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/parse-processor-spec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'Apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: JSON.stringify({ url: parseUrl }),
      });
      const json = await res.json();
      if (json.error) { setParseError(json.error); return; }
      if (json.products?.length) setParsedOptions(json.products);
      else setParseError('No processor data found at that URL.');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse');
    } finally {
      setParsing(false);
    }
  }

  async function parseFromFile(file: File) {
    setParsing(true);
    setParseError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${supabaseUrl}/functions/v1/parse-processor-spec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'Apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: fd,
      });
      const json = await res.json();
      if (json.error) { setParseError(json.error); return; }
      if (json.products?.length) setParsedOptions(json.products);
      else setParseError('No processor data found in that file.');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse');
    } finally {
      setParsing(false);
    }
  }

  function applyParsed(p: ParsedProduct) {
    const n = (v: unknown) => (v != null && v !== '' ? Number(v) : undefined);
    const s = (v: unknown) => (v != null && v !== '' ? String(v) : '');
    setVals(prev => ({
      ...prev,
      manufacturer: s(p.manufacturer) || prev.manufacturer,
      modelName: s(p.modelName) || prev.modelName,
      totalPixelCapacity: n(p.totalPixelCapacity) ?? prev.totalPixelCapacity,
      outputPortCount: n(p.outputPortCount) ?? prev.outputPortCount,
      pixelsPerPort: n(p.pixelsPerPort) ?? prev.pixelsPerPort,
      baseRefreshRateHz: n(p.baseRefreshRateHz) ?? prev.baseRefreshRateHz,
      maxInputResolutionW: n(p.maxInputResolutionW),
      maxInputResolutionH: n(p.maxInputResolutionH),
      inputTypes: s(p.inputTypes) || prev.inputTypes,
      rackUnits: n(p.rackUnits) ?? prev.rackUnits,
      weightKg: n(p.weightKg),
      powerWatts: n(p.powerWatts),
      powerInput: s(p.powerInput) || prev.powerInput,
      depthMm: n(p.depthMm),
      widthMm: n(p.widthMm),
      heightMm: n(p.heightMm),
      distributionPerPort: n(p.distributionPerPort) ?? prev.distributionPerPort,
      distributionUnitName: s(p.distributionUnitName) || prev.distributionUnitName,
      notes: s(p.notes) || prev.notes,
    }));
    setParsedOptions([]);
  }

  const numInput = (label: string, k: keyof Processor, required = false) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Input
        name={k}
        type="number"
        value={(vals[k] as number | undefined) ?? ''}
        onChange={e => set(k, e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </div>
  );

  const textInput = (label: string, k: keyof Processor, required = false) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Input
        name={k}
        value={(vals[k] as string | undefined) ?? ''}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <form action={formAction}>
      {/* AI Parse panel */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
          onClick={() => setShowAiPanel(p => !p)}
        >
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> AI Auto-Fill from PDF / URL / Image</span>
          {showAiPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showAiPanel && (
          <div className="p-4 space-y-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Paste spec sheet URL…"
                value={parseUrl}
                onChange={e => setParseUrl(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={parseFromUrl} disabled={parsing || !parseUrl}>
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                <span className="ml-1.5">Parse URL</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) parseFromFile(f); }} />
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={parsing}>
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="ml-1.5">Upload PDF or Image</span>
              </Button>
            </div>
            {parseError && <p className="text-xs text-destructive">{parseError}</p>}
            {parsedOptions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Select a result to apply:</p>
                {parsedOptions.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left text-xs border rounded p-2 hover:bg-accent transition-colors"
                    onClick={() => applyParsed(p)}
                  >
                    <span className="font-semibold">{String(p.manufacturer ?? '')} {String(p.modelName ?? '')}</span>
                    <span className="text-muted-foreground ml-2">{p.totalPixelCapacity ? `${Number(p.totalPixelCapacity).toLocaleString()}px` : ''} · {p.outputPortCount ? `${p.outputPortCount} ports` : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="h-[55vh] pr-4">
        <div className="space-y-5">
          {/* Identity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              {textInput('Manufacturer', 'manufacturer', true)}
              {textInput('Model Name', 'modelName', true)}
            </div>
          </div>

          <Separator />

          {/* Pixel Capacity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pixel Capacity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Pixel Capacity<span className="text-destructive ml-0.5">*</span></Label>
                <Input
                  name="totalPixelCapacity"
                  type="number"
                  value={(vals.totalPixelCapacity as number | undefined) ?? ''}
                  onChange={e => set('totalPixelCapacity', Number(e.target.value))}
                  onBlur={autoCalcPixelsPerPort}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Output Port Count<span className="text-destructive ml-0.5">*</span></Label>
                <Input
                  name="outputPortCount"
                  type="number"
                  value={(vals.outputPortCount as number | undefined) ?? ''}
                  onChange={e => set('outputPortCount', Number(e.target.value))}
                  onBlur={autoCalcPixelsPerPort}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Pixels per Port<span className="text-destructive ml-0.5">*</span></Label>
                  <button type="button" onClick={autoCalcPixelsPerPort} className="text-[10px] text-primary hover:underline">Auto-calculate</button>
                </div>
                <Input
                  name="pixelsPerPort"
                  type="number"
                  value={(vals.pixelsPerPort as number | undefined) ?? ''}
                  onChange={e => set('pixelsPerPort', Number(e.target.value))}
                />
              </div>
              {numInput('Base Refresh Rate (Hz)', 'baseRefreshRateHz')}
            </div>
          </div>

          <Separator />

          {/* Port Distribution */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Port Distribution</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Distribution per Port</Label>
                <Input
                  name="distributionPerPort"
                  type="number"
                  min={1}
                  value={(vals.distributionPerPort as number | undefined) ?? 1}
                  onChange={e => set('distributionPerPort', Math.max(1, Number(e.target.value)))}
                />
                <p className="text-[10px] text-muted-foreground">How many 1G sub-ports each output port splits into (e.g. 10 for XD box). Use 1 if no distribution unit.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Distribution Unit Name</Label>
                <Input
                  name="distributionUnitName"
                  placeholder="e.g. Tessera XD"
                  value={(vals.distributionUnitName as string | undefined) ?? ''}
                  onChange={e => set('distributionUnitName', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Name of the fiber/distribution box used to split each port.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Input Specs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Input Specs</p>
            <div className="grid grid-cols-2 gap-3">
              {numInput('Max Input Width (px)', 'maxInputResolutionW')}
              {numInput('Max Input Height (px)', 'maxInputResolutionH')}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Input Types</Label>
                <Input
                  name="inputTypes"
                  placeholder="e.g. HDMI 2.0, 12G-SDI, DP 1.2"
                  value={(vals.inputTypes as string | undefined) ?? ''}
                  onChange={e => set('inputTypes', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Physical */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Physical</p>
            <div className="grid grid-cols-3 gap-3">
              {numInput('Rack Units', 'rackUnits')}
              {numInput('Weight (kg)', 'weightKg')}
              {numInput('Power (W)', 'powerWatts')}
              {textInput('Power Input', 'powerInput')}
              {numInput('Depth (mm)', 'depthMm')}
              {numInput('Width (mm)', 'widthMm')}
              <div className="space-y-1.5">
                <Label className="text-xs">Height (mm)</Label>
                <Input
                  name="heightMm"
                  type="number"
                  value={(vals.heightMm as number | undefined) ?? ''}
                  onChange={e => set('heightMm', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Extras */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Extras</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  name="notes"
                  rows={2}
                  value={(vals.notes as string | undefined) ?? ''}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>
              {textInput('Spec Sheet URL', 'specSheetUrl')}
              {textInput('Product Image URL', 'productImageUrl')}
              <div className="flex items-center gap-3">
                <Switch
                  id="isActive"
                  checked={vals.isActive ?? true}
                  onCheckedChange={v => set('isActive', v)}
                />
                <input type="hidden" name="isActive" value={String(vals.isActive ?? true)} />
                <Label htmlFor="isActive" className="text-xs">Active (visible in Power & Data)</Label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {state.message && !state.success && (
        <p className="text-sm text-destructive mt-3">{state.message}</p>
      )}

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {processorId ? 'Save Changes' : 'Add Processor'}
        </Button>
      </div>
    </form>
  );
}

export function ProcessorAdmin({ processors: initial }: Props) {
  const [processors, setProcessors] = useState<Processor[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Processor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Processor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'manufacturer' | 'modelName' | 'totalPixelCapacity' | 'outputPortCount'>('manufacturer');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  const manufacturers = useMemo(
    () => [...new Set(processors.map(p => p.manufacturer))].sort(),
    [processors]
  );

  const filtered = useMemo(() => {
    let result = processors;
    if (manufacturerFilter !== 'all') result = result.filter(p => p.manufacturer === manufacturerFilter);
    if (statusFilter !== 'all') result = result.filter(p => statusFilter === 'active' ? p.isActive : !p.isActive);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.manufacturer.toLowerCase().includes(q) ||
        p.modelName.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'manufacturer') cmp = a.manufacturer.localeCompare(b.manufacturer);
      else if (sortKey === 'modelName') cmp = a.modelName.localeCompare(b.modelName);
      else if (sortKey === 'totalPixelCapacity') cmp = a.totalPixelCapacity - b.totalPixelCapacity;
      else if (sortKey === 'outputPortCount') cmp = a.outputPortCount - b.outputPortCount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [processors, search, manufacturerFilter, statusFilter, sortKey, sortDir]);

  const hasActiveFilters = search !== '' || manufacturerFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => { setSearch(''); setManufacturerFilter('all'); setStatusFilter('all'); };
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: Processor) => { setEditing(p); setDialogOpen(true); };
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  }, [router]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteProcessorAction(deleteTarget.id);
    if (result.success) {
      setProcessors(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      setDeleteError(result.message);
    }
    setDeleting(false);
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processor Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage LED video processors used in Power & Data calculations.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Processor
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by manufacturer or model name…"
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
        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {processors.length} processors
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5 cursor-pointer select-none hover:bg-muted/70" onClick={() => toggleSort('manufacturer')}>Manufacturer {sortKey === 'manufacturer' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left font-semibold px-4 py-2.5 cursor-pointer select-none hover:bg-muted/70" onClick={() => toggleSort('modelName')}>Model {sortKey === 'modelName' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-right font-semibold px-4 py-2.5 cursor-pointer select-none hover:bg-muted/70" onClick={() => toggleSort('totalPixelCapacity')}>Total Pixels {sortKey === 'totalPixelCapacity' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-right font-semibold px-4 py-2.5 cursor-pointer select-none hover:bg-muted/70" onClick={() => toggleSort('outputPortCount')}>Ports {sortKey === 'outputPortCount' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-right font-semibold px-4 py-2.5">px / Port</th>
              <th className="text-right font-semibold px-4 py-2.5">Distribution</th>
              <th className="text-center font-semibold px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No processors match your filters.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{p.manufacturer}</td>
                <td className="px-4 py-3">{p.modelName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.totalPixelCapacity.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.outputPortCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.pixelsPerPort.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {p.distributionPerPort > 1 ? (
                    <span className="text-xs">×{p.distributionPerPort} {p.distributionUnitName ? `(${p.distributionUnitName})` : ''}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(p); setDeleteError(null); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.manufacturer} ${editing.modelName}` : 'Add New Processor'}</DialogTitle>
          </DialogHeader>
          <ProcessorForm
            initial={editing ?? EMPTY}
            processorId={editing?.id}
            onClose={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Processor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.manufacturer} {deleteTarget?.modelName}</strong> from the library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
