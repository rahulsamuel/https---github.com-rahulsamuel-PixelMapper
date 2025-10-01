
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { updateProductAction, type FormState } from '@/app/admin/products/[id]/edit/actions';
import { Checkbox } from '../ui/checkbox';

const formSchema = z.object({
  manufacturer: z.string().min(2, { message: "Manufacturer name must be at least 2 characters." }),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  
  tileWidthPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileWidthMm: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightMm: z.coerce.number().min(1, { message: "Must be at least 1." }),

  tileWeightKg: z.coerce.number().min(0.1, { message: "Must be positive." }),

  maxPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),
  avgPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),

  maxBrightness: z.coerce.number().min(1, { message: "Must be positive." }),
  refreshRate: z.coerce.number().min(1, { message: "Must be positive." }),

  applicationIndoor: z.boolean().default(false),
  applicationOutdoor: z.boolean().default(false),
  applicationFloor: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const initialState: FormState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Updating Product...' : 'Update Product'}
        </Button>
    );
}

const FormSection = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
    </div>
);


export function EditProductForm({ product }: { product: any }) {
  const updateProductActionWithId = updateProductAction.bind(null, product.id);
  const [state, formAction] = useActionState(updateProductActionWithId, initialState);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      manufacturer: product.manufacturer || '',
      productName: product.productName || '',
      tileWidthPx: product.tileWidthPx || 128,
      tileHeightPx: product.tileHeightPx || 128,
      tileWidthMm: product.tileWidthMm || 500,
      tileHeightMm: product.tileHeightMm || 500,
      tileWeightKg: product.tileWeightKg || 8.5,
      maxPowerConsumption: product.maxPowerConsumption || 180,
      avgPowerConsumption: product.avgPowerConsumption || 60,
      maxBrightness: product.maxBrightness || 1200,
      refreshRate: product.refreshRate || 3840,
      applicationIndoor: product.applicationIndoor || false,
      applicationOutdoor: product.applicationOutdoor || false,
      applicationFloor: product.applicationFloor || false,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
        });
      } else if (state.errors) {
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
        for (const error of state.errors) {
            form.setError(error.path[0] as keyof FormData, {
                type: 'manual',
                message: error.message,
            });
        }
      } else {
         toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast, form]);

  return (
    <Form {...form}>
        <form 
            action={formAction} 
            className="space-y-8"
        >
            <FormSection title="Basic Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="manufacturer" render={({ field }) => (
                        <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input placeholder="e.g. ROE" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="productName" render={({ field }) => (
                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g. Black Pearl 2.8" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </FormSection>

            <Separator />

            <FormSection title="Tile Dimensions" description="Physical and pixel dimensions of a single LED tile.">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <FormField control={form.control} name="tileWidthPx" render={({ field }) => (
                        <FormItem><FormLabel>Width (pixels)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="tileHeightPx" render={({ field }) => (
                        <FormItem><FormLabel>Height (pixels)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="tileWidthMm" render={({ field }) => (
                        <FormItem><FormLabel>Width (mm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="tileHeightMm" render={({ field }) => (
                        <FormItem><FormLabel>Height (mm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </FormSection>

            <Separator />
            
            <FormSection title="Tile Weight">
                 <FormField control={form.control} name="tileWeightKg" render={({ field }) => (
                    <FormItem><FormLabel>Weight per Tile (kg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </FormSection>

            <Separator />

            <FormSection title="Power Consumption" description="Power draw for a single tile.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="maxPowerConsumption" render={({ field }) => (
                        <FormItem><FormLabel>Max Power (Watts)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="avgPowerConsumption" render={({ field }) => (
                        <FormItem><FormLabel>Average Power (Watts)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </FormSection>
            
            <Separator />
            
            <FormSection title="Display Properties">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="maxBrightness" render={({ field }) => (
                        <FormItem><FormLabel>Max Brightness (nits)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="refreshRate" render={({ field }) => (
                        <FormItem><FormLabel>Refresh Rate (Hz)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </FormSection>

            <Separator />

            <FormSection title="Application Type" description="Select all that apply.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="applicationIndoor"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Indoor</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="applicationOutdoor"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Outdoor</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="applicationFloor"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Floor</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
            </FormSection>

            <SubmitButton />
        </form>
    </Form>
  );
}
