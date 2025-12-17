
'use client';

import { usePixelMap } from "@/contexts/pixel-map-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

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
   } = usePixelMap();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDimensions(prevDimensions => ({
      ...prevDimensions,
      // Coerce value to number, ensure it's at least 1
      [e.target.name]: Math.max(1, Number(e.target.value) || 1),
    }));
  };

  const manufacturers = useMemo(() => {
    if (!products) return ["Custom"];
    const dbManufacturers = [...new Set(products.map(p => p.manufacturer))];
    return ["Custom", ...dbManufacturers];
  }, [products]);
  
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const selectedManufacturer = useMemo(() => {
    if (selectedProductId === 'custom') return 'Custom';
    return selectedProduct?.manufacturer ?? '';
  }, [selectedProduct, selectedProductId]);

  const availableProducts = useMemo(() => {
    if (selectedManufacturer === 'Custom') return [{ id: 'custom', productName: 'Custom' }];
    if (!products) return [];
    return products.filter(p => p.manufacturer === selectedManufacturer);
  }, [products, selectedManufacturer]);

  const handleManufacturerChange = (value: string) => {
    if (value === 'Custom') {
      setSelectedProductId('custom');
    } else {
      const firstProductOfNewManufacturer = products.find(p => p.manufacturer === value);
      if (firstProductOfNewManufacturer) {
          setSelectedProductId(firstProductOfNewManufacturer.id);
      }
    }
  };
  
  const isCustom = selectedProductId === 'custom';

  return (
    <div className="space-y-4">
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
                    onValueChange={(value) => setSelectedProductId(value)} 
                    value={selectedProductId ?? ''}
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
