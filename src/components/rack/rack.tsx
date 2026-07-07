'use client';

import { useDrop, useDrag } from 'react-dnd';
import type { EquipmentItem, RackItem, RackSide } from '@/lib/rack-data';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Trash2, Server, Zap, Network, Package, Tv, HelpCircle, Download, Pencil, Check, X } from 'lucide-react';
import { downloadRackPng } from '@/lib/rack-download';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RU_HEIGHT = 32;

const TYPE_ICONS: Record<string, React.ElementType> = {
  processor: Server,
  power: Zap,
  network: Network,
  utility: Package,
  media: Tv,
  other: HelpCircle,
};

const SIDE_CONFIG = {
  front: {
    borderColor: '#52525b',
    railBg: '#27272a',
    bodyBg: '#09090b',
    enclosureBg: '#18181b',
    label: 'FRONT',
    labelColor: '#6ee7b7',
    indicatorColor: '#34d399',
  },
  rear: {
    borderColor: '#b45309',
    railBg: '#3b1f00',
    bodyBg: '#1c0f00',
    enclosureBg: '#271500',
    label: 'REAR',
    labelColor: '#fcd34d',
    indicatorColor: '#fbbf24',
  },
};

function ScrewHole({ side }: { side: RackSide }) {
  const isRear = side === 'rear';
  return (
    <div
      className="w-3 h-3 rounded-full flex items-center justify-center"
      style={{
        border: `1px solid ${isRear ? '#78350f' : '#3f3f46'}`,
        background: isRear ? '#451a03' : '#27272a',
      }}
    >
      <div className="w-1 h-1 rounded-full" style={{ background: isRear ? '#78350f' : '#52525b' }} />
    </div>
  );
}

function RailColumn({ totalRu, side }: { totalRu: number; side: RackSide }) {
  const cfg = SIDE_CONFIG[side];
  return (
    <div
      className="w-7 flex-shrink-0 flex flex-col"
      style={{
        background: cfg.railBg,
        borderLeft: `1px solid ${cfg.borderColor}30`,
        borderRight: `1px solid ${cfg.borderColor}30`,
      }}
    >
      {Array.from({ length: totalRu }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-evenly flex-shrink-0"
          style={{ height: RU_HEIGHT, borderBottom: `1px solid ${cfg.borderColor}20` }}
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
      if (
        !ref.current ||
        draggedItem.instanceId === item.instanceId ||
        draggedItem.rackId !== rackId ||
        draggedItem.side !== item.side
      ) return;
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
        border: '1px solid rgba(0,0,0,0.35)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
      className="group shadow-md"
    >
      <div
        className="absolute inset-0 flex items-center px-3 gap-2"
        style={{
          background: `linear-gradient(135deg, ${item.equipment.color}ee 0%, ${item.equipment.color}99 100%)`,
          borderLeft: `3px solid ${cfg.indicatorColor}`,
        }}
      >
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: cfg.indicatorColor, boxShadow: `0 0 5px ${cfg.indicatorColor}` }}
          />
          {item.equipment.ru >= 2 && <div className="w-1.5 h-1.5 rounded-full bg-white/15" />}
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
            <span className="text-xs font-mono text-white/35">{item.equipment.wattage}W</span>
          ) : null}
        </div>
        <Icon className="h-4 w-4 text-white/25 flex-shrink-0" />
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
      className="relative flex-shrink-0"
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
  onResize: (rackId: number, ru: number, force?: boolean) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [pendingResize, setPendingResize] = useState<number | null>(null);

  const cfg = SIDE_CONFIG[activeSide];
  const otherSide: RackSide = activeSide === 'front' ? 'rear' : 'front';
  const otherCfg = SIDE_CONFIG[otherSide];
  const sideItems = items.filter(i => i.side === activeSide);
  const otherSideItems = items.filter(i => i.side === otherSide);
  const usedRu = sideItems.reduce((sum, i) => sum + i.equipment.ru, 0);
  const freeRu = ru - usedRu;
  const totalPower = sideItems.reduce((sum, i) => sum + (i.equipment.wattage ?? 0), 0);

  // Items that would be displaced on both sides if we resize to pendingResize
  const displacedItems = pendingResize != null
    ? items.filter(item => item.ru > pendingResize)
    : [];

  const itemByTopRu = new Map<number, RackItem>();
  sideItems.forEach(item => { itemByTopRu.set(item.ru, item); });

  const occupiedRus = new Set<number>();
  sideItems.forEach(item => {
    for (let i = 0; i < item.equipment.ru; i++) {
      occupiedRus.add(item.ru - i);
    }
  });

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

  const cancelName = () => {
    setEditingName(false);
    setNameValue(name);
  };

  const handleResizeChange = (newRu: number) => {
    const wouldDisplace = items.filter(i => i.ru > newRu);
    if (wouldDisplace.length > 0) {
      setPendingResize(newRu);
    } else {
      onResize(id, newRu);
    }
  };

  const handleDownload = () => {
    downloadRackPng(name, ru, items);
  };

  return (
    <div className="flex-shrink-0 flex flex-col" style={{ width: 340 }}>
      {/* Resize confirmation dialog */}
      <AlertDialog open={pendingResize !== null} onOpenChange={open => !open && setPendingResize(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resize rack to {pendingResize}U?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>The following equipment will be removed because it no longer fits:</p>
                <ul className="mt-2 space-y-1">
                  {displacedItems.map(item => (
                    <li key={item.instanceId} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.equipment.color }} />
                      <span className="font-medium">{item.equipment.name}</span>
                      <span className="text-muted-foreground">({item.side} · {item.equipment.ru}U at position {item.ru})</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-2">Equipment that still fits will be kept.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingResize(null)}>Keep current size</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingResize !== null) onResize(id, pendingResize, true);
                setPendingResize(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Resize &amp; remove {displacedItems.length} item{displacedItems.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rack header */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1">
          {editingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') cancelName();
                }}
                className="flex-1 bg-transparent border-b border-primary text-sm font-semibold outline-none"
              />
              <button onClick={commitName} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={cancelName} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 group/name min-w-0">
              <span className="text-sm font-semibold truncate">{name}</span>
              <button
                onClick={() => setEditingName(true)}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-primary flex-shrink-0"
                title="Rename rack"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
          <button onClick={handleDownload} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-auto" title="Download rack as PNG">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" title="Delete rack">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span><span className="font-mono text-foreground">{usedRu}</span>/{ru}U used</span>
          <span className="text-muted-foreground/40">·</span>
          <span className={cn('font-mono', freeRu === 0 ? 'text-destructive' : 'text-emerald-500')}>{freeRu}U free</span>
          {totalPower > 0 && (
            <><span className="text-muted-foreground/40">·</span><span className="font-mono text-amber-500">{totalPower}W</span></>
          )}
          <select
            value={ru}
            onChange={e => handleResizeChange(Number(e.target.value))}
            className="ml-auto text-xs bg-transparent border border-border rounded px-1 py-0 h-5 cursor-pointer"
          >
            {[8, 12, 16, 20, 24, 32, 42].map(n => <option key={n} value={n}>{n}U</option>)}
          </select>
        </div>
      </div>

      {/* Rack enclosure */}
      <div
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono tracking-widest" style={{ color: cfg.labelColor }}>
              {cfg.label}
            </span>
            {otherSideItems.length > 0 && (
              <span
                className="text-xs font-bold px-1 rounded"
                style={{
                  fontSize: 8,
                  background: `${otherCfg.indicatorColor}30`,
                  color: otherCfg.indicatorColor,
                  border: `1px dashed ${otherCfg.indicatorColor}60`,
                }}
                title={`${otherSideItems.length} item${otherSideItems.length !== 1 ? 's' : ''} on ${otherSide} side`}
              >
                {otherSideItems.length} {otherSide.toUpperCase()[0]}
              </span>
            )}
          </div>
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

          <RailColumn totalRu={ru} side={activeSide} />

          <div
            id={`rack-body-${id}-${activeSide}`}
            ref={dropRef}
            className="flex-1 relative"
            style={{ background: cfg.bodyBg }}
          >
            {/* Ghost items from the other side — non-interactive, faded */}
            {otherSideItems.map(ghost => {
              const fromTop = ru - ghost.ru;
              if (fromTop < 0 || fromTop >= ru) return null;
              return (
                <div
                  key={ghost.instanceId}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: fromTop * RU_HEIGHT,
                    height: ghost.equipment.ru * RU_HEIGHT,
                    zIndex: 5,
                    opacity: 0.28,
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center px-2 gap-1.5 overflow-hidden rounded-sm"
                    style={{
                      background: `${ghost.equipment.color}35`,
                      border: `1px dashed ${otherCfg.indicatorColor}80`,
                      borderLeft: `2px dashed ${otherCfg.indicatorColor}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs leading-tight truncate"
                        style={{ fontSize: 10 }}>
                        {ghost.equipment.name}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 font-bold rounded px-0.5"
                      style={{
                        fontSize: 8,
                        background: otherCfg.indicatorColor,
                        color: '#000',
                        lineHeight: '14px',
                      }}
                    >
                      {otherSide.toUpperCase()[0]}
                    </span>
                  </div>
                </div>
              );
            })}

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

          <RailColumn totalRu={ru} side={activeSide} />
        </div>

        <div className="h-3" style={{ background: cfg.railBg, borderTop: `1px solid ${cfg.borderColor}50` }} />
      </div>
    </div>
  );
}
