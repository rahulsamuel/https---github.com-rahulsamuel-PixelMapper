'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LedProduct } from '@/services/supabase';
import { cn } from '@/lib/utils';

export type ProductSpec = {
  manufacturer: string;
  productName: string;
  ownerLabel: string;
  pixelPitchMm: number | string | null;
  tileWidthMm: number | string | null;
  tileHeightMm: number | string | null;
  tileWidthPx: number | string | null;
  tileHeightPx: number | string | null;
  wattsPerTile: number | string | null;
  maxBrightnessNit: number | string | null;
  refreshRateHz: number | string | null;
  tileWeightKg: number | string | null;
};

export function specFromProduct(p: LedProduct): ProductSpec {
  return {
    manufacturer: p.manufacturer,
    productName: p.productName,
    ownerLabel: p.visibility === 'shared' ? 'Shared (everyone)' : `Private: ${p.ownerName ?? p.ownerEmail ?? 'unknown owner'}`,
    pixelPitchMm: p.pixelPitchMm,
    tileWidthMm: p.tileWidthMm,
    tileHeightMm: p.tileHeightMm,
    tileWidthPx: p.tileWidthPx,
    tileHeightPx: p.tileHeightPx,
    wattsPerTile: p.wattsPerTile,
    maxBrightnessNit: p.maxBrightnessNit,
    refreshRateHz: p.refreshRateHz,
    tileWeightKg: p.tileWeightKg,
  };
}

const ROWS: { label: string; key: keyof ProductSpec }[] = [
  { label: 'Manufacturer', key: 'manufacturer' },
  { label: 'Product name', key: 'productName' },
  { label: 'Owner / visibility', key: 'ownerLabel' },
  { label: 'Pixel pitch (mm)', key: 'pixelPitchMm' },
  { label: 'Panel width (mm)', key: 'tileWidthMm' },
  { label: 'Panel height (mm)', key: 'tileHeightMm' },
  { label: 'Resolution width (px)', key: 'tileWidthPx' },
  { label: 'Resolution height (px)', key: 'tileHeightPx' },
  { label: 'Max watts per panel', key: 'wattsPerTile' },
  { label: 'Brightness (nit)', key: 'maxBrightnessNit' },
  { label: 'Refresh rate (Hz)', key: 'refreshRateHz' },
  { label: 'Panel weight (kg)', key: 'tileWeightKg' },
];

function display(value: number | string | null): string {
  return value === null || value === '' || value === undefined ? '-' : String(value);
}

export function DuplicateCompareDialog({
  open,
  onOpenChange,
  incoming,
  existing,
  onAddAnyway,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incoming: ProductSpec;
  existing: ProductSpec[];
  onAddAnyway: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Similar product already exists</DialogTitle>
          <DialogDescription>
            Compare your new product with the existing entry. Highlighted values differ from your new product.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Field</TableHead>
                <TableHead>Your new product</TableHead>
                {existing.map((spec, i) => (
                  <TableHead key={i}>Existing entry{existing.length > 1 ? ` ${i + 1}` : ''}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map(({ label, key }) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
                  <TableCell>{display(incoming[key])}</TableCell>
                  {existing.map((spec, i) => {
                    const differs = display(spec[key]) !== display(incoming[key]);
                    return (
                      <TableCell key={i} className={cn(differs && 'bg-amber-500/10 font-medium text-amber-800 dark:text-amber-300')}>
                        {display(spec[key])}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onAddAnyway}>Add anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
