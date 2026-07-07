'use client';

import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rack } from './rack';
import { EquipmentSidebar } from './equipment-sidebar';
import type { EquipmentItem, RackItem } from '@/lib/rack-data';
import { defaultEquipmentLibrary } from '@/lib/rack-data';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
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

interface RackState {
  id: number;
  name: string;
  ru: number;
  items: RackItem[];
}

export function RackBuilder() {
  const [racks, setRacks] = useState<RackState[]>([
    { id: 1, name: 'Main Rack', ru: 24, items: [] },
  ]);
  const [nextRackId, setNextRackId] = useState(2);
  const [equipmentLibrary] = useState<EquipmentItem[]>(defaultEquipmentLibrary);

  const addRack = () => {
    setRacks(prev => [
      ...prev,
      { id: nextRackId, name: `Rack ${nextRackId}`, ru: 24, items: [] },
    ]);
    setNextRackId(prev => prev + 1);
  };

  const deleteRack = (rackId: number) => {
    setRacks(prev => prev.filter(r => r.id !== rackId));
  };

  const renameRack = (rackId: number, name: string) => {
    setRacks(prev => prev.map(r => r.id === rackId ? { ...r, name } : r));
  };

  const resizeRack = (rackId: number, ru: number) => {
    setRacks(prev => prev.map(r => {
      if (r.id !== rackId) return r;
      // Remove items that no longer fit
      const validItems = r.items.filter(item => item.ru <= ru && item.ru - item.equipment.ru + 1 >= 1);
      return { ...r, ru, items: validItems };
    }));
  };

  const clearAllRacks = () => {
    setRacks(prev => prev.map(r => ({ ...r, items: [] })));
  };

  const handleDrop = (rackId: number, item: EquipmentItem, targetRu: number) => {
    setRacks(prev => prev.map(rack => {
      if (rack.id !== rackId) return rack;
      if (targetRu + item.ru - 1 > rack.ru || targetRu < 1) return rack;
      for (let i = 0; i < item.ru; i++) {
        const checkRu = targetRu - i;
        if (rack.items.some(existing =>
          existing.ru >= checkRu && existing.ru - existing.equipment.ru + 1 <= checkRu
        )) return rack;
      }
      const newItem: RackItem = {
        instanceId: crypto.randomUUID(),
        equipment: item,
        ru: targetRu,
      };
      return { ...rack, items: [...rack.items, newItem].sort((a, b) => b.ru - a.ru) };
    }));
  };

  const moveItem = (rackId: number, item: RackItem, newRu: number) => {
    setRacks(prev => prev.map(rack => {
      if (rack.id !== rackId) return rack;
      const others = rack.items.filter(i => i.instanceId !== item.instanceId);
      if (newRu < 1 || newRu + item.equipment.ru - 1 > rack.ru) return rack;
      for (let i = 0; i < item.equipment.ru; i++) {
        const checkRu = newRu - i;
        if (others.some(existing =>
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

  const totalItems = racks.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-[calc(100svh-3.5rem)] overflow-hidden">
        <EquipmentSidebar equipment={equipmentLibrary} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 border-b bg-background px-5 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {racks.length} {racks.length === 1 ? 'rack' : 'racks'}
              </span>
              {totalItems > 0 && (
                <span className="text-xs text-muted-foreground">
                  &middot; {totalItems} items placed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={totalItems === 0}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all racks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all equipment from every rack. This cannot be undone.
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
                  <p className="text-muted-foreground text-sm">No racks yet.</p>
                  <Button onClick={addRack} size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Rack
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-8 p-8 items-start min-h-full">
                {racks.map(rack => (
                  <Rack
                    key={rack.id}
                    id={rack.id}
                    name={rack.name}
                    ru={rack.ru}
                    items={rack.items}
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
