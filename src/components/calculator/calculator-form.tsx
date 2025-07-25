
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getLedProducts, type LedProduct } from '@/app/calculator/actions';

export function CalculatorForm() {
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');

  useEffect(() => {
    async function fetchProducts() {
      const { products, error } = await getLedProducts();
      if (products) {
        setProducts(products);
      }
      if (error) {
        console.error("Failed to fetch LED products:", error);
      }
    }
    fetchProducts();
  }, []);

  const manufacturers = useMemo(() => {
    return [...new Set(products.map(p => p.manufacturer))];
  }, [products]);

  const availableProducts = useMemo(() => {
    return products.filter(p => p.manufacturer === selectedManufacturer);
  }, [products, selectedManufacturer]);


  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name</Label>
        <Input id="project-name" placeholder="My LED Project" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="led-manufacturer">LED Manufacturer</Label>
          <Select onValueChange={setSelectedManufacturer} value={selectedManufacturer}>
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
          <Select disabled={!selectedManufacturer}>
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

      <div className="space-y-3">
        <Label>Operating Voltage</Label>
        <RadioGroup defaultValue="208v" className="grid grid-cols-3 gap-2">
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
        <RadioGroup defaultValue="three-phase" className="grid grid-cols-2 gap-2">
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

       <div className="space-y-3">
        <Label>Screen Size Units</Label>
        <RadioGroup defaultValue="tiles" className="grid grid-cols-3 gap-2">
            {['Pixels', 'Tiles', 'Feet', 'Inches', 'Meters', 'Millimeters'].map(unit => (
                <div key={unit}>
                    <RadioGroupItem value={unit.toLowerCase()} id={unit.toLowerCase()} className="peer sr-only" />
                    <Label htmlFor={unit.toLowerCase()} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        {unit}
                    </Label>
                </div>
            ))}
        </RadioGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="screen-width">Screen Width (tiles)</Label>
          <Input id="screen-width" type="number" defaultValue="8" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="screen-height">Screen Height (tiles)</Label>
          <Input id="screen-height" type="number" defaultValue="5" />
        </div>
      </div>
    </form>
  )
}
