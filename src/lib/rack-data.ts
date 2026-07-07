
export type EquipmentType = 'processor' | 'power' | 'network' | 'utility' | 'media' | 'other';
export type MountableAt = 'front' | 'rear' | 'both';
export type RackSide = 'front' | 'rear';

export interface EquipmentItem {
  id: string;
  name: string;
  model?: string | null;
  ru: number;
  type: EquipmentType;
  color: string;
  wattage?: number | null;
  mountableAt?: MountableAt;
}

export interface RackItem {
  instanceId: string;
  equipment: EquipmentItem;
  ru: number;         // Top-most RU this item occupies (1-indexed from bottom)
  side: RackSide;     // Which physical side of the rack this is mounted on
  customName?: string; // User-defined label (overrides equipment.name for display)
}

export const EQUIPMENT_TYPE_COLORS: Record<EquipmentType, string> = {
  processor: '#3b82f6',
  power: '#f59e0b',
  network: '#10b981',
  utility: '#64748b',
  media: '#8b5cf6',
  other: '#71717a',
};

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  processor: 'Processor',
  power: 'Power',
  network: 'Network',
  utility: 'Utility',
  media: 'Media',
  other: 'Other',
};

// Fallback static library used when DB load fails or is empty
export const defaultEquipmentLibrary: EquipmentItem[] = [
  { id: 'brompton-s8',       name: 'Brompton S8',     model: 'S8 Processor',          ru: 4, type: 'processor', color: EQUIPMENT_TYPE_COLORS.processor, wattage: 200, mountableAt: 'front' },
  { id: 'brompton-t1',       name: 'Brompton T1',     model: 'T1 Processor',           ru: 2, type: 'processor', color: EQUIPMENT_TYPE_COLORS.processor, wattage: 120, mountableAt: 'front' },
  { id: 'novastar-vx1000',   name: 'Novastar VX1000', model: 'VX1000 Processor',      ru: 2, type: 'processor', color: EQUIPMENT_TYPE_COLORS.processor, wattage: 150, mountableAt: 'front' },
  { id: 'pdu-1u',            name: 'PDU 1U',          model: 'Power Distribution',     ru: 1, type: 'power',     color: EQUIPMENT_TYPE_COLORS.power,     wattage: 0,   mountableAt: 'both'  },
  { id: 'network-switch-1u', name: 'Network Switch',  model: '1U 24-Port Switch',     ru: 1, type: 'network',   color: EQUIPMENT_TYPE_COLORS.network,   wattage: 30,  mountableAt: 'front' },
  { id: 'patch-panel-1u',    name: 'Patch Panel',     model: '1U 24-Port Cat6',       ru: 1, type: 'network',   color: EQUIPMENT_TYPE_COLORS.network,   wattage: 0,   mountableAt: 'rear'  },
  { id: 'media-server-2u',   name: 'Media Server',    model: '2U Rack Server',        ru: 2, type: 'media',     color: EQUIPMENT_TYPE_COLORS.media,     wattage: 350, mountableAt: 'front' },
  { id: 'blank-1u',          name: 'Blank Panel 1U',  model: '1U Filler',             ru: 1, type: 'utility',   color: EQUIPMENT_TYPE_COLORS.utility,   wattage: 0,   mountableAt: 'both'  },
  { id: 'cable-manager-1u',  name: 'Cable Manager',   model: '1U Horizontal Manager', ru: 1, type: 'utility',   color: EQUIPMENT_TYPE_COLORS.utility,   wattage: 0,   mountableAt: 'both'  },
];
