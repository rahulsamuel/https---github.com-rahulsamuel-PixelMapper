
'use client';

import { useDrag } from 'react-dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EquipmentItem } from '@/lib/rack-data';
import Image from 'next/image';

function DraggableEquipment({ item }: { item: EquipmentItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'equipment',
    item: item,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="p-2 border rounded-lg bg-card cursor-grab active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <p className="font-semibold text-sm">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.ru}RU - {item.type}</p>
    </div>
  );
}

export function EquipmentSidebar({ equipment }: { equipment: EquipmentItem[] }) {
  return (
    <aside className="w-72 border-r bg-background p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Equipment Library</h2>
       <p className="text-sm text-muted-foreground mb-4">
        Drag items from the library onto a rack to build your layout.
      </p>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-3">
          {equipment.map(item => (
            <DraggableEquipment key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
       <div className="mt-4 pt-4 border-t">
        <h3 className="font-semibold mb-2">Import from Datasheet (AI)</h3>
        <p className="text-sm text-muted-foreground mb-4">
            This feature is coming soon. You'll be able to upload a spec sheet to automatically add equipment to your library.
        </p>
        <button disabled className="w-full bg-primary/80 text-primary-foreground/80 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed">
            Upload Datasheet
        </button>
      </div>
    </aside>
  );
}
