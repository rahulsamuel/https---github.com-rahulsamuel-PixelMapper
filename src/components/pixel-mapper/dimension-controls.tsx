
'use client';

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import type { LedProduct } from "@/services/supabase";
import { LedProductCombobox } from "@/components/ui/led-product-combobox";

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

export function DimensionControls() {
  const { 
    dimensions, 
    setDimensions, 
    topHalfTile, 
    handleTopHalfTileChange, 
    bottomHalfTile, 
    handleBottomHalfTileChange,
    leftHalfTile,
    handleLeftHalfTileChange,
    rightHalfTile,
    handleRightHalfTileChange,
    products,
    selectedProductId,
    setSelectedProductId,
    showModules,
    setShowModules,
    moduleBorderColor,
    setModuleBorderColor,
    randomizeModuleColors,
    setRandomizeModuleColors,
    regenerateModuleColors,
    customTileWidthMm,
    setCustomTileWidthMm,
    customTileHeightMm,
    setCustomTileHeightMm,
   } = usePixelMap();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDimensions(prevDimensions => ({
      ...prevDimensions,
      // Coerce value to number, ensure it's at least 1
      [e.target.name]: Math.max(1, Number(e.target.value) || 1),
    }));
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const isCustom = selectedProductId === 'custom';

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label>LED Product</Label>
            <LedProductCombobox
                products={products as { id: string; manufacturer: string; productName: string }[]}
                value={selectedProductId}
                onChange={setSelectedProductId}
                includeCustom
            />
        </div>
        {selectedProduct && !isCustom && (
          <ProductInfoPanel product={selectedProduct as LedProduct} />
        )}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tileWidth">Tile Width (px)</Label>
                <Input 
                    id="tileWidth"
                    name="tileWidth"
                    type="number" 
                    value={dimensions.tileWidth}
                    onChange={handleChange}
                    min="1"
                    disabled={!isCustom}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="tileHeight">Tile Height (px)</Label>
                <Input
                    id="tileHeight"
                    name="tileHeight"
                    type="number"
                    value={dimensions.tileHeight}
                    onChange={handleChange}
                    min="1"
                    disabled={!isCustom}
                />
            </div>
        </div>
        {isCustom && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customTileWidthMm">Tile Width (mm)</Label>
              <Input
                id="customTileWidthMm"
                name="customTileWidthMm"
                type="number"
                value={customTileWidthMm || ''}
                onChange={(e) => setCustomTileWidthMm(Math.max(0, Number(e.target.value) || 0))}
                min="0"
                placeholder="e.g. 500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customTileHeightMm">Tile Height (mm)</Label>
              <Input
                id="customTileHeightMm"
                name="customTileHeightMm"
                type="number"
                value={customTileHeightMm || ''}
                onChange={(e) => setCustomTileHeightMm(Math.max(0, Number(e.target.value) || 0))}
                min="0"
                placeholder="e.g. 500"
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="screenWidth">Screen Width (full tiles)</Label>
                <Input
                    id="screenWidth"
                    name="screenWidth"
                    type="number"
                    value={dimensions.screenWidth}
                    onChange={handleChange}
                    min="1"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="screenHeight">Screen Height (full tiles)</Label>
                <Input
                    id="screenHeight"
                    name="screenHeight"
                    type="number"
                    value={dimensions.screenHeight}
                    onChange={handleChange}
                    min="1"
                />
            </div>
        </div>
        <Separator />
         <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="show-modules">Show Tile Modules</Label>
                <Switch
                    id="show-modules"
                    checked={showModules}
                    onCheckedChange={setShowModules}
                />
            </div>
            {showModules && (
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="moduleWidth">Module Width (px)</Label>
                            <Input
                                id="moduleWidth"
                                name="moduleWidth"
                                type="number"
                                value={dimensions.moduleWidth}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="moduleHeight">Module Height (px)</Label>
                            <Input
                                id="moduleHeight"
                                name="moduleHeight"
                                type="number"
                                value={dimensions.moduleHeight}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="module-border-color">Module Border Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="module-border-color"
                                type="color"
                                value={moduleBorderColor}
                                onChange={(e) => setModuleBorderColor(e.target.value)}
                                className="w-14 p-1"
                            />
                             <Input
                                type="text"
                                value={moduleBorderColor}
                                onChange={(e) => setModuleBorderColor(e.target.value)}
                                placeholder="#000000"
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                        <Label htmlFor="randomize-module-colors">Apply Random Module Colors</Label>
                        <Switch
                            id="randomize-module-colors"
                            checked={randomizeModuleColors}
                            onCheckedChange={setRandomizeModuleColors}
                        />
                    </div>
                    {randomizeModuleColors && (
                         <Button onClick={regenerateModuleColors} variant="outline" size="sm" className="w-full">
                            <RefreshCw className="mr-2" />
                            Regenerate Colors
                        </Button>
                    )}
                </div>
            )}
        </div>
        <Separator />
        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="left-half-tile">Add Left Half Tile</Label>
                <Switch
                    id="left-half-tile"
                    checked={leftHalfTile}
                    onCheckedChange={handleLeftHalfTileChange}
                />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="right-half-tile">Add Right Half Tile</Label>
                <Switch
                    id="right-half-tile"
                    checked={rightHalfTile}
                    onCheckedChange={handleRightHalfTileChange}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="top-half-tile">Add Top Half Tile</Label>
                <Switch
                    id="top-half-tile"
                    checked={topHalfTile}
                    onCheckedChange={handleTopHalfTileChange}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <Label htmlFor="bottom-half-tile">Add Bottom Half Tile</Label>
                <Switch
                    id="bottom-half-tile"
                    checked={bottomHalfTile}
                    onCheckedChange={handleBottomHalfTileChange}
                    disabled={dimensions.screenHeight < 1 && !topHalfTile}
                />
            </div>
        </div>
    </div>
  );
}
