'use client';

import { useState, useMemo, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Pencil, Trash, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import type { LedProduct } from '@/services/supabase';
import { deleteProduct as deleteProductAction } from '@/app/admin/products/actions';

interface Props {
  products: LedProduct[];
}

export function LedProductAdmin({ products }: Props) {
  const [search, setSearch] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'manufacturer' | 'productName' | 'wattsPerTile' | 'pixelPitchMm'>('manufacturer');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const manufacturers = useMemo(
    () => [...new Set(products.map(p => p.manufacturer))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let result = products;

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

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'manufacturer') cmp = a.manufacturer.localeCompare(b.manufacturer);
      else if (sortKey === 'productName') cmp = a.productName.localeCompare(b.productName);
      else if (sortKey === 'wattsPerTile') cmp = (a.wattsPerTile ?? 0) - (b.wattsPerTile ?? 0);
      else if (sortKey === 'pixelPitchMm') cmp = (a.pixelPitchMm ?? 0) - (b.pixelPitchMm ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, search, manufacturerFilter, applicationFilter, sortKey, sortDir]);

  const hasActiveFilters = search !== '' || manufacturerFilter !== 'all' || applicationFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setManufacturerFilter('all');
    setApplicationFilter('all');
  };

  const DeleteButton = ({ productId }: { productId: string }) => {
    const [open, setOpen] = useState(false);
    const action = deleteProductAction.bind(null, productId);
    const [state, formAction, pending] = useActionState(action, { success: false, message: '' });

    useEffect(() => {
      if (state.success) window.location.reload();
      else if (state.message) setOpen(false);
    }, [state]);

    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Trash className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.message && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={formAction}>
              <AlertDialogAction type="submit" disabled={pending}>
                {pending ? 'Deleting…' : 'Delete'}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

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
        Showing {filtered.length} of {products.length} products
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('manufacturer')}>
                Manufacturer {sortKey === 'manufacturer' && (sortDir === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('productName')}>
                Product {sortKey === 'productName' && (sortDir === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('pixelPitchMm')}>
                Pitch {sortKey === 'pixelPitchMm' && (sortDir === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Resolution (px)</TableHead>
              <TableHead>Size (mm)</TableHead>
              <TableHead className="cursor-pointer select-none hover:bg-muted/50 text-right" onClick={() => toggleSort('wattsPerTile')}>
                W/tile {sortKey === 'wattsPerTile' && (sortDir === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Applications</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(product => (
              <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{product.manufacturer}</TableCell>
                <TableCell>{product.productName}</TableCell>
                <TableCell className="tabular-nums">{product.pixelPitchMm ? `${product.pixelPitchMm}mm` : '—'}</TableCell>
                <TableCell className="tabular-nums">{product.tileWidthPx}×{product.tileHeightPx}</TableCell>
                <TableCell className="tabular-nums">{product.tileWidthMm ?? '—'}×{product.tileHeightMm ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{product.wattsPerTile > 0 ? `${product.wattsPerTile}W` : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {product.applicationIndoor && <Badge variant="secondary" className="text-[10px]">Indoor</Badge>}
                    {product.applicationOutdoor && <Badge variant="secondary" className="text-[10px]">Outdoor</Badge>}
                    {product.applicationFloor && <Badge variant="secondary" className="text-[10px]">Floor</Badge>}
                    {!product.applicationIndoor && !product.applicationOutdoor && !product.applicationFloor && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
    </Link>
                    <DeleteButton productId={product.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
