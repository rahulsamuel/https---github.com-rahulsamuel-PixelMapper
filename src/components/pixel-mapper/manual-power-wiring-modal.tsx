
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

interface ManualPowerWiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { label: string; numTiles: number; pattern: WiringPattern }) => void;
}

export function ManualPowerWiringModal({ isOpen, onClose, onSubmit }: ManualPowerWiringModalProps) {
  const { tiles } = usePixelMap();
  const [label, setLabel] = useState('');
  const [numTiles, setNumTiles] = useState('8');
  const [pattern, setPattern] = useState<WiringPattern>('left-right');

  useEffect(() => {
    if (isOpen) {
      // Find the next available 'P' number
      let maxPortNum = 0;
      tiles.forEach(t => {
        if (t.powerPortLabel?.startsWith('P')) {
          const portNum = parseInt(t.powerPortLabel.substring(1), 10);
          if (!isNaN(portNum) && portNum > maxPortNum) {
            maxPortNum = portNum;
          }
        }
      });
      setLabel(`P${maxPortNum + 1}`);
    }
  }, [isOpen, tiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(numTiles, 10);
    if (label.trim() && !isNaN(num) && num > 0) {
      onSubmit({ label: label.trim(), numTiles: num, pattern });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Define Manual Power Circuit</DialogTitle>
          <DialogDescription>
            Specify the details for this new power circuit. The path will start from the selected tile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="port-label">Port Label</Label>
            <Input id="port-label" value={label} onChange={(e) => setLabel(e.target.value)} />
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
                <SelectItem value="serpentine-horizontal">Serpentine (Horizontal)</SelectItem>
                <SelectItem value="serpentine-vertical">Serpentine (Vertical)</SelectItem>
                <SelectItem value="left-right">Left to Right</SelectItem>
                <SelectItem value="top-bottom">Top to Bottom</SelectItem>
                <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
