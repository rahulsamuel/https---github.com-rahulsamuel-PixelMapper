
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProducts } from '@/app/calculator/actions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    maxPowerConsumption: number;
    [key: string]: any;
}

type ProcessorType = 'Brompton' | 'Novastar' | 'Helios';

const PROCESSOR_CAPACITIES: Record<ProcessorType, number> = {
    'Brompton': 525000, // 4K processor has 4 ports, each supports 525k pixels
    'Novastar': 650000, // Standard port for many Novastar processors
    'Helios': 524288,   // 8 ports each with this capacity
};


export default function PowerDataPage() {
    const [products, setProducts] = useState<LedProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [circuitVoltage, setCircuitVoltage] = useState('110');
    const [circuitAmperage, setCircuitAmperage] = useState('20');
    const [safetyMargin, setSafetyMargin] = useState('80');
    const [processor, setProcessor] = useState<ProcessorType>('Brompton');

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await getProducts();
            if (data && data.length > 0) {
                setProducts(data as LedProduct[]);
                if (!selectedProductId) {
                    setSelectedProductId(data[0].id);
                }
            }
            if (error) {
                console.error("Failed to fetch LED products:", error);
            }
        }
        fetchProducts();
    }, [selectedProductId]);
    
    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId);
    }, [products, selectedProductId]);

    const manufacturers = useMemo(() => {
        return [...new Set(products.map(p => p.manufacturer))];
    }, [products]);

    const selectedManufacturer = useMemo(() => {
        return selectedProduct?.manufacturer ?? '';
    }, [selectedProduct]);

    const availableProducts = useMemo(() => {
        return products.filter(p => p.manufacturer === selectedManufacturer);
    }, [products, selectedManufacturer]);

    const handleManufacturerChange = (value: string) => {
        const firstProductOfNewManufacturer = products.find(p => p.manufacturer === value);
        if (firstProductOfNewManufacturer) {
            setSelectedProductId(firstProductOfNewManufacturer.id);
        }
    };
    
    const { maxTilesPerPowerCircuit, maxTilesPerDataPort } = useMemo(() => {
        if (!selectedProduct) return { maxTilesPerPowerCircuit: 0, maxTilesPerDataPort: 0 };

        // Power Calculation
        const voltageNum = parseFloat(circuitVoltage) || 0;
        const amperageNum = parseFloat(circuitAmperage) || 0;
        const marginNum = parseFloat(safetyMargin) / 100 || 0;
        const circuitCapacity = voltageNum * amperageNum * marginNum;
        const maxPowerPerTile = selectedProduct.maxPowerConsumption || 0;
        const maxTilesPerPowerCircuit = maxPowerPerTile > 0 ? Math.floor(circuitCapacity / maxPowerPerTile) : 0;

        // Data Calculation
        const pixelsPerTile = (selectedProduct.tileWidthPx || 0) * (selectedProduct.tileHeightPx || 0);
        const portCapacity = PROCESSOR_CAPACITIES[processor];
        const maxTilesPerDataPort = pixelsPerTile > 0 ? Math.floor(portCapacity / pixelsPerTile) : 0;
        
        return { maxTilesPerPowerCircuit, maxTilesPerDataPort };

    }, [selectedProduct, circuitVoltage, circuitAmperage, safetyMargin, processor]);


    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Power & Data Load Calculator</CardTitle>
                    <CardDescription>
                        Calculate the maximum number of LED tiles a single power circuit or data port can support.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Side */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">LED Product</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="led-manufacturer">Manufacturer</Label>
                                  <Select onValueChange={handleManufacturerChange} value={selectedManufacturer}>
                                    <SelectTrigger id="led-manufacturer"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                      {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="led-product">Product</Label>
                                  <Select onValueChange={setSelectedProductId} value={selectedProductId ?? ''} disabled={!selectedManufacturer}>
                                    <SelectTrigger id="led-product"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                      {availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.productName}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Power Circuit</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="circuit-voltage">Voltage</Label>
                                    <Select value={circuitVoltage} onValueChange={setCircuitVoltage}>
                                        <SelectTrigger id="circuit-voltage"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="110">110V</SelectItem>
                                            <SelectItem value="120">120V</SelectItem>
                                            <SelectItem value="208">208V</SelectItem>
                                            <SelectItem value="230">230V</SelectItem>
                                            <SelectItem value="240">240V</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="circuit-amperage">Amperage</Label>
                                    <Input id="circuit-amperage" type="number" value={circuitAmperage} onChange={e => setCircuitAmperage(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="safety-margin">Margin (%)</Label>
                                    <Input id="safety-margin" type="number" value={safetyMargin} onChange={e => setSafetyMargin(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Data Port</h3>
                            <div className="space-y-2">
                                <Label htmlFor="processor-type">Processor Type</Label>
                                <Select value={processor} onValueChange={(v) => setProcessor(v as ProcessorType)}>
                                    <SelectTrigger id="processor-type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Brompton">Brompton</SelectItem>
                                        <SelectItem value="Novastar">Novastar</SelectItem>
                                        <SelectItem value="Helios">Helios</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>
                    {/* Results Side */}
                    <div className="space-y-8">
                        <Card className="bg-muted/30 text-center">
                            <CardHeader>
                                <CardTitle className="text-muted-foreground">Max Tiles per Power Circuit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-6xl font-bold">{maxTilesPerPowerCircuit}</p>
                                <p className="text-sm text-muted-foreground">
                                    Based on a {circuitAmperage}A @ {circuitVoltage}V circuit with a {safetyMargin}% safety margin.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 text-center">
                            <CardHeader>
                                <CardTitle className="text-muted-foreground">Max Tiles per Data Port</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-6xl font-bold">{maxTilesPerDataPort}</p>
                                <p className="text-sm text-muted-foreground">
                                    Based on a {processor} processor port.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
