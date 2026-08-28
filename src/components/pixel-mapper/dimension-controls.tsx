
'use client';

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
import type { LedProduct } from "@/services/supabase";
import { LedProductCombobox } from "@/components/ui/led-product-combobox";
import { Input } from "@/components/ui/input";

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
    <div className="min-w-0 rounded-md border border-border/50 bg-background/60 overflow-hidden">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 items-center justify-between gap-3 px-2.5 py-1.5 border-b border-border/30 last:border-0">
          <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
          <span className="min-w-0 truncate text-right text-[11px] font-semibold tabular-nums" title={value}>{value}</span>
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
    sections,
    addSection,
    updateSection,
    removeSection,
   } = usePixelMap();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDimensions(prevDimensions => ({
      ...prevDimensions,
      // Coerce value to number, ensure it's at least 1
      [e.target.name]: Math.max(1, Number(e.target.value) || 1),
    }));
  };

  const isCustom = selectedProductId === 'custom';
  const hasCustomSection = sections.some(section => section.productId === 'custom');
  const canEditCustomDimensions = sections.length > 0 ? hasCustomSection : isCustom;

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>LED Product Sections</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const defaultId = products.length > 0 ? products[0].id : 'custom';
                  addSection(defaultId, 3);
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Section
              </Button>
            </div>
            {sections.length === 0 ? (
              <p className="text-xs text-muted-foreground">No product sections yet. Click "Add Section" to build a screen with multiple LED products side by side.</p>
            ) : (
              <div className="space-y-2">
                {sections.map((section, idx) => {
                  const product = products.find(p => p.id === section.productId);
                  return (
                    <div key={section.id} className="min-w-0 rounded-md border border-border/40 bg-muted/20 p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Section {idx + 1}</span>
                        {sections.length > 1 && (
                          <button onClick={() => removeSection(section.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <LedProductCombobox
                        className="w-full"
                        products={products as { id: string; manufacturer: string; productName: string }[]}
                        value={section.productId}
                        includeCustom
                        onChange={(v) => {
                          const newProduct = products.find(p => p.id === v);
                          updateSection(section.id, {
                            productId: v ?? 'custom',
                            tileWidthPx: newProduct?.tileWidthPx ?? section.tileWidthPx,
                            tileHeightPx: newProduct?.tileHeightPx ?? section.tileHeightPx,
                            tileWidthMm: newProduct?.tileWidthMm ?? section.tileWidthMm,
                            tileHeightMm: newProduct?.tileHeightMm ?? section.tileHeightMm,
                          });
                        }}
                      />
                      {product && <ProductInfoPanel product={product as LedProduct} />}
                      <div className="flex min-w-0 items-center gap-2">
                        <Label className="shrink-0 text-[10px] whitespace-nowrap">Columns</Label>
                        <Input
                          type="number"
                          min="1"
                          value={section.columnCount}
                          onChange={(e) => updateSection(section.id, { columnCount: Math.max(1, Number(e.target.value) || 1) })}
                          className="h-7 text-xs w-20"
                        />
                        {product && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {product.tileWidthPx}×{product.tileHeightPx}px
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
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
                    disabled={!canEditCustomDimensions}
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
                    disabled={!canEditCustomDimensions}
                />
            </div>
        </div>
        {canEditCustomDimensions && (
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
