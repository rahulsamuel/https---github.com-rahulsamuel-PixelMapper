import { getProcessors } from '@/services/supabase';
import { ProcessorAdmin } from '@/components/admin/processor-admin';

export default async function ProcessorsAdminPage() {
  const { data: processors, error } = await getProcessors(true);
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">Error loading processors: {error}</p>
      </div>
    );
  }
  return <ProcessorAdmin processors={processors} />;
}
