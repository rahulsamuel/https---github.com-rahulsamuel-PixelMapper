'use client';

import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rack } from './rack';
import { EquipmentSidebar } from './equipment-sidebar';
import type { EquipmentItem, RackItem, RackSide } from '@/lib/rack-data';
import { defaultEquipmentLibrary } from '@/lib/rack-data';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, LayoutGrid, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { downloadRackPng } from '@/lib/rack-download';

interface RackState {
  id: number;
  name: string;
  ru: number;
  items: RackItem[];
}

async function fetchEquipmentLibrary(): Promise<EquipmentItem[]> {
  try {
    const res = await fetch('/api/rack-equipment');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return defaultEquipmentLibrary;
    return data;
  } catch {
    return defaultEquipmentLibrary;
  }
}

export function RackBuilder() {
  const [racks, setRacks] = useState<RackState[]>([
    { id: 1, name: 'Main Rack', ru: 24, items: [] },
  ]);
  const [nextRackId, setNextRackId] = useState(2);
  const [equipmentLibrary, setEquipmentLibrary] = useState<EquipmentItem[]>(defaultEquipmentLibrary);
  const [activeSide, setActiveSide] = useState<RackSide>('front');

  useEffect(() => {
    fetchEquipmentLibrary().then(setEquipmentLibrary);
  }, []);

  const addRack = () => {
    setRacks(prev => [...prev, { id: nextRackId, name: `Rack ${nextRackId}`, ru: 24, items: [] }]);
    setNextRackId(prev => prev + 1);
  };

  const deleteRack = (rackId: number) => {
    setRacks(prev => prev.filter(r => r.id !== rackId));
  };

  const renameRack = (rackId: number, name: string) => {
    setRacks(prev => prev.map(r => r.id === rackId ? { ...r, name } : r));
  };

  // force=true skips the confirmation (already confirmed in Rack component)
  const resizeRack = (rackId: number, ru: number, force?: boolean) => {
    setRacks(prev => prev.map(r => {
      if (r.id !== rackId) return r;
      // When force=true, remove items that don't fit; otherwise Rack component handles the dialog
      const validItems = force
        ? r.items.filter(item => item.ru <= ru)
        : r.items;
      return { ...r, ru, items: validItems };
    }));
  };

  const clearAllRacks = () => {
    setRacks(prev => prev.map(r => ({ ...r, items: [] })));
  };

  const handleDrop = (rackId: number, item: EquipmentItem, targetRu: number, side: RackSide) => {
    setRacks(prev => prev.map(rack => {
      if (rack.id !== rackId) return rack;
      if (targetRu < 1 || targetRu + item.ru - 1 > rack.ru) return rack;
      // Conflict check: only items on the same side conflict
      const sideItems = rack.items.filter(i => i.side === side);
      for (let i = 0; i < item.ru; i++) {
        const checkRu = targetRu - i;
        if (sideItems.some(existing =>
          existing.ru >= checkRu && existing.ru - existing.equipment.ru + 1 <= checkRu
        )) return rack;
      }
      const newItem: RackItem = {
        instanceId: crypto.randomUUID(),
        equipment: item,
        ru: targetRu,
        side,
      };
      return { ...rack, items: [...rack.items, newItem].sort((a, b) => b.ru - a.ru) };
    }));
  };

  const moveItem = (rackId: number, item: RackItem, newRu: number) => {
    setRacks(prev => prev.map(rack => {
      if (rack.id !== rackId) return rack;
      const others = rack.items.filter(i => i.instanceId !== item.instanceId);
      if (newRu < 1 || newRu + item.equipment.ru - 1 > rack.ru) return rack;
      const sideOthers = others.filter(i => i.side === item.side);
      for (let i = 0; i < item.equipment.ru; i++) {
        const checkRu = newRu - i;
        if (sideOthers.some(existing =>
          existing.ru >= checkRu && existing.ru - existing.equipment.ru + 1 <= checkRu
        )) return rack;
      }
      const moved = { ...item, ru: newRu };
      return { ...rack, items: [...others, moved].sort((a, b) => b.ru - a.ru) };
    }));
  };

  const removeItem = (rackId: number, instanceId: string) => {
    setRacks(prev => prev.map(rack =>
      rack.id !== rackId ? rack : { ...rack, items: rack.items.filter(i => i.instanceId !== instanceId) }
    ));
  };

  const downloadAll = () => {
    racks.forEach(r => downloadRackPng(r.name, r.ru, r.items));
  };

  const totalItems = racks.reduce((sum, r) => sum + r.items.filter(i => i.side === activeSide).length, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-[calc(100svh-3.5rem)] overflow-hidden">
        <EquipmentSidebar equipment={equipmentLibrary} activeSide={activeSide} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 border-b bg-background px-4 py-2 flex items-center gap-3">
            {/* Side toggle */}
            <div className="flex items-center rounded-md border overflow-hidden">
              <button
                onClick={() => setActiveSide('front')}
                className={cn(
                  'px-3 py-1 text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5',
                  activeSide === 'front'
                    ? 'bg-emerald-950 text-emerald-400 border-r border-emerald-800'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-r border-border',
                )}
              >
                <ChevronRight className="h-3 w-3" />
                FRONT
              </button>
              <button
                onClick={() => setActiveSide('rear')}
                className={cn(
                  'px-3 py-1 text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5',
                  activeSide === 'rear'
                    ? 'bg-amber-950 text-amber-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <ChevronLeft className="h-3 w-3" />
                REAR
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{racks.length} {racks.length === 1 ? 'rack' : 'racks'}</span>
              {totalItems > 0 && (
                <span className="text-xs">&middot; {totalItems} items on {activeSide}</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={downloadAll} title="Download all racks as PNG">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download PNG
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={racks.every(r => r.items.length === 0)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all racks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all equipment from every rack on both sides. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAllRacks}>Clear All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button size="sm" onClick={addRack}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Rack
              </Button>
            </div>
          </div>

          {/* Rack canvas */}
          <div className="flex-1 overflow-auto bg-[#0f0f0f]">
            {racks.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <LayoutGrid className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">No racks. Click Add Rack to start.</p>
                  <Button onClick={addRack} size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Rack
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-8 p-8 items-start min-w-max min-h-full" style={{ background: '#0f0f0f' }}>
                {racks.map(rack => (
                  <Rack
                    key={rack.id}
                    id={rack.id}
                    name={rack.name}
                    ru={rack.ru}
                    items={rack.items}
                    activeSide={activeSide}
                    onDrop={handleDrop}
                    onMove={moveItem}
                    onRemove={removeItem}
                    onDelete={deleteRack}
                    onRename={renameRack}
                    onResize={resizeRack}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
