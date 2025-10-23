
'use client';

import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rack } from './rack';
import { EquipmentSidebar } from './equipment-sidebar';
import type { EquipmentItem, RackItem } from '@/lib/rack-data';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const initialEquipment: EquipmentItem[] = [
  { id: 'brompton-s8', name: 'Brompton S8 Processor', ru: 4, type: 'processor', image: { front: 'https://placehold.co/480x176/273a5e/d1d9e6?text=Front', back: 'https://placehold.co/480x176/273a5e/d1d9e6?text=Back' } },
  { id: 'nova-pdu', name: 'Nova PDU', ru: 2, type: 'power', image: { front: 'https://placehold.co/480x88/273a5e/d1d9e6?text=Front', back: 'https://placehold.co/480x88/273a5e/d1d9e6?text=Back' } },
  { id: 'generic-1u-blank', name: '1U Blank Panel', ru: 1, type: 'utility', image: { front: 'https://placehold.co/480x44/111/eee?text=Blank', back: 'https://placehold.co/480x44/111/eee?text=Blank' } },
];

export function RackBuilder() {
  const [racks, setRacks] = useState([{ id: 1, name: 'Rack 1', ru: 24, items: [] as RackItem[] }]);
  const [nextRackId, setNextRackId] = useState(2);
  const [equipmentLibrary, setEquipmentLibrary] = useState<EquipmentItem[]>(initialEquipment);
  const [view, setView] = useState<'front' | 'back'>('front');

  const addRack = () => {
    setRacks([...racks, { id: nextRackId, name: `Rack ${nextRackId}`, ru: 24, items: [] }]);
    setNextRackId(prev => prev + 1);
  };
  
  const clearAllRacks = () => {
      setRacks(racks.map(r => ({ ...r, items: [] })));
  }

  const handleDrop = (rackId: number, item: EquipmentItem, targetRu: number) => {
    setRacks(prevRacks => prevRacks.map(rack => {
      if (rack.id !== rackId) return rack;

      // Check if there is enough space
      if (targetRu + item.ru - 1 > rack.ru) {
        return rack; // Not enough space
      }
      // Check for conflicts
      for (let i = 0; i < item.ru; i++) {
        if (rack.items.some(existing => existing.ru <= targetRu + i && existing.ru + existing.equipment.ru -1 >= targetRu + i)) {
          return rack; // Conflict
        }
      }

      const newRackItem: RackItem = {
        instanceId: crypto.randomUUID(),
        equipment: item,
        ru: targetRu,
      };

      return { ...rack, items: [...rack.items, newRackItem].sort((a, b) => b.ru - a.ru) };
    }));
  };
  
  const moveItem = (rackId: number, item: RackItem, newRu: number) => {
      setRacks(prevRacks => prevRacks.map(rack => {
          if (rack.id !== rackId) return rack;

          // Remove the item being moved
          const otherItems = rack.items.filter(i => i.instanceId !== item.instanceId);

          // Check if there is enough space
          if (newRu + item.equipment.ru - 1 > rack.ru) {
              return rack; // Not enough space
          }
           // Check for conflicts
          for (let i = 0; i < item.equipment.ru; i++) {
              if (otherItems.some(existing => existing.ru <= newRu + i && existing.ru + existing.equipment.ru -1 >= newRu + i)) {
                  return rack; // Conflict
              }
          }

          const movedItem = { ...item, ru: newRu };
          return { ...rack, items: [...otherItems, movedItem].sort((a,b) => b.ru - a.ru) };
      }));
  }

  const removeItem = (rackId: number, instanceId: string) => {
    setRacks(prevRacks => prevRacks.map(rack => {
      if (rack.id !== rackId) return rack;
      return { ...rack, items: rack.items.filter(item => item.instanceId !== instanceId) };
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <EquipmentSidebar equipment={equipmentLibrary} />
        <main className="flex-1 p-6 bg-muted/30 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Rack Layout</h1>
              <div className="flex items-center gap-2 rounded-lg bg-background p-1 border">
                <Button size="sm" variant={view === 'front' ? 'secondary' : 'ghost'} onClick={() => setView('front')}>Front</Button>
                <Button size="sm" variant={view === 'back' ? 'secondary' : 'ghost'} onClick={() => setView('back')}>Back</Button>
              </div>
            </div>
             <div className="flex items-center gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" >
                            <Trash2 className="mr-2" />
                            Clear All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all equipment from all racks. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllRacks}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={addRack}><Plus className="mr-2" />Add Rack</Button>
            </div>
          </div>
          <div className="flex gap-8">
            {racks.map(rack => (
              <Rack
                key={rack.id}
                id={rack.id}
                name={rack.name}
                ru={rack.ru}
                items={rack.items}
                view={view}
                onDrop={handleDrop}
                onMove={moveItem}
                onRemove={removeItem}
              />
            ))}
            {racks.length === 0 && (
                <Card className="w-96">
                    <CardHeader><CardTitle>No Racks</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Click "Add Rack" to get started.</p>
                         <Button onClick={addRack} className="w-full"><Plus className="mr-2" />Add Rack</Button>
                    </CardContent>
                </Card>
            )}
          </div>
        </main>
      </div>
    </DndProvider>
  );
}
