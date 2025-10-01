
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { addProductAction, type FormState } from '@/app/add-led/actions';
import { Checkbox } from '../ui/checkbox';

const formSchema = z.object({
  manufacturer: z.string().min(2, { message: "Manufacturer name must be at least 2 characters." }),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  
  // Dimensions
  tileWidthPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileWidthMm: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightMm: z.coerce.number().min(1, { message: "Must be at least 1." }),

  // Weight
  tileWeightKg: z.coerce.number().min(0.1, { message: "Must be positive." }),

  // Power
  maxPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),
  avgPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),

  // Display
  maxBrightness: z.coerce.number().min(1, { message: "Must be positive." }),
  refreshRate: z.coerce.number().min(1, { message: "Must be positive." }),

  // Application
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
            {pending ? 'Adding Product...' : 'Add Product to Database'}
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


export function LedProductForm() {
  const [state, formAction] = useActionState(addProductAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      manufacturer: '',
      productName: '',
      tileWidthPx: 128,
      tileHeightPx: 128,
      tileWidthMm: 500,
      tileHeightMm: 500,
      tileWeightKg: 8.5,
      maxPowerConsumption: 180,
      avgPowerConsumption: 60,
      maxBrightness: 1200,
      refreshRate: 3840,
      applicationIndoor: false,
      applicationOutdoor: false,
      applicationFloor: false,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        form.reset();
        // formRef.current?.reset(); // This is not needed with react-hook-form and server actions
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

  const onFormSubmit = (data: FormData) => {
    const formData = new FormData();
    for (const key in data) {
        // @ts-ignore
        formData.append(key, String(data[key]));
    }
    formAction(formData);
  };

  return (
    <Form {...form}>
        <form 
            ref={formRef}
            action={formAction}
            onSubmit={form.handleSubmit(onFormSubmit)}
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
