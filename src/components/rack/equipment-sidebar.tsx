'use client';

import { useDrag } from 'react-dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { EquipmentItem, EquipmentType, RackSide } from '@/lib/rack-data';
import { EQUIPMENT_TYPE_LABELS } from '@/lib/rack-data';
import { Search, GripVertical } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const TYPE_ORDER: EquipmentType[] = ['processor', 'media', 'network', 'power', 'utility', 'other'];

function mountLabel(mountableAt: string | undefined, side: RackSide): string {
  if (!mountableAt || mountableAt === 'both') return '';
  if (mountableAt === side) return '';
  return mountableAt === 'front' ? 'Front only' : 'Rear only';
}

function canMount(mountableAt: string | undefined, side: RackSide): boolean {
  if (!mountableAt || mountableAt === 'both') return true;
  return mountableAt === side;
}

function DraggableEquipment({ item, activeSide }: { item: EquipmentItem; activeSide: RackSide }) {
  const allowed = canMount(item.mountableAt, activeSide);
  const notAllowedLabel = mountLabel(item.mountableAt, activeSide);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'equipment',
    item: item,
    canDrag: () => allowed,
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, allowed]);

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md border bg-card transition-all',
        allowed
          ? 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-accent/30'
          : 'cursor-not-allowed opacity-40',
        isDragging && 'opacity-30 scale-95',
      )}
      title={notAllowedLabel ? `This item is ${notAllowedLabel.toLowerCase()} — switch view to place it` : undefined}
    >
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs leading-tight truncate">{item.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-xs text-muted-foreground leading-tight">{item.ru}U</p>
          {notAllowedLabel && (
            <span className="text-xs text-amber-500/80 leading-tight">{notAllowedLabel}</span>
          )}
        </div>
      </div>
      {allowed && (
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
      )}
    </div>
  );
}

export function EquipmentSidebar({
  equipment,
  activeSide,
}: {
  equipment: EquipmentItem[];
  activeSide: RackSide;
}) {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<EquipmentType | 'all'>('all');

  const filtered = useMemo(() => {
    return equipment.filter(item => {
      const matchesSearch =
        search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.model?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesType = activeType === 'all' || item.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [equipment, search, activeType]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<EquipmentType, EquipmentItem[]>> = {};
    for (const item of filtered) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    }
    return groups;
  }, [filtered]);

  const types = useMemo(
    () => [...new Set(equipment.map(e => e.type))],
    [equipment],
  );

  const sideLabel = activeSide === 'front' ? 'Front' : 'Rear';
  const sideColor = activeSide === 'front' ? '#6ee7b7' : '#fcd34d';

  return (
    <aside className="w-72 border-r bg-sidebar flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
        <div>
          <h2 className="font-semibold text-sm">Equipment Library</h2>
          <p className="text-xs mt-0.5" style={{ color: sideColor }}>
            Dragging to <strong>{sideLabel} View</strong>
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveType('all')}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
              activeType === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            All
          </button>
          {types
            .sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b))
            .map(type => {
              const col = equipment.find(e => e.type === type)?.color;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(activeType === type ? 'all' : type)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                    activeType === type ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                  style={activeType === type ? { backgroundColor: col } : {}}
                >
                  {EQUIPMENT_TYPE_LABELS[type]}
                </button>
              );
            })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {TYPE_ORDER.filter(t => grouped[t]?.length).map(type => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: equipment.find(e => e.type === type)?.color }}
                />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {EQUIPMENT_TYPE_LABELS[type]}
                </span>
              </div>
              <div className="space-y-1">
                {grouped[type]!.map(item => (
                  <DraggableEquipment key={item.id} item={item} activeSide={activeSide} />
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No equipment matches your search.
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-3 border-t">
        <div className="rounded-md bg-muted/40 p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Custom Equipment</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Add via Admin → Rack Equipment</p>
        </div>
      </div>
    </aside>
  );
}
