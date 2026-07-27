'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Pencil, Trash, Plus, Search, X, ChevronDown, ChevronRight,
  Layers, Zap, Ruler, Weight, Eye as EyeIcon, Cpu, Monitor,
  ShieldCheck, Sun, Box,
} from 'lucide-react';
import Link from 'next/link';
import type { LedProduct } from '@/services/supabase';
import { cn } from '@/lib/utils';

interface Props {
  products: LedProduct[];
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

function ProductDetailDialog({ product, open, onOpenChange }: { product: LedProduct | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {product.productImageUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border">
                <img src={product.productImageUrl} alt={product.productName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                <Monitor className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{product.productName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{product.manufacturer}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {product.pixelPitchMm && <Badge variant="secondary">{product.pixelPitchMm}mm pitch</Badge>}
                {product.applicationIndoor && <Badge variant="outline">Indoor</Badge>}
                {product.applicationOutdoor && <Badge variant="outline">Outdoor</Badge>}
                {product.applicationFloor && <Badge variant="outline">Floor</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <SpecGroup icon={Layers} title="Panel Resolution">
            <SpecRow label="Width" value={product.tileWidthPx} unit="px" />
            <SpecRow label="Height" value={product.tileHeightPx} unit="px" />
            <SpecRow label="Pixel Pitch" value={product.pixelPitchMm} unit="mm" />
          </SpecGroup>

          <SpecGroup icon={Ruler} title="Physical Dimensions">
            <SpecRow label="Width" value={product.tileWidthMm} unit="mm" />
            <SpecRow label="Height" value={product.tileHeightMm} unit="mm" />
            <SpecRow label="Depth" value={product.tileDepthMm} unit="mm" />
          </SpecGroup>

          <SpecGroup icon={Weight} title="Weight">
            <SpecRow label="Per Panel" value={product.tileWeightKg} unit="kg" />
          </SpecGroup>

          <SpecGroup icon={Zap} title="Power Consumption">
            <SpecRow label="Max per Tile" value={product.wattsPerTile > 0 ? product.wattsPerTile : null} unit="W" />
            <SpecRow label="Max per m²" value={product.maxPowerWPerSqm} unit="W/m²" />
            <SpecRow label="Avg per m²" value={product.avgPowerWPerSqm} unit="W/m²" />
          </SpecGroup>

          <SpecGroup icon={Sun} title="Display Performance">
            <SpecRow label="Brightness" value={product.maxBrightnessNit} unit="nit" />
            <SpecRow label="Refresh Rate" value={product.refreshRateHz} unit="Hz" />
            <SpecRow label="Grayscale" value={product.grayscaleBit} unit="bit" />
            <SpecRow label="Contrast Ratio" value={product.contrastRatio} />
          </SpecGroup>

          <SpecGroup icon={EyeIcon} title="Viewing & Color">
            <SpecRow label="Viewing Angle H" value={product.viewingAngleH} unit="°" />
            <SpecRow label="Viewing Angle V" value={product.viewingAngleV} unit="°" />
            <SpecRow label="Color Temperature" value={product.colorTemperatureK} unit="K" />
          </SpecGroup>

          <SpecGroup icon={Cpu} title="Technical">
            <SpecRow label="Drive Mode" value={product.driveMode} />
            <SpecRow label="LED Type" value={product.ledType} />
            <SpecRow label="IP Rating" value={product.ipRating} />
          </SpecGroup>

          <SpecGroup icon={ShieldCheck} title="Compliance">
            <SpecRow label="Certifications" value={product.certification} />
          </SpecGroup>
        </div>

        {product.specSheetUrl && (
          <div className="mt-3">
            <a href={product.specSheetUrl} target="_blank" rel="noopener noreferrer">
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

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({ product, onView, onDelete }: { product: LedProduct; onView: () => void; onDelete: () => void }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className="group rounded-lg border bg-card hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-stretch gap-3 p-3">
        {/* Thumbnail */}
        <button onClick={onView} className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border cursor-pointer hover:opacity-80 transition-opacity">
          {product.productImageUrl ? (
            <img src={product.productImageUrl} alt={product.productName} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button onClick={onView} className="text-sm font-semibold hover:text-primary transition-colors text-left truncate block">
                {product.productName}
              </button>
              <p className="text-xs text-muted-foreground truncate">{product.manufacturer}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/admin/products/${product.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Pencil className="w-3 h-3" />
                </Button>
              </Link>
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Trash className="w-3 h-3 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. <strong>{product.productName}</strong> will be permanently removed from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
            {product.pixelPitchMm && <span>{product.pixelPitchMm}mm</span>}
            <span className="tabular-nums">{product.tileWidthPx}×{product.tileHeightPx}px</span>
            {product.tileWidthMm && product.tileHeightMm && <span className="tabular-nums">{product.tileWidthMm}×{product.tileHeightMm}mm</span>}
            {product.wattsPerTile > 0 && <span className="tabular-nums">{product.wattsPerTile}W</span>}
            {product.maxBrightnessNit && <span>{product.maxBrightnessNit} nit</span>}
          </div>

          {/* Application badges */}
          <div className="flex gap-1 mt-1.5">
            {product.applicationIndoor && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Indoor</Badge>}
            {product.applicationOutdoor && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Outdoor</Badge>}
            {product.applicationFloor && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Floor</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LedProductAdmin({ products }: Props) {
  const [search, setSearch] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [viewProduct, setViewProduct] = useState<LedProduct | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<LedProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [productList, setProductList] = useState<LedProduct[]>(products);

  const manufacturers = useMemo(
    () => [...new Set(productList.map(p => p.manufacturer))].sort(),
    [productList]
  );

  const filtered = useMemo(() => {
    let result = productList;

    if (manufacturerFilter !== 'all') {
      result = result.filter(p => p.manufacturer === manufacturerFilter);
    }

    if (applicationFilter !== 'all') {
      result = result.filter(p => {
        if (applicationFilter === 'indoor') return p.applicationIndoor;
        if (applicationFilter === 'outdoor') return p.applicationOutdoor;
        if (applicationFilter === 'floor') return p.applicationFloor;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.manufacturer.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [productList, search, manufacturerFilter, applicationFilter]);

  // Group by manufacturer
  const grouped = useMemo(() => {
    const map = new Map<string, LedProduct[]>();
    for (const p of filtered) {
      if (!map.has(p.manufacturer)) map.set(p.manufacturer, []);
      map.get(p.manufacturer)!.push(p);
    }
    // Sort products within each group by name
    for (const [, list] of map) {
      list.sort((a, b) => a.productName.localeCompare(b.productName));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const hasActiveFilters = search !== '' || manufacturerFilter !== 'all' || applicationFilter !== 'all';

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const { deleteProduct } = await import('@/app/admin/products/actions');
    const result = await deleteProduct(deleteTarget.id, new FormData());
    if (result.success) {
      setProductList(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      setDeleteError(result.message);
    }
    setDeleting(false);
  }

  const clearFilters = () => {
    setSearch('');
    setManufacturerFilter('all');
    setApplicationFilter('all');
  };

  function toggleGroup(mfr: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(mfr)) next.delete(mfr);
      else next.add(mfr);
      return next;
    });
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LED Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View, edit, or delete LED panel products in your database.</p>
        </div>
        <Link href="/admin/add-led">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by manufacturer or product name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={applicationFilter} onValueChange={setApplicationFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Application" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="indoor">Indoor</SelectItem>
            <SelectItem value="outdoor">Outdoor</SelectItem>
            <SelectItem value="floor">Floor</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {productList.length} products across {grouped.length} manufacturer{grouped.length !== 1 ? 's' : ''}
      </div>

      {/* Grouped product list */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No products match your filters.</p>
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
                  {items.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onView={() => setViewProduct(product)}
                      onDelete={() => { setDeleteTarget(product); setDeleteError(null); }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ProductDetailDialog product={viewProduct} open={!!viewProduct} onOpenChange={v => { if (!v) setViewProduct(null); }} />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.productName}</strong> from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
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
