'use client';

import { useDrop, useDrag } from 'react-dnd';
import type { EquipmentItem, RackItem } from '@/lib/rack-data';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Trash2, Server, Zap, Network, Package, Tv, HelpCircle } from 'lucide-react';

const RU_HEIGHT = 32; // px per rack unit

const TYPE_ICONS: Record<string, React.ElementType> = {
  processor: Server,
  power: Zap,
  network: Network,
  utility: Package,
  media: Tv,
  other: HelpCircle,
};

function ScrewHole() {
  return (
    <div className="w-3 h-3 rounded-full border border-zinc-600 bg-zinc-800 flex items-center justify-center">
      <div className="w-1 h-1 rounded-full bg-zinc-600" />
    </div>
  );
}

function RailColumn({ totalRu }: { totalRu: number }) {
  return (
    <div className="w-7 flex-shrink-0 bg-zinc-800 border-x border-zinc-700 flex flex-col">
      {Array.from({ length: totalRu }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-evenly flex-shrink-0 border-b border-zinc-700/50"
          style={{ height: RU_HEIGHT }}
        >
          <ScrewHole />
          <ScrewHole />
        </div>
      ))}
    </div>
  );
}

function EquipmentBlock({
  rackId,
  item,
  onRemove,
  onMove,
}: {
  rackId: number;
  item: RackItem;
  onRemove: (rackId: number, instanceId: string) => void;
  onMove: (rackId: number, item: RackItem, newRu: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'rack-item',
    item: { ...item, rackId },
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }), [item, rackId]);

  const [, drop] = useDrop(() => ({
    accept: 'rack-item',
    hover: (draggedItem: RackItem & { rackId: number }, monitor) => {
      if (!ref.current || draggedItem.instanceId === item.instanceId || draggedItem.rackId !== rackId) return;
      const rect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const relY = clientOffset.y - rect.top;
      const ruOffset = Math.round(relY / RU_HEIGHT);
      const newTopRu = item.ru - ruOffset;
      if (draggedItem.ru !== newTopRu) onMove(rackId, draggedItem, newTopRu);
    },
  }));

  drag(drop(ref));

  const Icon = TYPE_ICONS[item.equipment.type] ?? HelpCircle;
  const color = item.equipment.color;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: item.equipment.ru * RU_HEIGHT,
        top: 0,
        position: 'absolute',
        left: 0,
        right: 0,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
      }}
      className="group rounded-sm overflow-hidden shadow-md border border-black/30"
    >
      {/* Equipment face */}
      <div
        className="absolute inset-0 flex items-center px-3 gap-2"
        style={{
          background: `linear-gradient(135deg, ${color}dd 0%, ${color}99 100%)`,
        }}
      >
        {/* Left indicator strip */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
          {item.equipment.ru >= 2 && (
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          )}
        </div>
        {/* Name & info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-xs leading-tight truncate drop-shadow">{item.equipment.name}</p>
          {item.equipment.model && item.equipment.ru >= 2 && (
            <p className="text-white/70 text-xs leading-tight truncate">{item.equipment.model}</p>
          )}
        </div>
        {/* RU badge */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-xs font-mono text-white/60">{item.equipment.ru}U</span>
          {item.equipment.wattage ? (
            <span className="text-xs font-mono text-white/50">{item.equipment.wattage}W</span>
          ) : null}
        </div>
        {/* Icon */}
        <Icon className="h-4 w-4 text-white/40 flex-shrink-0" />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(rackId, item.instanceId); }}
        className={cn(
          'absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center transition-opacity',
          'bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function RackSlot({
  ruNum,
  isOccupied,
  onDrop,
  item,
  rackId,
  onRemove,
  onMove,
}: {
  ruNum: number;
  isOccupied: boolean;
  onDrop: (item: EquipmentItem) => void;
  item?: RackItem;
  rackId: number;
  onRemove: (rackId: number, instanceId: string) => void;
  onMove: (rackId: number, item: RackItem, newRu: number) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'equipment',
    drop: (dragged: EquipmentItem) => onDrop(dragged),
    canDrop: () => !isOccupied,
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop, isOccupied]);

  return (
    <div
      ref={drop}
      className={cn(
        'relative border-b border-zinc-700/40 flex-shrink-0 flex items-center',
        isOver && canDrop && 'bg-primary/20',
      )}
      style={{ height: RU_HEIGHT }}
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 border-2 border-primary/60 pointer-events-none z-10" />
      )}
      {item && (
        <div className="absolute inset-0 z-20">
          <EquipmentBlock rackId={rackId} item={item} onRemove={onRemove} onMove={onMove} />
        </div>
      )}
    </div>
  );
}

export function Rack({
  id,
  name,
  ru,
  items,
  onDrop,
  onMove,
  onRemove,
  onDelete,
  onRename,
  onResize,
}: {
  id: number;
  name: string;
  ru: number;
  items: RackItem[];
  onDrop: (rackId: number, item: EquipmentItem, targetRu: number) => void;
  onMove: (rackId: number, item: RackItem, newRu: number) => void;
  onRemove: (rackId: number, instanceId: string) => void;
  onDelete: (rackId: number) => void;
  onRename: (rackId: number, name: string) => void;
  onResize: (rackId: number, ru: number) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);

  const usedRu = items.reduce((sum, i) => sum + i.equipment.ru, 0);
  const freeRu = ru - usedRu;
  const totalPower = items.reduce((sum, i) => sum + (i.equipment.wattage ?? 0), 0);

  // Build a map of top RU -> item for slots that START at that RU
  const itemByTopRu = new Map<number, RackItem>();
  items.forEach(item => { itemByTopRu.set(item.ru, item); });

  const occupiedRus = new Set<number>();
  items.forEach(item => {
    for (let i = 0; i < item.equipment.ru; i++) {
      occupiedRus.add(item.ru - i);
    }
  });

  const [, dropRef] = useDrop(() => ({
    accept: ['equipment', 'rack-item'],
    drop: (dragged: (EquipmentItem | RackItem) & { rackId?: number }, monitor) => {
      if (monitor.didDrop()) return;
      const offset = monitor.getClientOffset();
      const el = document.getElementById(`rack-body-${id}`);
      if (!el || !offset) return;

      const rect = el.getBoundingClientRect();
      const relY = offset.y - rect.top;
      // RU 1 = bottom, so we invert
      const fromTop = Math.floor(relY / RU_HEIGHT); // 0-indexed from top
      const targetRu = ru - fromTop; // convert to 1-indexed from bottom

      const itemHeight = 'equipment' in dragged ? dragged.equipment.ru : dragged.ru;
      const clamped = Math.max(1, Math.min(ru - itemHeight + 1, targetRu));

      if ('instanceId' in dragged) {
        if (dragged.rackId !== id) {
          onRemove(dragged.rackId!, dragged.instanceId);
          onDrop(id, dragged.equipment, clamped);
        } else {
          onMove(id, dragged, clamped);
        }
      } else {
        onDrop(id, dragged, clamped);
      }
    },
  }), [id, ru, onDrop, onMove, onRemove]);

  const commitName = () => {
    setEditingName(false);
    if (nameValue.trim()) onRename(id, nameValue.trim());
    else setNameValue(name);
  };

  return (
    <div className="flex-shrink-0 flex flex-col" style={{ width: 320 }}>
      {/* Rack header */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(name); } }}
              className="flex-1 bg-transparent border-b border-primary text-sm font-semibold outline-none mr-2"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold hover:text-primary transition-colors text-left truncate flex-1"
              title="Click to rename"
            >
              {name}
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="text-muted-foreground hover:text-destructive transition-colors ml-2 flex-shrink-0"
            title="Delete rack"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">{usedRu}</span>/{ru}U used
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className={cn('font-mono', freeRu === 0 ? 'text-destructive' : 'text-emerald-500')}>{freeRu}U free</span>
          {totalPower > 0 && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="font-mono text-amber-500">{totalPower}W</span>
            </>
          )}
          <select
            value={ru}
            onChange={e => onResize(id, Number(e.target.value))}
            className="ml-auto text-xs bg-transparent border border-border rounded px-1 py-0 h-5 cursor-pointer"
          >
            {[8, 12, 16, 20, 24, 32, 42].map(n => (
              <option key={n} value={n}>{n}U</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rack enclosure */}
      <div
        className="rounded-sm border-2 border-zinc-600 bg-zinc-900 overflow-hidden shadow-xl"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.5)' }}
      >
        {/* Top cap */}
        <div className="h-3 bg-zinc-700 border-b border-zinc-600 flex items-center px-2">
          <div className="flex gap-1">
            <div className="w-8 h-1.5 rounded-sm bg-zinc-600" />
            <div className="w-4 h-1.5 rounded-sm bg-zinc-600" />
          </div>
        </div>

        {/* Main body */}
        <div className="flex">
          {/* Left RU numbers */}
          <div className="w-6 flex-shrink-0 flex flex-col bg-zinc-850">
            {Array.from({ length: ru }, (_, i) => ru - i).map(ruNum => (
              <div
                key={ruNum}
                className="flex items-center justify-center text-zinc-500 font-mono flex-shrink-0 border-b border-zinc-700/30"
                style={{ height: RU_HEIGHT, fontSize: 9 }}
              >
                {ruNum}
              </div>
            ))}
          </div>

          {/* Left rail */}
          <RailColumn totalRu={ru} />

          {/* Equipment area */}
          <div id={`rack-body-${id}`} ref={dropRef} className="flex-1 relative bg-zinc-950">
            {Array.from({ length: ru }, (_, i) => ru - i).map(ruNum => {
              const topItem = itemByTopRu.get(ruNum);
              return (
                <RackSlot
                  key={ruNum}
                  ruNum={ruNum}
                  isOccupied={occupiedRus.has(ruNum)}
                  onDrop={item => onDrop(id, item, ruNum)}
                  item={topItem}
                  rackId={id}
                  onRemove={onRemove}
                  onMove={onMove}
                />
              );
            })}
          </div>

          {/* Right rail */}
          <RailColumn totalRu={ru} />
        </div>

        {/* Bottom cap */}
        <div className="h-3 bg-zinc-700 border-t border-zinc-600" />
      </div>
    </div>
  );
}
