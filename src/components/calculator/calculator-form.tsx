
'use client';

import { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LedProductCombobox } from "@/components/ui/led-product-combobox";

interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    pixelPitchMm?: number | null;
    tileWidthMm?: number | null;
    tileHeightMm?: number | null;
    tileWeightKg?: number | null;
    maxBrightnessNit?: number | null;
    wattsPerTile?: number;
    maxPowerWPerSqm?: number | null;
    avgPowerWPerSqm?: number | null;
    [key: string]: unknown;
}

function ProductInfoPanel({ product }: { product: LedProduct }) {
  const rows: { label: string; value: string }[] = [];
  if (product.pixelPitchMm) rows.push({ label: 'Pixel Pitch', value: `${product.pixelPitchMm}mm` });
  rows.push({ label: 'Resolution', value: `${product.tileWidthPx}\u00d7${product.tileHeightPx}` });
  if (product.tileWidthMm && product.tileHeightMm)
    rows.push({ label: 'Physical Size', value: `${product.tileWidthMm}\u00d7${product.tileHeightMm}mm` });
  if (product.tileWeightKg) rows.push({ label: 'Weight', value: `${product.tileWeightKg}kg` });
  if (product.maxBrightnessNit) rows.push({ label: 'Brightness', value: `${product.maxBrightnessNit} nit` });
  if (product.wattsPerTile) rows.push({ label: 'Power / Tile', value: `${product.wattsPerTile}W` });
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md border bg-muted/30 overflow-hidden">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 last:border-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
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
    hidePowerConfig?: boolean;
}

export function CalculatorForm({ products, formState, onFormChange, selectedProduct, hidePowerConfig }: CalculatorFormProps) {
  



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

      <div className="space-y-2">
        <Label>LED Product</Label>
        <LedProductCombobox
          products={products}
          value={formState.selectedProductId}
          onChange={(id) => onFormChange('selectedProductId', id)}
        />
      </div>
      
      {selectedProduct && <ProductInfoPanel product={selectedProduct} />}

      {!hidePowerConfig && (
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
      )}
      
      {!hidePowerConfig && (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Phase Configuration</Label>
          {formState.voltage === '110v' && (
            <span className="text-xs text-muted-foreground">(110V is single phase only)</span>
          )}
        </div>
        <RadioGroup 
          value={formState.phase}
          onValueChange={(v) => onFormChange('phase', v)}
          className="grid grid-cols-2 gap-2"
          disabled={formState.voltage === '110v'}
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
      )}
      
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

    