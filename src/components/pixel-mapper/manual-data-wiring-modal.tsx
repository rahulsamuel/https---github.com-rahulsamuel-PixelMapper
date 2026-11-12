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
import { formatGroupLabel } from '@/lib/wiring-groups';
import { usePixelMap } from '@/contexts/pixel-map-context';

const CUSTOM_PATTERNS: WiringPattern[] = [
  'custom-serpentine-h',
  'custom-serpentine-h-start-right',
  'custom-serpentine-v',
  'custom-serpentine-v-start-bottom',
];

export interface ManualDataCircuitValues {
  startTileId: number;
  mainLabel: string;
  backupLabel: string;
  numTiles: number;
  pattern: WiringPattern;
  runLength?: number;
}

interface ManualDataWiringModalProps {
  isOpen: boolean;
  startTileId: number | null;
  onClose: () => void;
  onSubmit: (data: ManualDataCircuitValues) => void;
}

export function ManualDataWiringModal({ isOpen, startTileId, onClose, onSubmit }: ManualDataWiringModalProps) {
  const { wiringData, getDataPathTileIds } = usePixelMap();
  const [portNumber, setPortNumber] = useState('1');
  const [mainTemplate, setMainTemplate] = useState('{n}');
  const [backupTemplate, setBackupTemplate] = useState('{n}B');
  const [tilesPerPort, setTilesPerPort] = useState('8');
  const [totalTiles, setTotalTiles] = useState('');
  const [pattern, setPattern] = useState<WiringPattern>('left-right');
  const [runLength, setRunLength] = useState('4');
  const [runStartTileId, setRunStartTileId] = useState<number | null>(null);
  const [tilesLeft, setTilesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRunStartTileId(startTileId);
      setTilesLeft(null);
    }
  }, [isOpen, startTileId]);

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
      setPortNumber(`${maxPortNum + 1}`);
    }
  }, [isOpen, wiringData]);

  const isCustomPattern = CUSTOM_PATTERNS.includes(pattern);
  const rl = parseInt(runLength, 10);
  const runLengthValue = isCustomPattern && !isNaN(rl) && rl > 0 ? rl : undefined;
  const perPort = parseInt(tilesPerPort, 10);
  const total = totalTiles.trim() === '' ? null : parseInt(totalTiles, 10);
  const isRunning = tilesLeft !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const port = parseInt(portNumber, 10);
    if (runStartTileId === null || isNaN(perPort) || perPort <= 0 || isNaN(port) || port < 0) return;
    if (total !== null && (isNaN(total) || total <= 0)) return;

    const path = getDataPathTileIds(runStartTileId, pattern, runLengthValue);
    const remaining = tilesLeft ?? (total ?? path.length);
    const count = Math.min(perPort, remaining, path.length);
    if (count <= 0) return;

    onSubmit({
      startTileId: runStartTileId,
      mainLabel: formatGroupLabel(mainTemplate.trim() || '{n}', port),
      backupLabel: formatGroupLabel(backupTemplate.trim() || '{n}B', port),
      numTiles: count,
      pattern,
      runLength: runLengthValue,
    });

    const left = remaining - count;
    if (left <= 0 || path.length <= count) {
      onClose();
      return;
    }
    setRunStartTileId(path[count]);
    setTilesLeft(left);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRunning ? 'Next Data Port' : 'Define Manual Data Circuit'}</DialogTitle>
          <DialogDescription>
            {isRunning
              ? `The next port starts at the next tile. ${tilesLeft} tiles left in this run.`
              : 'Each port is wired from the selected tile. The next port will then ask for its setup.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port-number">Port Number</Label>
              <Input id="port-number" type="number" value={portNumber} onChange={(e) => setPortNumber(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiles-per-port">Tiles per Port</Label>
              <Input id="tiles-per-port" type="number" value={tilesPerPort} onChange={(e) => setTilesPerPort(e.target.value)} min="1" />
            </div>
          </div>
          {!isRunning && (
            <div className="space-y-2">
              <Label htmlFor="total-tiles">Total Tiles to Wire (optional)</Label>
              <Input
                id="total-tiles"
                type="number"
                value={totalTiles}
                onChange={(e) => setTotalTiles(e.target.value)}
                min="1"
                placeholder="All remaining tiles"
              />
            </div>
          )}
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
          <p className="text-xs text-muted-foreground">Use {'{n}'} where the port number goes. For example, 1-{'{n}'}A gives 1-1A.</p>
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
              <Button type="button" variant="outline">{isRunning ? 'Stop' : 'Cancel'}</Button>
            </DialogClose>
            <Button type="submit">{isRunning ? `Create Port ${portNumber}` : 'Create Port'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
