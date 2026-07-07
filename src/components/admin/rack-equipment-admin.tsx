'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RackEquipment, RackEquipmentType, MountableAt } from '@/services/supabase';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<RackEquipmentType, string> = {
  processor: 'Processor',
  power: 'Power',
  network: 'Network',
  utility: 'Utility',
  media: 'Media',
  other: 'Other',
};

const MOUNTABLE_LABELS: Record<MountableAt, string> = {
  front: 'Front only',
  rear: 'Rear only',
  both: 'Front & Rear',
};

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  model: z.string().optional(),
  ru: z.coerce.number().min(1).max(42),
  type: z.enum(['processor', 'power', 'network', 'utility', 'media', 'other']),
  color: z.string().min(4, 'Color required'),
  wattage: z.coerce.number().min(0).optional(),
  mountableAt: z.enum(['front', 'rear', 'both']),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_COLORS: Record<RackEquipmentType, string> = {
  processor: '#3b82f6',
  power: '#f59e0b',
  network: '#10b981',
  utility: '#64748b',
  media: '#8b5cf6',
  other: '#71717a',
};

// Keyed by editTarget.id (or 'new') so useForm fully remounts for each edit target
function EquipmentForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: {
  defaultValues: FormValues;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedType = watch('type');
  const selectedMountableAt = watch('mountableAt');
  const selectedIsActive = watch('isActive');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Display Name *</Label>
          <Input {...register('name')} placeholder="e.g. Brompton S8" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Model / Description</Label>
          <Input {...register('model')} placeholder="e.g. S8 Processor" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type *</Label>
          <Select
            value={selectedType}
            onValueChange={v => {
              setValue('type', v as RackEquipmentType);
              setValue('color', TYPE_COLORS[v as RackEquipmentType]);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rack Units (U) *</Label>
          <Input {...register('ru')} type="number" min={1} max={42} />
          {errors.ru && <p className="text-xs text-destructive">{errors.ru.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              {...register('color')}
              className="w-10 h-9 rounded border border-input cursor-pointer p-0.5"
            />
            <Input {...register('color')} placeholder="#3b82f6" className="flex-1" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Wattage (W)</Label>
          <Input {...register('wattage')} type="number" min={0} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mount Position</Label>
          <Select
            value={selectedMountableAt}
            onValueChange={v => setValue('mountableAt', v as MountableAt)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Front only</SelectItem>
              <SelectItem value="rear">Rear only</SelectItem>
              <SelectItem value="both">Front & Rear</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select
            value={selectedIsActive ? 'true' : 'false'}
            onValueChange={v => setValue('isActive', v === 'true')}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

export function RackEquipmentAdmin({ equipment: initial }: { equipment: RackEquipment[] }) {
  const [equipment, setEquipment] = useState(initial);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<RackEquipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setDialogMode('add'); setError(null); };
  const openEdit = (item: RackEquipment) => { setEditTarget(item); setDialogMode('edit'); setError(null); };
  const closeDialog = () => { setDialogMode(null); setEditTarget(null); };

  const getDefaultValues = (item?: RackEquipment | null): FormValues => ({
    name: item?.name ?? '',
    model: item?.model ?? '',
    ru: item?.ru ?? 1,
    type: item?.type ?? 'other',
    color: item?.color ?? '#71717a',
    wattage: item?.wattage ?? 0,
    mountableAt: item?.mountableAt ?? 'both',
    isActive: item?.isActive ?? true,
  });

  const handleSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        model: data.model || null,
        ru: data.ru,
        type: data.type,
        color: data.color,
        wattage: data.wattage ?? null,
        mountable_at: data.mountableAt,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      };

      if (dialogMode === 'add') {
        const { data: inserted, error: err } = await supabase
          .from('rack_equipment_library')
          .insert(payload)
          .select()
          .single();

        if (err) { setError(err.message); return; }
        setEquipment(prev => [...prev, {
          id: inserted.id,
          name: inserted.name,
          model: inserted.model,
          ru: inserted.ru,
          type: inserted.type as RackEquipmentType,
          color: inserted.color,
          wattage: inserted.wattage,
          mountableAt: inserted.mountable_at as MountableAt,
          isActive: inserted.is_active,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        }]);
      } else if (editTarget) {
        const { error: err } = await supabase
          .from('rack_equipment_library')
          .update(payload)
          .eq('id', editTarget.id);

        if (err) { setError(err.message); return; }
        setEquipment(prev => prev.map(e =>
          e.id === editTarget.id
            ? { ...e, ...data, mountableAt: data.mountableAt, isActive: data.isActive, model: data.model || null }
            : e
        ));
      }
      closeDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('rack_equipment_library').delete().eq('id', id);
    if (!err) setEquipment(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Rack Equipment Library
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage equipment available in the Rack Drawing tool.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">U</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead>Mounts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map(item => (
              <TableRow key={item.id} className={cn(!item.isActive && 'opacity-50')}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.model && <p className="text-xs text-muted-foreground">{item.model}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell><span className="text-xs">{TYPE_LABELS[item.type]}</span></TableCell>
                <TableCell className="text-center font-mono text-sm">{item.ru}U</TableCell>
                <TableCell className="text-center font-mono text-sm">{item.wattage ?? 0}W</TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{MOUNTABLE_LABELS[item.mountableAt]}</span></TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes it from the library. Existing rack layouts are not affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {equipment.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No equipment yet. Click "Add Equipment" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add Equipment' : 'Edit Equipment'}</DialogTitle>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
          )}
          {/* key forces full remount when switching between add / different edit targets */}
          <EquipmentForm
            key={editTarget?.id ?? 'new'}
            defaultValues={getDefaultValues(editTarget)}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
