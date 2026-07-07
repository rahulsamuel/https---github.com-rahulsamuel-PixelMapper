import { getRackEquipmentLibrary } from '@/services/supabase';
import { RackEquipmentAdmin } from '@/components/admin/rack-equipment-admin';

export default async function RackEquipmentPage() {
  const { data: equipment, error } = await getRackEquipmentLibrary(true);

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">Error loading equipment: {error}</p>
      </div>
    );
  }

  return <RackEquipmentAdmin equipment={equipment} />;
}
