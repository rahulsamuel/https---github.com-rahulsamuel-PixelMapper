import { getRackEquipmentLibrary } from '@/services/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await getRackEquipmentLibrary(false);
  if (error) return NextResponse.json([], { status: 500 });
  // Map to EquipmentItem shape used by the rack builder
  const mapped = data.map(item => ({
    id: item.id,
    name: item.name,
    model: item.model,
    ru: item.ru,
    type: item.type,
    color: item.color,
    wattage: item.wattage,
    mountableAt: item.mountableAt,
  }));
  return NextResponse.json(mapped);
}
