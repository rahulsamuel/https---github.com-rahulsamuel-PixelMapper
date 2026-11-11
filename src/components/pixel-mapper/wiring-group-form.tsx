'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WiringGroup } from '@/contexts/pixel-map-types';
import { isCustomSerpentine, type WiringPattern } from '@/lib/wiring';
import { getGroupCircuitCount, getGroupCircuitLabels } from '@/lib/wiring-groups';

export type WiringGroupFormValues = Omit<WiringGroup, 'id' | 'kind' | 'tileCoords'>;

const PATTERN_OPTIONS: { value: WiringPattern; label: string }[] = [
  { value: 'serpentine-horizontal', label: 'Serpentine Horizontal (Start Left)' },
  { value: 'serpentine-horizontal-start-right', label: 'Serpentine Horizontal (Start Right)' },
  { value: 'serpentine-vertical', label: 'Serpentine Vertical (Start Top)' },
  { value: 'custom-serpentine-h', label: 'Custom Serpentine Horizontal (Start Left)' },
  { value: 'custom-serpentine-h-start-right', label: 'Custom Serpentine Horizontal (Start Right)' },
  { value: 'custom-serpentine-v', label: 'Custom Serpentine Vertical (Start Top)' },
  { value: 'custom-serpentine-v-start-bottom', label: 'Custom Serpentine Vertical (Start Bottom)' },
  { value: 'left-right', label: 'Left to Right' },
  { value: 'right-to-left', label: 'Right to Left' },
  { value: 'top-bottom', label: 'Top to Bottom' },
  { value: 'bottom-to-top', label: 'Bottom to Top' },
];

interface WiringGroupFormProps {
  kind: 'data' | 'power';
  tileCount: number;
  initial?: WiringGroup;
  onClose: () => void;
  onSubmit: (values: WiringGroupFormValues) => void;
}

export function WiringGroupForm({ kind, tileCount, initial, onClose, onSubmit }: WiringGroupFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [pattern, setPattern] = useState<WiringPattern>(initial?.pattern ?? 'left-right');
  const [runLength, setRunLength] = useState(String(initial?.runLength ?? 4));
  const [tilesPerCircuit, setTilesPerCircuit] = useState(String(initial?.tilesPerCircuit ?? 8));
  const [startNumber, setStartNumber] = useState(String(initial?.startNumber ?? 1));
  const [mainTemplate, setMainTemplate] = useState(initial?.mainTemplate ?? '{n}');
  const [backupTemplate, setBackupTemplate] = useState(initial?.backupTemplate ?? '{n}B');
  const [customLabels, setCustomLabels] = useState<WiringGroup['customLabels']>(initial?.customLabels ?? {});

  const perCircuit = parseInt(tilesPerCircuit, 10);
  const start = parseInt(startNumber, 10);
  const run = parseInt(runLength, 10);
  const isValid = perCircuit >= 1 && start >= 0 && tileCount >= 1 && (!isCustomSerpentine(pattern) || run >= 1);

  const draft: WiringGroup = {
    id: initial?.id ?? '',
    name,
    kind,
    tileCoords: [],
    pattern,
    runLength: isCustomSerpentine(pattern) ? run : undefined,
    tilesPerCircuit: perCircuit || 1,
    mainTemplate,
    backupTemplate,
    startNumber: start || 0,
    customLabels,
  };
  const circuitCount = getGroupCircuitCount(tileCount, draft.tilesPerCircuit);

  const setCustomLabel = (circuitIndex: number, field: 'main' | 'backup', value: string) => {
    setCustomLabels(prev => ({ ...prev, [circuitIndex]: { ...prev[circuitIndex], [field]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      name: name.trim() || 'Untitled group',
      pattern,
      runLength: draft.runLength,
      tilesPerCircuit: draft.tilesPerCircuit,
      startNumber: draft.startNumber,
      mainTemplate: mainTemplate.trim() || '{n}',
      backupTemplate: backupTemplate.trim() || '{n}B',
      customLabels,
    });
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Group' : 'New Group'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Changes update the circuits in this group. Labels you typed by hand are kept.' : `Creates circuits from the ${tileCount} selected tile${tileCount === 1 ? '' : 's'}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input id="group-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Left wall" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-pattern">Wiring Pattern</Label>
            <Select value={pattern} onValueChange={v => setPattern(v as WiringPattern)}>
              <SelectTrigger id="group-pattern"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERN_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isCustomSerpentine(pattern) && (
            <div className="space-y-2">
              <Label htmlFor="group-run-length">Tiles Per Run (before dropping down)</Label>
              <Input id="group-run-length" type="number" min="1" value={runLength} onChange={e => setRunLength(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-tiles-per-circuit">Tiles per Circuit</Label>
              <Input id="group-tiles-per-circuit" type="number" min="1" value={tilesPerCircuit} onChange={e => setTilesPerCircuit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-start-number">Start Number</Label>
              <Input id="group-start-number" type="number" min="0" value={startNumber} onChange={e => setStartNumber(e.target.value)} />
            </div>
          </div>
          <div className={kind === 'data' ? 'grid grid-cols-2 gap-4' : 'space-y-2'}>
            <div className="space-y-2">
              <Label htmlFor="group-main-template">{kind === 'data' ? 'Main Label Format' : 'Circuit Label Format'}</Label>
              <Input id="group-main-template" value={mainTemplate} onChange={e => setMainTemplate(e.target.value)} />
            </div>
            {kind === 'data' && (
              <div className="space-y-2">
                <Label htmlFor="group-backup-template">Backup Label Format</Label>
                <Input id="group-backup-template" value={backupTemplate} onChange={e => setBackupTemplate(e.target.value)} />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Use {'{n}'} where the number goes. For example, {'{n}'} gives 1, 2, 3, and 1-{'{n}'}A gives 1-1A, 1-2A.
          </p>
          <div className="space-y-2">
            <Label>Circuits ({circuitCount})</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {Array.from({ length: circuitCount }, (_, circuitIndex) => {
                const labels = getGroupCircuitLabels(draft, circuitIndex);
                return (
                  <div key={circuitIndex} className="grid grid-cols-[4rem_1fr_1fr] items-center gap-2 p-2">
                    <span className="text-xs text-muted-foreground">#{circuitIndex + 1}</span>
                    <Input
                      aria-label={`Circuit ${circuitIndex + 1} main label`}
                      value={labels.main}
                      onChange={e => setCustomLabel(circuitIndex, 'main', e.target.value)}
                      className="h-8"
                    />
                    {kind === 'data' ? (
                      <Input
                        aria-label={`Circuit ${circuitIndex + 1} backup label`}
                        value={labels.backup}
                        onChange={e => setCustomLabel(circuitIndex, 'backup', e.target.value)}
                        className="h-8"
                      />
                    ) : <span />}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!isValid}>{initial ? 'Save Changes' : 'Create Group'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
