
'use client';

import { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    [key: string]: any;
}

interface FormState {
    projectName: string;
    selectedProductId: string | null;
    voltage: '110v' | '208v' | '230v';
    phase: 'single-phase' | 'three-phase';
    screenWidthTiles: number;
    screenHeightTiles: number;
}

interface CalculatorFormProps {
    products: LedProduct[];
    formState: FormState;
    onFormChange: (field: keyof FormState, value: any) => void;
    selectedProduct: LedProduct | null;
}

export function CalculatorForm({ products, formState, onFormChange, selectedProduct }: CalculatorFormProps) {
  
  const manufacturers = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.manufacturer))];
  }, [products]);

  const selectedManufacturer = useMemo(() => {
    return selectedProduct?.manufacturer ?? '';
  }, [selectedProduct]);

  const availableProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.manufacturer === selectedManufacturer);
  }, [products, selectedManufacturer]);

  const handleManufacturerChange = (value: string) => {
    const firstProductOfNewManufacturer = products.find(p => p.manufacturer === value);
    if (firstProductOfNewManufacturer) {
        onFormChange('selectedProductId', firstProductOfNewManufacturer.id);
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name</Label>
        <Input 
          id="project-name" 
          value={formState.projectName}
          onChange={(e) => onFormChange('projectName', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="led-manufacturer">LED Manufacturer</Label>
          <Select onValueChange={handleManufacturerChange} value={selectedManufacturer}>
            <SelectTrigger id="led-manufacturer">
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="led-product">LED Product</Label>
          <Select 
            onValueChange={(value) => onFormChange('selectedProductId', value)} 
            value={formState.selectedProductId ?? ''}
            disabled={!selectedManufacturer}
          >
            <SelectTrigger id="led-product">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
               {availableProducts.map(p => (
                 <SelectItem key={p.id} value={p.id}>{p.productName}</SelectItem>
               ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedProduct && (
        <div className="p-3 rounded-md bg-muted/50 border text-sm text-center text-muted-foreground">
          Tile Resolution: <span className="font-semibold text-foreground">{selectedProduct.tileWidthPx}px</span> x <span className="font-semibold text-foreground">{selectedProduct.tileHeightPx}px</span>
        </div>
      )}

      <div className="space-y-3">
        <Label>Operating Voltage</Label>
        <RadioGroup 
          value={formState.voltage} 
          onValueChange={(v) => onFormChange('voltage', v)} 
          className="grid grid-cols-3 gap-2"
        >
            <div>
                <RadioGroupItem value="110v" id="110v" className="peer sr-only" />
                <Label htmlFor="110v" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    110V
                </Label>
            </div>
            <div>
                <RadioGroupItem value="208v" id="208v" className="peer sr-only" />
                <Label htmlFor="208v" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    208V
                </Label>
            </div>
            <div>
                <RadioGroupItem value="230v" id="230v" className="peer sr-only" />
                <Label htmlFor="230v" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    230V
                </Label>
            </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-3">
        <Label>Phase Configuration</Label>
        <RadioGroup 
          value={formState.phase}
          onValueChange={(v) => onFormChange('phase', v)}
          className="grid grid-cols-2 gap-2"
        >
            <div>
                <RadioGroupItem value="single-phase" id="single-phase" className="peer sr-only" />
                <Label htmlFor="single-phase" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Single Phase
                </Label>
            </div>
            <div>
                <RadioGroupItem value="three-phase" id="three-phase" className="peer sr-only" />
                <Label htmlFor="three-phase" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Three Phase
                </Label>
            </div>
        </RadioGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="screen-width">Screen Width (tiles)</Label>
          <Input 
            id="screen-width" 
            type="number" 
            value={formState.screenWidthTiles}
            onChange={(e) => onFormChange('screenWidthTiles', Number(e.target.value))}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="screen-height">Screen Height (tiles)</Label>
          <Input 
            id="screen-height" 
            type="number" 
            value={formState.screenHeightTiles}
            onChange={(e) => onFormChange('screenHeightTiles', Number(e.target.value))}
            min="1"
          />
        </div>
      </div>
    </div>
  )
}

    