'use client';

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { addProductAction, type FormState } from '@/app/add-led/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import {
  Upload, Link2, Sparkles, AlertCircle, ChevronRight,
  FileText, Image as ImageIcon, X, Check, RotateCcw,
  Cpu, Zap, Eye, Layers, Weight, Ruler, Lock,
  CheckSquare, Square, Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type ParsedProduct = {
  manufacturer: string | null;
  productName: string | null;
  pixelPitchMm: number | null;
  tileWidthMm: number | null;
  tileHeightMm: number | null;
  tileDepthMm: number | null;
  tileWidthPx: number | null;
  tileHeightPx: number | null;
  tileWeightKg: number | null;
  maxPowerWPerSqm: number | null;
  avgPowerWPerSqm: number | null;
  maxBrightnessNit: number | null;
  refreshRateHz: number | null;
  grayscaleBit: number | null;
  contrastRatio: string | null;
  colorTemperatureK: number | null;
  viewingAngleH: number | null;
  viewingAngleV: number | null;
  driveMode: string | null;
  ledType: string | null;
  ipRating: string | null;
  certification: string | null;
  applicationIndoor: boolean;
  applicationOutdoor: boolean;
  applicationFloor: boolean;
  productImageUrl: string | null;
};

type WizardStep = 'input' | 'select' | 'review';

// ─── Form schema ─────────────────────────────────────────────────────────────

const formSchema = z.object({
  manufacturer: z.string().min(2, 'At least 2 characters'),
  productName: z.string().min(2, 'At least 2 characters'),
  tileWidthPx: z.coerce.number().min(1, 'Must be ≥ 1'),
  tileHeightPx: z.coerce.number().min(1, 'Must be ≥ 1'),
  tileWidthMm: z.coerce.number().min(1).optional().or(z.literal('')),
  tileHeightMm: z.coerce.number().min(1).optional().or(z.literal('')),
  tileDepthMm: z.coerce.number().positive().optional().or(z.literal('')),
  tileWeightKg: z.coerce.number().positive().optional().or(z.literal('')),
  maxPowerConsumption: z.coerce.number().min(0, 'Must be ≥ 0'),
  avgPowerConsumption: z.coerce.number().min(0).optional().or(z.literal('')),
  maxPowerWPerSqm: z.coerce.number().positive().optional().or(z.literal('')),
  avgPowerWPerSqm: z.coerce.number().positive().optional().or(z.literal('')),
  pixelPitchMm: z.coerce.number().positive().optional().or(z.literal('')),
  maxBrightness: z.coerce.number().positive().optional().or(z.literal('')),
  refreshRate: z.coerce.number().positive().optional().or(z.literal('')),
  grayscaleBit: z.coerce.number().positive().optional().or(z.literal('')),
  contrastRatio: z.string().optional(),
  colorTemperatureK: z.coerce.number().positive().optional().or(z.literal('')),
  viewingAngleH: z.coerce.number().positive().optional().or(z.literal('')),
  viewingAngleV: z.coerce.number().positive().optional().or(z.literal('')),
  driveMode: z.string().optional(),
  ledType: z.string().optional(),
  ipRating: z.string().optional(),
  certification: z.string().optional(),
  applicationIndoor: z.boolean().default(false),
  applicationOutdoor: z.boolean().default(false),
  applicationFloor: z.boolean().default(false),
  productImageUrl: z.string().optional(),
  specSheetUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const initialState: FormState = { message: '', success: false };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcWattsPerTile(wPerSqm: number | null, wMm: number | null, hMm: number | null): number {
  if (!wPerSqm || !wMm || !hMm) return 0;
  return Math.round(wPerSqm * ((wMm * hMm) / 1_000_000) * 10) / 10;
}

function toDefaults(p: ParsedProduct): Partial<FormData> {
  return {
    manufacturer: p.manufacturer ?? '',
    productName: p.productName ?? '',
    tileWidthPx: p.tileWidthPx ?? 128,
    tileHeightPx: p.tileHeightPx ?? 128,
    tileWidthMm: p.tileWidthMm ?? undefined,
    tileHeightMm: p.tileHeightMm ?? undefined,
    tileDepthMm: p.tileDepthMm ?? undefined,
    tileWeightKg: p.tileWeightKg ?? undefined,
    maxPowerConsumption: calcWattsPerTile(p.maxPowerWPerSqm, p.tileWidthMm, p.tileHeightMm) || (p.maxPowerWPerSqm ?? 0),
    avgPowerConsumption: calcWattsPerTile(p.avgPowerWPerSqm, p.tileWidthMm, p.tileHeightMm) || undefined,
    maxPowerWPerSqm: p.maxPowerWPerSqm ?? undefined,
    avgPowerWPerSqm: p.avgPowerWPerSqm ?? undefined,
    pixelPitchMm: p.pixelPitchMm ?? undefined,
    maxBrightness: p.maxBrightnessNit ?? undefined,
    refreshRate: p.refreshRateHz ?? undefined,
    grayscaleBit: p.grayscaleBit ?? undefined,
    contrastRatio: p.contrastRatio ?? '',
    colorTemperatureK: p.colorTemperatureK ?? undefined,
    viewingAngleH: p.viewingAngleH ?? undefined,
    viewingAngleV: p.viewingAngleV ?? undefined,
    driveMode: p.driveMode ?? '',
    ledType: p.ledType ?? '',
    ipRating: p.ipRating ?? '',
    certification: p.certification ?? '',
    applicationIndoor: p.applicationIndoor ?? false,
    applicationOutdoor: p.applicationOutdoor ?? false,
    applicationFloor: p.applicationFloor ?? false,
    productImageUrl: p.productImageUrl ?? '',
    specSheetUrl: '',
  };
}

function buildFormData(d: Partial<FormData>, source: string): globalThis.FormData {
  const fd = new globalThis.FormData();
  const append = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
  };
  append('manufacturer', d.manufacturer);
  append('productName', d.productName);
  append('tileWidthPx', d.tileWidthPx);
  append('tileHeightPx', d.tileHeightPx);
  append('maxPowerConsumption', d.maxPowerConsumption);
  append('tileWidthMm', d.tileWidthMm);
  append('tileHeightMm', d.tileHeightMm);
  append('tileDepthMm', d.tileDepthMm);
  append('tileWeightKg', d.tileWeightKg);
  append('avgPowerConsumption', d.avgPowerConsumption);
  append('maxPowerWPerSqm', d.maxPowerWPerSqm);
  append('avgPowerWPerSqm', d.avgPowerWPerSqm);
  append('pixelPitchMm', d.pixelPitchMm);
  append('maxBrightness', d.maxBrightness);
  append('refreshRate', d.refreshRate);
  append('grayscaleBit', d.grayscaleBit);
  append('contrastRatio', d.contrastRatio);
  append('colorTemperatureK', d.colorTemperatureK);
  append('viewingAngleH', d.viewingAngleH);
  append('viewingAngleV', d.viewingAngleV);
  append('driveMode', d.driveMode);
  append('ledType', d.ledType);
  append('ipRating', d.ipRating);
  append('certification', d.certification);
  fd.append('applicationIndoor', String(d.applicationIndoor ?? false));
  fd.append('applicationOutdoor', String(d.applicationOutdoor ?? false));
  fd.append('applicationFloor', String(d.applicationFloor ?? false));
  append('productImageUrl', d.productImageUrl);
  append('specSheetUrl', source);
  return fd;
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} size="lg">
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          Saving to Database...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4" />Confirm &amp; Save to Database
        </span>
      )}
    </Button>
  );
}

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FGrid({ cols = 2, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  return (
    <div className={cn('grid gap-3',
      cols === 2 && 'grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'grid-cols-1 sm:grid-cols-3',
      cols === 4 && 'grid-cols-2 sm:grid-cols-4',
    )}>{children}</div>
  );
}

// ─── Input step ───────────────────────────────────────────────────────────────

function InputStep({ onParsed }: { onParsed: (products: ParsedProduct[], source: string) => void }) {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  function handleFile(f: File) {
    const ok = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp'].includes(f.type);
    if (!ok) { setError('Only PDF, JPG, PNG, or WEBP files are accepted.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError(''); setFile(f);
  }

  async function parse() {
    setError(''); setLoading(true);
    try {
      let res: Response;
      if (mode === 'file' && file) {
        const fd = new globalThis.FormData(); fd.append('file', file);
        res = await fetch(`${SUPABASE_URL}/functions/v1/parse-led-spec`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ANON_KEY}` },
          body: fd,
        });
      } else if (mode === 'url' && url.trim()) {
        res = await fetch(`${SUPABASE_URL}/functions/v1/parse-led-spec`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else {
        setError(mode === 'file' ? 'Please select a file first.' : 'Please enter a URL first.');
        setLoading(false); return;
      }

      const json = await res.json();
      if (!res.ok || json.error) {
        const msg: string = json.error || `Request failed (${res.status})`;
        if (msg.includes('GOOGLE_AI_API_KEY')) {
          setError('AI parsing requires a Google AI key. Get one free at aistudio.google.com, then add it as GOOGLE_AI_API_KEY in your Supabase Edge Function secrets.');
        } else {
          setError(msg);
        }
        return;
      }

      const products: ParsedProduct[] = json.products ?? [];
      if (products.length === 0) {
        setError('No LED products detected. Try a different file or URL.'); return;
      }
      toast({ title: `Found ${products.length} product${products.length > 1 ? 's' : ''}!`, description: 'Review the extracted data before saving.' });
      onParsed(products, mode === 'url' ? url.trim() : file?.name ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex rounded-lg border overflow-hidden">
        {(['file', 'url'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); setError(''); setFile(null); setUrl(''); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {m === 'file' ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {m === 'file' ? 'Upload Spec Sheet' : 'Website URL'}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200',
            dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30',
            file && 'border-green-500/60 bg-green-500/5'
          )}
        >
          <input ref={fileRef} type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {file ? (
            <>
              <div className="p-3 rounded-full bg-green-500/10">
                {file.type === 'application/pdf' ? <FileText className="w-8 h-8 text-green-600" /> : <ImageIcon className="w-8 h-8 text-green-600" />}
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-muted"><Upload className="w-8 h-8 text-muted-foreground" /></div>
              <div>
                <p className="font-medium">Drop spec sheet here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG, WEBP — up to 20 MB</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Manufacturer product page URL</label>
          <Input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://www.manufacturer.com/products/series"
            onKeyDown={e => e.key === 'Enter' && parse()} />
          <p className="text-xs text-muted-foreground">
            AI scrapes the page text, extracts all product specs, and saves product images to storage automatically.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      <Button type="button" onClick={parse}
        disabled={loading || (mode === 'file' ? !file : !url.trim())}
        className="w-full" size="lg">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Analyzing with AI...
          </span>
        ) : (
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Parse with AI</span>
        )}
      </Button>
    </div>
  );
}

// ─── Select step (multi-select) ───────────────────────────────────────────────

function SelectStep({ products, onSelect, onBack, onBulkSave }: {
  products: ParsedProduct[];
  onSelect: (p: ParsedProduct) => void;
  onBack: () => void;
  onBulkSave: (selected: ParsedProduct[]) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const allSelected = selected.size === products.length;

  function toggleProduct(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((_, i) => i)));
  }

  async function handleBulkSave() {
    if (selected.size === 0) return;
    setSaving(true);
    onBulkSave(products.filter((_, i) => selected.has(i)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Multiple Products Found</h3>
          <p className="text-sm text-muted-foreground">Select products to add, or click a card to review individually.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Back
        </Button>
      </div>

      {/* Select all toggle */}
      <button
        type="button"
        onClick={toggleAll}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {allSelected
          ? <CheckSquare className="w-4 h-4 text-primary" />
          : <Square className="w-4 h-4" />
        }
        {allSelected ? 'Deselect all' : 'Select all'}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p, i) => {
          const isSelected = selected.has(i);
          return (
            <Card
              key={i}
              className={cn(
                'cursor-pointer transition-all group relative',
                isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/60 hover:shadow-md'
              )}
              onClick={() => toggleProduct(i)}
            >
              {/* Checkbox indicator */}
              <div className={cn(
                'absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background'
              )}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>

              <CardContent className="p-4 space-y-3 pr-10">
                {p.productImageUrl && (
                  <div className="w-full h-28 rounded-md overflow-hidden bg-muted">
                    <img src={p.productImageUrl} alt={p.productName ?? 'Product'}
                      className="w-full h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{p.manufacturer}</p>
                    <p className="font-semibold">{p.productName}</p>
                  </div>
                  {p.pixelPitchMm && <Badge variant="secondary">{p.pixelPitchMm}mm</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {p.tileWidthMm && p.tileHeightMm && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.tileWidthMm}×{p.tileHeightMm}mm</span>}
                  {p.tileWidthPx && p.tileHeightPx && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{p.tileWidthPx}×{p.tileHeightPx}px</span>}
                  {p.maxBrightnessNit && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.maxBrightnessNit} nit</span>}
                  {p.maxPowerWPerSqm && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{p.maxPowerWPerSqm} W/m²</span>}
                  {p.tileWeightKg && <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{p.tileWeightKg} kg</span>}
                  {p.refreshRateHz && <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{p.refreshRateHz} Hz</span>}
                </div>
                {/* Review individually link */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  onClick={e => { e.stopPropagation(); onSelect(p); }}
                >
                  Review &amp; edit individually <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bulk save footer */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 pt-4 pb-1">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={handleBulkSave}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Add {selected.size} product{selected.size > 1 ? 's' : ''} to Database
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LedProductForm() {
  const [state, formAction] = useActionState(addProductAction, initialState);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState<WizardStep>('input');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [specSource, setSpecSource] = useState('');
  const [previewImg, setPreviewImg] = useState('');
  const [aiPopulated, setAiPopulated] = useState(false);

  // Non-admins skip straight to manual review
  const effectiveStep: WizardStep = !isAdmin && step === 'input' ? 'review' : step;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      manufacturer: '', productName: '',
      tileWidthPx: 128, tileHeightPx: 128,
      maxPowerConsumption: 0,
      applicationIndoor: false, applicationOutdoor: false, applicationFloor: false,
    },
  });

  const imgUrl = form.watch('productImageUrl');
  useEffect(() => {
    if (imgUrl && imgUrl.startsWith('http')) setPreviewImg(imgUrl);
  }, [imgUrl]);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast({ title: 'Product Added!', description: state.message });
      form.reset(); setStep('input'); setParsedProducts([]); setPreviewImg(''); setAiPopulated(false);
    } else if (state.errors) {
      toast({ title: 'Validation Error', description: state.message, variant: 'destructive' });
      for (const err of state.errors) {
        form.setError(err.path[0] as keyof FormData, { type: 'manual', message: err.message });
      }
    } else {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleParsed = useCallback((products: ParsedProduct[], source: string) => {
    setParsedProducts(products); setSpecSource(source); setAiPopulated(true);
    if (products.length === 1) apply(products[0], source);
    else setStep('select');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function apply(p: ParsedProduct, src?: string) {
    form.reset(toDefaults(p) as FormData);
    if (p.productImageUrl) setPreviewImg(p.productImageUrl);
    if (src) form.setValue('specSheetUrl', src);
    setStep('review');
  }

  async function handleBulkSave(selected: ParsedProduct[]) {
    let saved = 0;
    let failed = 0;
    for (const p of selected) {
      const defaults = toDefaults(p);
      const fd = buildFormData(defaults, specSource);
      const result = await addProductAction(initialState, fd);
      if (result.success) saved++;
      else failed++;
    }
    if (saved > 0) {
      toast({
        title: `${saved} product${saved > 1 ? 's' : ''} added!`,
        description: failed > 0 ? `${failed} failed to save.` : 'All products saved to the database.',
      });
    }
    if (failed > 0 && saved === 0) {
      toast({ title: 'Save failed', description: 'Could not save any products. Please try again.', variant: 'destructive' });
    }
    setStep('input');
    setParsedProducts([]);
    setSpecSource('');
    setAiPopulated(false);
  }

  // Helper renderers
  const N = (name: keyof FormData, label: string, unit?: string, ph?: string) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs">{label}{unit && <span className="ml-1 font-normal text-muted-foreground">({unit})</span>}</FormLabel>
        <FormControl>
          <Input type="number" step="any" placeholder={ph}
            {...field} value={field.value === undefined || field.value === null ? '' : String(field.value)}
            onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  const T = (name: keyof FormData, label: string, ph?: string) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs">{label}</FormLabel>
        <FormControl><Input placeholder={ph} {...field} value={field.value as string ?? ''} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb — only for admins using AI flow */}
      {isAdmin && effectiveStep !== 'input' && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button type="button" onClick={() => setStep('input')} className="hover:text-foreground transition-colors">Upload / URL</button>
          <ChevronRight className="w-3 h-3" />
          {effectiveStep === 'select' && <span className="text-foreground font-medium">Select Variant</span>}
          {effectiveStep === 'review' && (
            <>
              {parsedProducts.length > 1 && (
                <>
                  <button type="button" onClick={() => setStep('select')} className="hover:text-foreground transition-colors">Select Variant</button>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-foreground font-medium">Review &amp; Save</span>
            </>
          )}
        </nav>
      )}

      {/* ── Input step (admins only) ── */}
      {effectiveStep === 'input' && (
        <>
          <InputStep onParsed={handleParsed} />
          <Separator />
          <Button type="button" variant="outline" className="w-full"
            onClick={() => { form.reset({ manufacturer:'',productName:'',tileWidthPx:128,tileHeightPx:128,maxPowerConsumption:0,applicationIndoor:false,applicationOutdoor:false,applicationFloor:false }); setAiPopulated(false); setPreviewImg(''); setStep('review'); }}>
            Fill Out Manually
          </Button>
        </>
      )}

      {/* Non-admin notice on manual form */}
      {!isAdmin && effectiveStep === 'review' && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>AI spec parsing is available to admins only. Fill out the form manually below.</span>
        </div>
      )}

      {/* ── Select step ── */}
      {effectiveStep === 'select' && (
        <SelectStep
          products={parsedProducts}
          onSelect={p => apply(p, specSource)}
          onBack={() => setStep('input')}
          onBulkSave={handleBulkSave}
        />
      )}

      {/* ── Review step ── */}
      {effectiveStep === 'review' && (
        <Form {...form}>
          <form ref={formRef} action={formAction} className="space-y-6">
            <input type="hidden" name="applicationIndoor" value={String(form.watch('applicationIndoor'))} />
            <input type="hidden" name="applicationOutdoor" value={String(form.watch('applicationOutdoor'))} />
            <input type="hidden" name="applicationFloor" value={String(form.watch('applicationFloor'))} />
            <input type="hidden" name="productImageUrl" value={form.watch('productImageUrl') ?? ''} />
            <input type="hidden" name="specSheetUrl" value={form.watch('specSheetUrl') ?? ''} />

            {aiPopulated && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Fields pre-filled by AI from <span className="font-medium">{specSource}</span>. Review all values carefully before saving.</span>
                <button type="button" className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => { setStep('input'); setAiPopulated(false); }}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {previewImg && (
              <div className="flex items-center gap-4 rounded-lg border p-3 bg-muted/30">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  <img src={previewImg} alt="Product" className="w-full h-full object-contain"
                    onError={() => setPreviewImg('')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Product Image</p>
                  <p className="text-xs truncate mt-0.5 text-muted-foreground">{previewImg}</p>
                </div>
                <button type="button" onClick={() => { setPreviewImg(''); form.setValue('productImageUrl', ''); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Section icon={Layers} title="Basic Information">
              <FGrid cols={2}>
                {T('manufacturer', 'Manufacturer *', 'e.g. Absen, ROE Visual')}
                {T('productName', 'Product Name *', 'e.g. SA1.9, Black Pearl 2.8')}
              </FGrid>
              <FGrid cols={2}>
                {N('pixelPitchMm', 'Pixel Pitch', 'mm', '2.6')}
                {T('ledType', 'LED Type', 'e.g. Black SMD1515')}
              </FGrid>
            </Section>

            <Separator />

            <Section icon={Ruler} title="Panel Dimensions" description="Physical size and pixel resolution of one panel.">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Physical Size</p>
              <FGrid cols={3}>
                {N('tileWidthMm', 'Width', 'mm', '500')}
                {N('tileHeightMm', 'Height', 'mm', '500')}
                {N('tileDepthMm', 'Depth', 'mm', '70')}
              </FGrid>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2">Pixel Resolution</p>
              <FGrid cols={2}>
                {N('tileWidthPx', 'Width *', 'px', '256')}
                {N('tileHeightPx', 'Height *', 'px', '256')}
              </FGrid>
            </Section>

            <Separator />

            <Section icon={Weight} title="Weight">
              <div className="max-w-xs">
                {N('tileWeightKg', 'Weight per Panel', 'kg', '9.5')}
              </div>
            </Section>

            <Separator />

            <Section icon={Zap} title="Power Consumption" description="W/m² from spec sheet; watts per tile used in the calculator.">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per Square Meter (spec sheet)</p>
              <FGrid cols={2}>
                {N('maxPowerWPerSqm', 'Max Power', 'W/m²', '440')}
                {N('avgPowerWPerSqm', 'Avg Power', 'W/m²', '146')}
              </FGrid>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2">Per Tile (used by calculator)</p>
              <FGrid cols={2}>
                {N('maxPowerConsumption', 'Max Watts *', 'W', '27.5')}
                {N('avgPowerConsumption', 'Avg Watts', 'W', '9.1')}
              </FGrid>
            </Section>

            <Separator />

            <Section icon={Eye} title="Display Performance">
              <FGrid cols={3}>
                {N('maxBrightness', 'Brightness', 'nit', '1500')}
                {N('refreshRate', 'Refresh Rate', 'Hz', '7680')}
                {N('grayscaleBit', 'Grayscale', 'bit', '16')}
              </FGrid>
              <FGrid cols={3}>
                {T('contrastRatio', 'Contrast Ratio', '5500:1')}
                {N('colorTemperatureK', 'Color Temp', 'K', '6500')}
                {T('driveMode', 'Drive Mode', '1/16')}
              </FGrid>
              <FGrid cols={2}>
                {N('viewingAngleH', 'Viewing Angle H', '°', '160')}
                {N('viewingAngleV', 'Viewing Angle V', '°', '160')}
              </FGrid>
            </Section>

            <Separator />

            <Section icon={Cpu} title="Technical &amp; Compliance">
              <FGrid cols={2}>
                {T('ipRating', 'IP Rating', 'IP40/IP21')}
                {T('certification', 'Certifications', 'FCC, ETL, CE, RoHS')}
              </FGrid>
            </Section>

            <Separator />

            <Section icon={Sparkles} title="Application Type" description="Select all that apply.">
              <div className="flex flex-wrap gap-3">
                {(['applicationIndoor','applicationOutdoor','applicationFloor'] as const).map(name => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem className="flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <FormControl>
                        <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="cursor-pointer font-normal capitalize">
                        {name.replace('application', '')}
                      </FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
            </Section>

            <Separator />

            <Section icon={ImageIcon} title="Product Image">
              {T('productImageUrl', 'Image URL', 'https://...')}
            </Section>

            <SubmitButton />
          </form>
        </Form>
      )}
    </div>
  );
}
