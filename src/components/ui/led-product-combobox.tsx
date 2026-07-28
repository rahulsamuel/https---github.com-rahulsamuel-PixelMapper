'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxProduct {
  id: string;
  manufacturer: string;
  productName: string;
}

interface Props {
  products: ComboboxProduct[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  includeCustom?: boolean;
  className?: string;
}

export function LedProductCombobox({
  products,
  value,
  onChange,
  placeholder = 'Search LED products…',
  includeCustom = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort manufacturers and products alphabetically
  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim();
    const map = new Map<string, ComboboxProduct[]>();

    const sorted = [...products].sort((a, b) =>
      a.manufacturer.localeCompare(b.manufacturer) ||
      a.productName.localeCompare(b.productName)
    );

    for (const p of sorted) {
      const matchesMfr = p.manufacturer.toLowerCase().includes(q);
      const matchesProduct = p.productName.toLowerCase().includes(q);
      if (!q || matchesMfr || matchesProduct) {
        if (!map.has(p.manufacturer)) map.set(p.manufacturer, []);
        map.get(p.manufacturer)!.push(p);
      }
    }

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products, query]);

  const selected = useMemo(() => {
    if (value === 'custom') return { id: 'custom', manufacturer: '', productName: 'Custom' };
    return products.find(p => p.id === value) ?? null;
  }, [products, value]);

  const displayLabel = selected
    ? selected.id === 'custom'
      ? 'Custom'
      : `${selected.manufacturer} — ${selected.productName}`
    : '';

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  const totalResults = grouped.reduce((s, [, items]) => s + items.length, 0) + (includeCustom && (!query || 'custom'.includes(query.toLowerCase())) ? 1 : 0);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm',
          'bg-background hover:bg-accent/40 transition-colors text-left',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          open && 'ring-2 ring-ring ring-offset-1'
        )}
      >
        <span className={cn('flex-1 truncate', !displayLabel && 'text-muted-foreground')}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-64 overflow-y-auto">
            {totalResults === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No products found.</p>
            )}

            {/* Custom option */}
            {includeCustom && (!query || 'custom'.includes(query.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelect('custom')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors',
                  value === 'custom' && 'bg-accent/60'
                )}
              >
                <span className="font-medium">Custom</span>
                {value === 'custom' && <Check className="w-4 h-4 text-primary" />}
              </button>
            )}

            {/* Grouped products */}
            {grouped.map(([mfr, items]) => (
              <div key={mfr}>
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40 sticky top-0">
                  {mfr}
                </div>
                {items.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
                      value === p.id && 'bg-accent/60'
                    )}
                  >
                    <span className="truncate">{p.productName}</span>
                    {value === p.id && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
