
'use client';

import { useDrop, useDrag } from 'react-dnd';
import type { EquipmentItem, RackItem } from '@/lib/rack-data';
import { Button } from '../ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function RackUnit({ ru, onDrop, isOccupied }: { ru: number, onDrop: (item: EquipmentItem) => void, isOccupied: boolean }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'equipment',
    drop: (item: EquipmentItem) => onDrop(item),
    canDrop: (item: EquipmentItem) => !isOccupied,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop, isOccupied]);

  return (
    <div ref={drop} className="relative h-6 border-b border-dashed border-muted flex items-center justify-end px-2">
      <span className="text-xs font-mono text-muted-foreground">{ru}</span>
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-accent/30" />
      )}
    </div>
  );
}

function RackEquipment({ item, view, onMove, onRemove }: { item: RackItem, view: 'front' | 'back', onMove: (item: RackItem, newRu: number) => void, onRemove: (instanceId: string) => void }) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'rack-item',
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, onMove]);

  const [{ isOver, canDrop, dropRu }, drop] = useDrop(() => ({
    accept: 'rack-item',
    drop: (draggedItem: RackItem, monitor) => {
        const dropTarget = monitor.getClientOffset();
        if (dropTarget && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const ruHeight = rect.height / item.equipment.ru;
            const relativeY = dropTarget.y - rect.top;
            const droppedOnRu = Math.floor(relativeY / ruHeight);
            
            // Because we render top-to-bottom from highest RU, we need to invert.
            const targetStartRu = item.ru - droppedOnRu;

            onMove(draggedItem, targetStartRu);
        }
    },
     collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
      dropRu: null // Not used for full-item drop
    }),
  }), [onMove]);
  
  const ref = drop(drag(null));

  return (
    <div
      ref={ref}
      style={{
        height: `${item.equipment.ru * 1.5}rem`, // 1.5rem = h-6
        top: `${(item.ru - item.equipment.ru) * 1.5}rem`,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "absolute w-full group",
        "flex items-center justify-center bg-card border-2 border-primary/50 shadow-md rounded-sm"
      )}
    >
      <Image
        src={item.equipment.image[view]}
        alt={`${item.equipment.name} ${view} view`}
        layout="fill"
        objectFit="cover"
        className="rounded-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent p-2 flex flex-col justify-between">
        <div>
          <p className="font-bold text-white text-sm drop-shadow-md">{item.equipment.name}</p>
          <p className="text-xs text-white/80 drop-shadow-md">{item.equipment.ru}RU</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(item.instanceId)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}


export function Rack({ id, name, ru, items, view, onDrop, onMove, onRemove }: { id: number, name: string, ru: number, items: RackItem[], view: 'front' | 'back', onDrop: (rackId: number, item: EquipmentItem, targetRu: number) => void, onMove: (rackId: number, item: RackItem, newRu: number) => void, onRemove: (rackId: number, instanceId: string) => void }) {
  
  const occupiedRus = new Set<number>();
  items.forEach(item => {
    for (let i = 0; i < item.equipment.ru; i++) {
      occupiedRus.add(item.ru - i);
    }
  });

  return (
    <div className="w-96 flex-shrink-0">
        <h3 className="font-semibold text-lg text-center mb-2">{name}</h3>
        <div className="relative bg-background border-2 border-foreground rounded-md p-2">
        {Array.from({ length: ru }, (_, i) => ru - i).map(ruNum => (
            <RackUnit
                key={ruNum}
                ru={ruNum}
                onDrop={(item) => onDrop(id, item, ruNum)}
                isOccupied={occupiedRus.has(ruNum)}
            />
        ))}

        {items.map(item => (
            <RackEquipment
                key={item.instanceId}
                item={item}
                view={view}
                onMove={(movedItem, newRu) => onMove(id, movedItem, newRu)}
                onRemove={(instanceId) => onRemove(id, instanceId)}
            />
        ))}
        </div>
    </div>
  );
}
