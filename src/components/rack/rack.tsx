'use client';

import { useDrop, useDrag } from 'react-dnd';
import type { EquipmentItem, RackItem, RackSide } from '@/lib/rack-data';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Trash2, Server, Zap, Network, Package, Tv, HelpCircle, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

const RU_HEIGHT = 32; // px per rack unit

const TYPE_ICONS: Record<string, React.ElementType> = {
  processor: Server,
  power: Zap,
  network: Network,
  utility: Package,
  media: Tv,
  other: HelpCircle,
};

// Visual config per side
const SIDE_CONFIG = {
  front: {
    borderColor: '#52525b',       // zinc-600
    railBg: '#27272a',            // zinc-800
    bodyBg: '#09090b',            // zinc-950
    enclosureBg: '#18181b',       // zinc-900
    label: 'FRONT',
    labelColor: '#6ee7b7',        // emerald-300
    indicatorColor: '#34d399',    // emerald-400
  },
  rear: {
    borderColor: '#b45309',       // amber-700
    railBg: '#3b1f00',            // dark amber
    bodyBg: '#1c0f00',            // very dark amber
    enclosureBg: '#271500',       // dark amber
    label: 'REAR',
    labelColor: '#fcd34d',        // amber-300
    indicatorColor: '#fbbf24',    // amber-400
  },
};

function ScrewHole({ side }: { side: RackSide }) {
  return (
    <div className="w-3 h-3 rounded-full flex items-center justify-center"
      style={{ border: `1px solid ${side === 'rear' ? '#78350f' : '#3f3f46'}`, background: side === 'rear' ? '#451a03' : '#27272a' }}>
      <div className="w-1 h-1 rounded-full" style={{ background: side === 'rear' ? '#78350f' : '#52525b' }} />
    </div>
  );
}

function RailColumn({ totalRu, side }: { totalRu: number; side: RackSide }) {
  return (
    <div
      className="w-7 flex-shrink-0 flex flex-col"
      style={{ background: SIDE_CONFIG[side].railBg, borderLeft: `1px solid ${SIDE_CONFIG[side].borderColor}30`, borderRight: `1px solid ${SIDE_CONFIG[side].borderColor}30` }}
    >
      {Array.from({ length: totalRu }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-evenly flex-shrink-0"
          style={{ height: RU_HEIGHT, borderBottom: `1px solid ${SIDE_CONFIG[side].borderColor}20` }}
        >
          <ScrewHole side={side} />
          <ScrewHole side={side} />
        </div>
      ))}
    </div>
  );
}

function EquipmentBlock({
  rackId,
  item,
  activeSide,
  onRemove,
  onMove,
}: {
  rackId: number;
  item: RackItem;
  activeSide: RackSide;
  onRemove: (rackId: number, instanceId: string) => void;
  onMove: (rackId: number, item: RackItem, newRu: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const cfg = SIDE_CONFIG[activeSide];

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'rack-item',
    item: { ...item, rackId },
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }), [item, rackId]);

  const [, drop] = useDrop(() => ({
    accept: 'rack-item',
    hover: (draggedItem: RackItem & { rackId: number }, monitor) => {
      if (!ref.current || draggedItem.instanceId === item.instanceId || draggedItem.rackId !== rackId || draggedItem.side !== item.side) return;
      const rect = ref.current.getBoundingClientRect();
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const relY = offset.y - rect.top;
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
        position: 'absolute',
        left: 0, right: 0, top: 0,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
      }}
      className="group rounded-sm overflow-hidden shadow-md"
      style2={{ border: '1px solid rgba(0,0,0,0.4)' }}
    >
      <div
        className="absolute inset-0 flex items-center px-3 gap-2"
        style={{
          background: `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)`,
          borderLeft: `3px solid ${cfg.indicatorColor}`,
        }}
      >
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full shadow-sm"
            style={{ background: cfg.indicatorColor, boxShadow: `0 0 5px ${cfg.indicatorColor}` }}
          />
          {item.equipment.ru >= 2 && (
            <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-xs leading-tight truncate drop-shadow">{item.equipment.name}</p>
          {item.equipment.model && item.equipment.ru >= 2 && (
            <p className="text-white/60 text-xs leading-tight truncate">{item.equipment.model}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          <span className="text-xs font-mono text-white/50">{item.equipment.ru}U</span>
          {item.equipment.wattage ? (
            <span className="text-xs font-mono text-white/40">{item.equipment.wattage}W</span>
          ) : null}
        </div>
        <Icon className="h-4 w-4 text-white/30 flex-shrink-0" />
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(rackId, item.instanceId); }}
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
  activeSide,
  onRemove,
  onMove,
}: {
  ruNum: number;
  isOccupied: boolean;
  onDrop: (item: EquipmentItem) => void;
  item?: RackItem;
  rackId: number;
  activeSide: RackSide;
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
      className="relative flex-shrink-0 flex items-center"
      style={{
        height: RU_HEIGHT,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: isOver && canDrop ? 'rgba(99,102,241,0.15)' : undefined,
      }}
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 border-2 border-indigo-400/60 pointer-events-none z-10" />
      )}
      {item && (
        <div className="absolute inset-0 z-20">
          <EquipmentBlock rackId={rackId} item={item} activeSide={activeSide} onRemove={onRemove} onMove={onMove} />
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
  activeSide,
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
  activeSide: RackSide;
  onDrop: (rackId: number, item: EquipmentItem, targetRu: number, side: RackSide) => void;
  onMove: (rackId: number, item: RackItem, newRu: number) => void;
  onRemove: (rackId: number, instanceId: string) => void;
  onDelete: (rackId: number) => void;
  onRename: (rackId: number, name: string) => void;
  onResize: (rackId: number, ru: number) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const enclosureRef = useRef<HTMLDivElement>(null);

  const sideItems = items.filter(i => i.side === activeSide);
  const usedRu = sideItems.reduce((sum, i) => sum + i.equipment.ru, 0);
  const freeRu = ru - usedRu;
  const totalPower = sideItems.reduce((sum, i) => sum + (i.equipment.wattage ?? 0), 0);

  const itemByTopRu = new Map<number, RackItem>();
  sideItems.forEach(item => { itemByTopRu.set(item.ru, item); });

  const occupiedRus = new Set<number>();
  sideItems.forEach(item => {
    for (let i = 0; i < item.equipment.ru; i++) {
      occupiedRus.add(item.ru - i);
    }
  });

  const cfg = SIDE_CONFIG[activeSide];

  const [, dropRef] = useDrop(() => ({
    accept: ['equipment', 'rack-item'],
    drop: (dragged: (EquipmentItem | RackItem) & { rackId?: number; side?: RackSide }, monitor) => {
      if (monitor.didDrop()) return;
      const offset = monitor.getClientOffset();
      const el = document.getElementById(`rack-body-${id}-${activeSide}`);
      if (!el || !offset) return;
      const rect = el.getBoundingClientRect();
      const relY = offset.y - rect.top;
      const fromTop = Math.floor(relY / RU_HEIGHT);
      const targetRu = ru - fromTop;
      const itemHeight = 'equipment' in dragged ? dragged.equipment.ru : dragged.ru;
      const clamped = Math.max(1, Math.min(ru - itemHeight + 1, targetRu));
      if ('instanceId' in dragged) {
        if (dragged.rackId !== id) {
          onRemove(dragged.rackId!, dragged.instanceId);
          onDrop(id, dragged.equipment, clamped, activeSide);
        } else {
          onMove(id, dragged, clamped);
        }
      } else {
        onDrop(id, dragged, clamped, activeSide);
      }
    },
  }), [id, ru, activeSide, onDrop, onMove, onRemove]);

  const commitName = () => {
    setEditingName(false);
    if (nameValue.trim()) onRename(id, nameValue.trim());
    else setNameValue(name);
  };

  const downloadPng = async () => {
    if (!enclosureRef.current) return;
    try {
      const dataUrl = await toPng(enclosureRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement('a');
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-${activeSide}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col" style={{ width: 340 }}>
      {/* Rack header */}
      <div className="mb-2">
        <div className="flex items-center justify-between gap-1 mb-1">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setEditingName(false); setNameValue(name); }
              }}
              className="flex-1 bg-transparent border-b border-primary text-sm font-semibold outline-none"
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
          <button onClick={downloadPng} className="text-muted-foreground hover:text-foreground transition-colors" title="Download PNG">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete rack">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><span className="font-mono text-foreground">{usedRu}</span>/{ru}U used</span>
          <span className="text-muted-foreground/40">|</span>
          <span className={cn('font-mono', freeRu === 0 ? 'text-destructive' : 'text-emerald-500')}>{freeRu}U free</span>
          {totalPower > 0 && (
            <><span className="text-muted-foreground/40">|</span><span className="font-mono text-amber-500">{totalPower}W</span></>
          )}
          <select
            value={ru}
            onChange={e => onResize(id, Number(e.target.value))}
            className="ml-auto text-xs bg-transparent border border-border rounded px-1 py-0 h-5 cursor-pointer"
          >
            {[8, 12, 16, 20, 24, 32, 42].map(n => <option key={n} value={n}>{n}U</option>)}
          </select>
        </div>
      </div>

      {/* Rack enclosure */}
      <div
        ref={enclosureRef}
        className="rounded-sm overflow-hidden shadow-xl"
        style={{
          border: `2px solid ${cfg.borderColor}`,
          background: cfg.enclosureBg,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top cap with side label */}
        <div
          className="h-5 flex items-center justify-between px-2"
          style={{ background: cfg.railBg, borderBottom: `1px solid ${cfg.borderColor}50` }}
        >
          <div className="flex gap-1">
            <div className="w-6 h-1.5 rounded-sm" style={{ background: `${cfg.borderColor}80` }} />
            <div className="w-3 h-1.5 rounded-sm" style={{ background: `${cfg.borderColor}50` }} />
          </div>
          <span className="text-xs font-bold font-mono tracking-widest" style={{ color: cfg.labelColor }}>
            {cfg.label}
          </span>
          <div className="w-2 h-2 rounded-full" style={{ background: cfg.indicatorColor, boxShadow: `0 0 4px ${cfg.indicatorColor}` }} />
        </div>

        {/* Body */}
        <div className="flex">
          {/* RU numbers */}
          <div className="w-6 flex-shrink-0 flex flex-col" style={{ background: cfg.enclosureBg }}>
            {Array.from({ length: ru }, (_, i) => ru - i).map(ruNum => (
              <div
                key={ruNum}
                className="flex items-center justify-center font-mono flex-shrink-0"
                style={{ height: RU_HEIGHT, fontSize: 9, color: `${cfg.borderColor}99`, borderBottom: `1px solid ${cfg.borderColor}20` }}
              >
                {ruNum}
              </div>
            ))}
          </div>

          {/* Left rail */}
          <RailColumn totalRu={ru} side={activeSide} />

          {/* Equipment area */}
          <div
            id={`rack-body-${id}-${activeSide}`}
            ref={dropRef}
            className="flex-1 relative"
            style={{ background: cfg.bodyBg }}
          >
            {Array.from({ length: ru }, (_, i) => ru - i).map(ruNum => {
              const topItem = itemByTopRu.get(ruNum);
              return (
                <RackSlot
                  key={ruNum}
                  ruNum={ruNum}
                  isOccupied={occupiedRus.has(ruNum)}
                  onDrop={item => onDrop(id, item, ruNum, activeSide)}
                  item={topItem}
                  rackId={id}
                  activeSide={activeSide}
                  onRemove={onRemove}
                  onMove={onMove}
                />
              );
            })}
          </div>

          {/* Right rail */}
          <RailColumn totalRu={ru} side={activeSide} />
        </div>

        {/* Bottom cap */}
        <div className="h-3" style={{ background: cfg.railBg, borderTop: `1px solid ${cfg.borderColor}50` }} />
      </div>
    </div>
  );
}
