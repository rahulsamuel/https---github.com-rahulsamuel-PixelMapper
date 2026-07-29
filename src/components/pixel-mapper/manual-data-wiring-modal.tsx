
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WiringPattern } from '@/lib/wiring';
import { usePixelMap } from '@/contexts/pixel-map-context';

const CUSTOM_PATTERNS: WiringPattern[] = [
  'custom-serpentine-h',
  'custom-serpentine-h-start-right',
  'custom-serpentine-v',
  'custom-serpentine-v-start-bottom',
];

interface ManualDataWiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { mainLabel: string; backupLabel: string, numTiles: number; pattern: WiringPattern; runLength?: number }) => void;
}

export function ManualDataWiringModal({ isOpen, onClose, onSubmit }: ManualDataWiringModalProps) {
  const { wiringData } = usePixelMap();
  const [mainLabel, setMainLabel] = useState('');
  const [backupLabel, setBackupLabel] = useState('');
  const [numTiles, setNumTiles] = useState('8');
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
    }
  }, [isOpen, wiringData]);

  const isCustomPattern = CUSTOM_PATTERNS.includes(pattern);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(numTiles, 10);
    const rl = parseInt(runLength, 10);
    if (mainLabel.trim() && !isNaN(num) && num > 0) {
      onSubmit({
        mainLabel: mainLabel.trim(),
        backupLabel: backupLabel.trim(),
        numTiles: num,
        pattern,
        runLength: isCustomPattern && !isNaN(rl) && rl > 0 ? rl : undefined,
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
          <div className="space-y-2">
            <Label htmlFor="num-tiles">Number of Tiles in Circuit</Label>
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
            <Button type="submit">Create Circuit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
