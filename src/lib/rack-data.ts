
export interface EquipmentItem {
  id: string;
  name: string;
  ru: number;
  type: 'processor' | 'power' | 'network' | 'utility' | 'other';
  image: {
    front: string;
    back: string;
  }
}

export interface RackItem {
  instanceId: string;
  equipment: EquipmentItem;
  ru: number; // The top-most RU the item occupies
}
