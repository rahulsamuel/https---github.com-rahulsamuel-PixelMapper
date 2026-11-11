'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePixelMap } from '@/contexts/pixel-map-context';
import type { WiringGroup } from '@/contexts/pixel-map-types';
import { getGroupCircuitCount } from '@/lib/wiring-groups';
import { WiringGroupForm, type WiringGroupFormValues } from './wiring-group-form';
import { Layers, Pencil, Trash2 } from 'lucide-react';

type FormState = { mode: 'create' } | { mode: 'edit'; group: WiringGroup } | null;

export function WiringGroupPanel({ kind }: { kind: 'data' | 'power' }) {
  const { currentScreen, selectedTileIds, addWiringGroup, updateWiringGroup, deleteWiringGroup } = usePixelMap();
  const [form, setForm] = useState<FormState>(null);

  const { screenWidth } = currentScreen.dimensions;
  const selectedSet = useMemo(() => new Set(selectedTileIds), [selectedTileIds]);
  const selectedCoords = useMemo(
    () => currentScreen.tiles.flatMap((tile, index) =>
      !tile.deleted && selectedSet.has(tile.id)
        ? [{ x: index % screenWidth, y: Math.floor(index / screenWidth) }]
        : []
    ),
    [currentScreen.tiles, selectedSet, screenWidth]
  );
  const groups = currentScreen.wiringGroups.filter(group => group.kind === kind);
  const kindLabel = kind === 'data' ? 'Data' : 'Power';

  const handleSubmit = (values: WiringGroupFormValues) => {
    if (form?.mode === 'edit') {
      updateWiringGroup(form.group.id, values);
    } else {
      addWiringGroup({ ...values, kind, tileCoords: selectedCoords });
    }
    setForm(null);
  };

  const handleDelete = (group: WiringGroup) => {
    if (window.confirm(`Delete "${group.name}"? Its circuits will be removed.`)) {
      deleteWiringGroup(group.id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium"><Layers className="size-4" /> {kindLabel} Groups</span>
        <span className="text-xs text-muted-foreground">{selectedCoords.length} tile{selectedCoords.length === 1 ? '' : 's'} selected</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={selectedCoords.length === 0}
        onClick={() => setForm({ mode: 'create' })}
      >
        New Group From Selection
      </Button>
      {selectedCoords.length === 0 && (
        <p className="text-xs text-muted-foreground">Select tiles on the screen to make a group.</p>
      )}
      {groups.length > 0 && (
        <ul className="space-y-2">
          {groups.map(group => {
            const circuits = getGroupCircuitCount(group.tileCoords.length, group.tilesPerCircuit);
            return (
              <li key={group.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.tileCoords.length} tiles, {circuits} circuit{circuits === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${group.name}`} onClick={() => setForm({ mode: 'edit', group })}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${group.name}`} className="text-destructive hover:text-destructive" onClick={() => handleDelete(group)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {form && (
        <WiringGroupForm
          key={form.mode === 'edit' ? form.group.id : 'create'}
          kind={kind}
          tileCount={form.mode === 'edit' ? form.group.tileCoords.length : selectedCoords.length}
          initial={form.mode === 'edit' ? form.group : undefined}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
