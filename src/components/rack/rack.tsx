
'use client';

import { useDrop, useDrag, DropTargetMonitor } from 'react-dnd';
import type { EquipmentItem, RackItem } from '@/lib/rack-data';
import { Button } from '../ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

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

function RackEquipment({ rackId, item, view, onMove, onRemove }: { rackId: number, item: RackItem, view: 'front' | 'back', onMove: (rackId: number, item: RackItem, newRu: number) => void, onRemove: (rackId: number, instanceId: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'rack-item',
    item: { ...item, rackId: rackId }, // Pass rackId along with item
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, rackId]);
  
  const [, drop] = useDrop(() => ({
    accept: 'rack-item',
    hover: (draggedItem: RackItem & { rackId: number }, monitor: DropTargetMonitor) => {
        if (!ref.current || draggedItem.instanceId === item.instanceId || draggedItem.rackId !== rackId) {
            return;
        }

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        const ruHeight = hoverBoundingRect.height / item.equipment.ru;
        
        // Determine the RU position where the drag is happening
        const hoverMiddleY = hoverClientY;
        const ruOffset = Math.round(hoverMiddleY / ruHeight);

        const newTopRu = item.ru - ruOffset;
        
        // This is a simple move, a better implementation might show a ghost.
        // For now, we move it directly.
        if (draggedItem.ru !== newTopRu) {
            onMove(rackId, draggedItem, newTopRu);
        }
    }
  }));

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        height: `${item.equipment.ru * 1.5}rem`, // 1.5rem = h-6
        top: `${(item.ru - item.equipment.ru) * 1.5}rem`,
        opacity: isDragging ? 0.5 : 1,
        left: '0.5rem',
        right: '0.5rem',
        width: 'calc(100% - 1rem)',
        cursor: 'grab',
      }}
      className={cn(
        "absolute group",
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
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(rackId, item.instanceId)}>
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
  
  const [, drop] = useDrop(() => ({
    accept: ['equipment', 'rack-item'],
    drop: (item: (EquipmentItem | RackItem) & { rackId?: number }, monitor) => {
        const dropTarget = monitor.getClientOffset();
        const rackElement = document.getElementById(`rack-${id}`);
        if (!rackElement || !dropTarget) return;

        const rect = rackElement.getBoundingClientRect();
        const ruHeight = rect.height / ru;
        const relativeY = dropTarget.y - rect.top;
        const targetRu = ru - Math.floor(relativeY / ruHeight);
        
        const itemRuHeight = 'equipment' in item ? item.equipment.ru : item.ru;
        const finalTargetRu = Math.max(1, Math.min(ru - itemRuHeight + 1, targetRu));


        if ('instanceId' in item) { // It's a RackItem being moved
            if (item.rackId !== id) { // Moving from another rack
                onRemove(item.rackId!, item.instanceId);
                onDrop(id, item.equipment, finalTargetRu);
            } else { // Moving within the same rack
                onMove(id, item, finalTargetRu);
            }
        } else { // It's a new EquipmentItem
            onDrop(id, item, finalTargetRu);
        }
    },
  }), [id, ru, onDrop, onMove, onRemove]);


  return (
    <div className="w-96 flex-shrink-0">
        <h3 className="font-semibold text-lg text-center mb-2">{name}</h3>
        <div id={`rack-${id}`} ref={drop} className="relative bg-background border-2 border-foreground rounded-md p-2">
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
                rackId={id}
                item={item}
                view={view}
                onMove={onMove}
                onRemove={onRemove}
            />
        ))}
        </div>
    </div>
  );
}
