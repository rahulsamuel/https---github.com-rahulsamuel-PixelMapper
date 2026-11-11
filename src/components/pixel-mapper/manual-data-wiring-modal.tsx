'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WiringPattern } from '@/lib/wiring';
import { usePixelMap } from '@/contexts/pixel-map-context';

const CUSTOM_PATTERNS: WiringPattern[] = [
  'custom-serpentine-h',
  'custom-serpentine-h-start-right',
  'custom-serpentine-v',
  'custom-serpentine-v-start-bottom',
];

export interface ManualDataCircuitValues {
  mainLabel: string;
  backupLabel: string;
  numTiles: number;
  pattern: WiringPattern;
  runLength?: number;
}

export interface ManualDataGroupValues {
  totalTiles: number;
  tilesPerCircuit: number;
  startNumber: number;
  mainTemplate: string;
  backupTemplate: string;
  pattern: WiringPattern;
  runLength?: number;
}

interface ManualDataWiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualDataCircuitValues) => void;
  onSubmitGroup: (data: ManualDataGroupValues) => void;
}

export function ManualDataWiringModal({ isOpen, onClose, onSubmit, onSubmitGroup }: ManualDataWiringModalProps) {
  const { wiringData } = usePixelMap();
  const [asGroup, setAsGroup] = useState(false);
  const [mainLabel, setMainLabel] = useState('');
  const [backupLabel, setBackupLabel] = useState('');
  const [startNumber, setStartNumber] = useState('1');
  const [mainTemplate, setMainTemplate] = useState('{n}');
  const [backupTemplate, setBackupTemplate] = useState('{n}B');
  const [numTiles, setNumTiles] = useState('8');
  const [totalTiles, setTotalTiles] = useState('64');
  const [pattern, setPattern] = useState<WiringPattern>('left-right');
  const [runLength, setRunLength] = useState('4');

  useEffect(() => {
    if (isOpen) {
      let maxPortNum = 0;
      wiringData.forEach(d => {
        const label = d.dataLabel;
        if (label && /^\d+$/.test(label)) {
          const portNum = parseInt(label, 10);
          if (portNum > maxPortNum) {
            maxPortNum = portNum;
          }
        }
      });
      const newPortNum = maxPortNum + 1;
      setMainLabel(`${newPortNum}`);
      setBackupLabel(`${newPortNum}B`);
      setStartNumber(`${newPortNum}`);
    }
  }, [isOpen, wiringData]);

  const isCustomPattern = CUSTOM_PATTERNS.includes(pattern);
  const rl = parseInt(runLength, 10);
  const runLengthValue = isCustomPattern && !isNaN(rl) && rl > 0 ? rl : undefined;
  const tilesPerCircuit = parseInt(numTiles, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (asGroup) {
      const total = parseInt(totalTiles, 10);
      const start = parseInt(startNumber, 10);
      if (!isNaN(total) && total > 0 && !isNaN(tilesPerCircuit) && tilesPerCircuit > 0 && !isNaN(start) && start >= 0) {
        onSubmitGroup({
          totalTiles: total,
          tilesPerCircuit,
          startNumber: start,
          mainTemplate: mainTemplate.trim() || '{n}',
          backupTemplate: backupTemplate.trim() || '{n}B',
          pattern,
          runLength: runLengthValue,
        });
        onClose();
      }
      return;
    }
    if (mainLabel.trim() && !isNaN(tilesPerCircuit) && tilesPerCircuit > 0) {
      onSubmit({
        mainLabel: mainLabel.trim(),
        backupLabel: backupLabel.trim(),
        numTiles: tilesPerCircuit,
        pattern,
        runLength: runLengthValue,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Define Manual Data Circuit</DialogTitle>
          <DialogDescription>
            Specify the details for this new data circuit. The path will start from the selected tile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="create-as-group">Create as a group of circuits</Label>
              <p className="text-xs text-muted-foreground">Makes many circuits at once, numbered automatically.</p>
            </div>
            <Switch id="create-as-group" checked={asGroup} onCheckedChange={setAsGroup} />
          </div>
          {asGroup ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-tiles">Total Tiles in Group</Label>
                  <Input id="total-tiles" type="number" value={totalTiles} onChange={(e) => setTotalTiles(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-number">Start Number</Label>
                  <Input id="start-number" type="number" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="main-template">Main Label Format</Label>
                  <Input id="main-template" value={mainTemplate} onChange={(e) => setMainTemplate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-template">Backup Label Format</Label>
                  <Input id="backup-template" value={backupTemplate} onChange={(e) => setBackupTemplate(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Use {'{n}'} where the number goes. For example, 1-{'{n}'}A gives 1-1A, 1-2A.</p>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="main-port-label">Main Port Label</Label>
                <Input id="main-port-label" value={mainLabel} onChange={(e) => setMainLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-port-label">Backup Port Label</Label>
                <Input id="backup-port-label" value={backupLabel} onChange={(e) => setBackupLabel(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="num-tiles">{asGroup ? 'Tiles per Circuit' : 'Number of Tiles in Circuit'}</Label>
            <Input
              id="num-tiles"
              type="number"
              value={numTiles}
              onChange={(e) => setNumTiles(e.target.value)}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wiring-pattern">Wiring Pattern for this Circuit</Label>
            <Select value={pattern} onValueChange={(v) => setPattern(v as WiringPattern)}>
              <SelectTrigger id="wiring-pattern">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serpentine-horizontal">Serpentine Horizontal (Start Left)</SelectItem>
                <SelectItem value="serpentine-horizontal-start-right">Serpentine Horizontal (Start Right)</SelectItem>
                <SelectItem value="serpentine-vertical">Serpentine Vertical (Start Top)</SelectItem>
                <SelectItem value="serpentine-vertical-start-bottom">Serpentine Vertical (Start Bottom)</SelectItem>
                <SelectItem value="custom-serpentine-h">Custom Serpentine Horizontal (Start Left)</SelectItem>
                <SelectItem value="custom-serpentine-h-start-right">Custom Serpentine Horizontal (Start Right)</SelectItem>
                <SelectItem value="custom-serpentine-v">Custom Serpentine Vertical (Start Top)</SelectItem>
                <SelectItem value="custom-serpentine-v-start-bottom">Custom Serpentine Vertical (Start Bottom)</SelectItem>
                <SelectItem value="left-right">Left to Right</SelectItem>
                <SelectItem value="right-to-left">Right to Left</SelectItem>
                <SelectItem value="top-bottom">Top to Bottom</SelectItem>
                <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCustomPattern && (
            <div className="space-y-2">
              <Label htmlFor="run-length">Tiles Per Run (before dropping down)</Label>
              <Input
                id="run-length"
                type="number"
                value={runLength}
                onChange={(e) => setRunLength(e.target.value)}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                The serpentine will travel this many tiles in one direction before dropping to the next row/column and reversing.
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{asGroup ? 'Create Group' : 'Create Circuit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
