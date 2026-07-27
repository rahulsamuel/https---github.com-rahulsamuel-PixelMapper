'use client';

import { useState, useActionState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  Plus, Pencil, Trash2, Sparkles, Link2, Upload, Loader2, ChevronDown, ChevronUp, ChevronRight,
  Search, X, Eye, Cpu, Monitor, Layers, Zap, Ruler, Weight, ShieldCheck, Gauge, ArrowLeftRight, Box,
} from 'lucide-react';
import { addProcessorAction, updateProcessorAction, deleteProcessorAction } from '@/app/admin/processors/actions';
import type { ProcessorFormState } from '@/app/admin/processors/actions';
import type { Processor } from '@/services/supabase';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              {textInput('Manufacturer', 'manufacturer', true)}
              {textInput('Model Name', 'modelName', true)}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pixel Capacity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Pixel Capacity<span className="text-destructive ml-0.5">*</span></Label>
                <Input name="totalPixelCapacity" type="number" value={(vals.totalPixelCapacity as number | undefined) ?? ''} onChange={e => set('totalPixelCapacity', Number(e.target.value))} onBlur={autoCalcPixelsPerPort} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Output Port Count<span className="text-destructive ml-0.5">*</span></Label>
                <Input name="outputPortCount" type="number" value={(vals.outputPortCount as number | undefined) ?? ''} onChange={e => set('outputPortCount', Number(e.target.value))} onBlur={autoCalcPixelsPerPort} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Pixels per Port<span className="text-destructive ml-0.5">*</span></Label>
                  <button type="button" onClick={autoCalcPixelsPerPort} className="text-[10px] text-primary hover:underline">Auto-calculate</button>
                </div>
                <Input name="pixelsPerPort" type="number" value={(vals.pixelsPerPort as number | undefined) ?? ''} onChange={e => set('pixelsPerPort', Number(e.target.value))} />
              </div>
              {numInput('Base Refresh Rate (Hz)', 'baseRefreshRateHz')}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Port Distribution</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Distribution per Port</Label>
                <Input name="distributionPerPort" type="number" min={1} value={(vals.distributionPerPort as number | undefined) ?? 1} onChange={e => set('distributionPerPort', Math.max(1, Number(e.target.value)))} />
                <p className="text-[10px] text-muted-foreground">How many 1G sub-ports each output port splits into (e.g. 10 for XD box). Use 1 if no distribution unit.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Distribution Unit Name</Label>
                <Input name="distributionUnitName" placeholder="e.g. Tessera XD" value={(vals.distributionUnitName as string | undefined) ?? ''} onChange={e => set('distributionUnitName', e.target.value)} />
                <p className="text-[10px] text-muted-foreground">Name of the fiber/distribution box used to split each port.</p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Input Specs</p>
            <div className="grid grid-cols-2 gap-3">
              {numInput('Max Input Width (px)', 'maxInputResolutionW')}
              {numInput('Max Input Height (px)', 'maxInputResolutionH')}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Input Types</Label>
                <Input name="inputTypes" placeholder="e.g. HDMI 2.0, 12G-SDI, DP 1.2" value={(vals.inputTypes as string | undefined) ?? ''} onChange={e => set('inputTypes', e.target.value)} />
              </div>
            </div>
          </div>
          <Separator />
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
                <Input name="heightMm" type="number" value={(vals.heightMm as number | undefined) ?? ''} onChange={e => set('heightMm', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Extras</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea name="notes" rows={2} value={(vals.notes as string | undefined) ?? ''} onChange={e => set('notes', e.target.value)} />
              </div>
              {textInput('Spec Sheet URL', 'specSheetUrl')}
              {textInput('Product Image URL', 'productImageUrl')}
              <div className="flex items-center gap-3">
                <Switch id="isActive" checked={vals.isActive ?? true} onCheckedChange={v => set('isActive', v)} />
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

// ─── Detail View ────────────────────────────────────────────────────────────

function SpecRow({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  const display = value == null || value === '' || value === 0 ? '—' : `${value}${unit ? ` ${unit}` : ''}`;
  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums text-right">{display}</span>
    </div>
  );
}

function SpecGroup({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function ProcessorDetailDialog({ processor, open, onOpenChange }: { processor: Processor | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!processor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {processor.productImageUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border">
                <img src={processor.productImageUrl} alt={processor.modelName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                <Cpu className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{processor.modelName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{processor.manufacturer}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={processor.isActive ? 'default' : 'secondary'}>
                  {processor.isActive ? 'Active' : 'Hidden'}
                </Badge>
                <Badge variant="outline">{processor.rackUnits}U</Badge>
                {processor.distributionPerPort > 1 && processor.distributionUnitName && (
                  <Badge variant="outline">{processor.distributionUnitName}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <SpecGroup icon={Layers} title="Pixel Capacity">
            <SpecRow label="Total Capacity" value={processor.totalPixelCapacity.toLocaleString()} unit="px" />
            <SpecRow label="Output Ports" value={processor.outputPortCount} />
            <SpecRow label="Pixels per Port" value={processor.pixelsPerPort.toLocaleString()} unit="px" />
            <SpecRow label="Base Refresh Rate" value={processor.baseRefreshRateHz} unit="Hz" />
          </SpecGroup>

          <SpecGroup icon={ArrowLeftRight} title="Port Distribution">
            <SpecRow label="Distribution per Port" value={processor.distributionPerPort > 1 ? `×${processor.distributionPerPort}` : 'None'} />
            <SpecRow label="Distribution Unit" value={processor.distributionUnitName} />
          </SpecGroup>

          <SpecGroup icon={Monitor} title="Input">
            <SpecRow label="Max Input Width" value={processor.maxInputResolutionW} unit="px" />
            <SpecRow label="Max Input Height" value={processor.maxInputResolutionH} unit="px" />
            <SpecRow label="Input Types" value={processor.inputTypes} />
          </SpecGroup>

          <SpecGroup icon={Ruler} title="Physical">
            <SpecRow label="Rack Units" value={`${processor.rackUnits}U`} />
            <SpecRow label="Width" value={processor.widthMm} unit="mm" />
            <SpecRow label="Height" value={processor.heightMm} unit="mm" />
            <SpecRow label="Depth" value={processor.depthMm} unit="mm" />
            <SpecRow label="Weight" value={processor.weightKg} unit="kg" />
          </SpecGroup>

          <SpecGroup icon={Zap} title="Power">
            <SpecRow label="Power Consumption" value={processor.powerWatts} unit="W" />
            <SpecRow label="Power Input" value={processor.powerInput} />
          </SpecGroup>

          {processor.notes && (
            <SpecGroup icon={ShieldCheck} title="Notes">
              <div className="px-3 py-2">
                <p className="text-xs text-foreground whitespace-pre-wrap">{processor.notes}</p>
              </div>
            </SpecGroup>
          )}
        </div>

        {processor.specSheetUrl && (
          <div className="mt-3">
            <a href={processor.specSheetUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Box className="w-4 h-4 mr-2" />View Spec Sheet
              </Button>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Processor Card ───────────────────────────────────────────────────────────

function ProcessorCard({ processor, onView, onEdit, onDelete }: { processor: Processor; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group rounded-lg border bg-card hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-stretch gap-3 p-3">
        <button onClick={onView} className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center">
          {processor.productImageUrl ? (
            <img src={processor.productImageUrl} alt={processor.modelName} className="w-full h-full object-contain" />
          ) : (
            <Cpu className="w-6 h-6 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button onClick={onView} className="text-sm font-semibold hover:text-primary transition-colors text-left truncate block">
                {processor.modelName}
              </button>
              <p className="text-xs text-muted-foreground truncate">{processor.manufacturer}</p>
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

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{processor.totalPixelCapacity.toLocaleString()}px</span>
            <span>{processor.outputPortCount} ports</span>
            <span className="tabular-nums">{processor.pixelsPerPort.toLocaleString()}px/port</span>
            <span>{processor.rackUnits}U</span>
            {processor.distributionPerPort > 1 && <span>×{processor.distributionPerPort} dist</span>}
          </div>

          <div className="flex gap-1 mt-1.5">
            <Badge variant={processor.isActive ? 'default' : 'secondary'} className="text-[9px] py-0 px-1.5">
              {processor.isActive ? 'Active' : 'Hidden'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [viewProcessor, setViewProcessor] = useState<Processor | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
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
    return result;
  }, [processors, search, manufacturerFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Processor[]>();
    for (const p of filtered) {
      if (!map.has(p.manufacturer)) map.set(p.manufacturer, []);
      map.get(p.manufacturer)!.push(p);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.modelName.localeCompare(b.modelName));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const hasActiveFilters = search !== '' || manufacturerFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => { setSearch(''); setManufacturerFilter('all'); setStatusFilter('all'); };

  function toggleGroup(mfr: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(mfr)) next.delete(mfr);
      else next.add(mfr);
      return next;
    });
  }

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
    <div className="container mx-auto max-w-6xl p-6 space-y-4">
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
        Showing {filtered.length} of {processors.length} processors across {grouped.length} manufacturer{grouped.length !== 1 ? 's' : ''}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No processors match your filters.</p>
        </div>
      )}

      <div className="space-y-3">
        {grouped.map(([mfr, items]) => {
          const isCollapsed = collapsed.has(mfr);
          return (
            <div key={mfr} className="rounded-xl border bg-card/50 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(mfr)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-semibold flex-1 text-left">{mfr}</h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 pt-1">
                  {items.map(p => (
                    <ProcessorCard
                      key={p.id}
                      processor={p}
                      onView={() => setViewProcessor(p)}
                      onEdit={() => openEdit(p)}
                      onDelete={() => { setDeleteTarget(p); setDeleteError(null); }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ProcessorDetailDialog processor={viewProcessor} open={!!viewProcessor} onOpenChange={v => { if (!v) setViewProcessor(null); }} />

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
