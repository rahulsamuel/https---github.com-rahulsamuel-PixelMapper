
'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { getProducts } from './actions';

const CalculatorForm = dynamic(() => import('@/components/calculator/calculator-form').then(mod => mod.CalculatorForm), {
  ssr: false,
  loading: () => <CalculatorFormSkeleton />,
});

const ResultsDisplay = dynamic(() => import('@/components/calculator/results-display').then(mod => mod.ResultsDisplay), {
  ssr: false,
  loading: () => <ResultsDisplaySkeleton />,
});

interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    tileWidthMm: number;
    tileHeightMm: number;
    tileWeightKg: number;
    maxPowerConsumption: number;
    avgPowerConsumption: number;
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

interface CalculatedResults {
    resolution: { width: number; height: number };
    totalPixels: number;
    aspectRatio: string;
    dimensionsMm: { width: number; height: number };
    dimensionsIn: { width: number; height: number };
    dimensionsFt: { width: number; height: number };
    totalWeightKg: number;
    totalWeightLbs: number;
    powerPerM2: { max: number; avg: number };
    totalPower: { max: number; avg: number };
    currentDraw: { max: number; avg: number; label: string };
    totalTiles: number;
}

function greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

export default function CalculatorPage() {
    const [products, setProducts] = useState<LedProduct[]>([]);
    const [formState, setFormState] = useState<FormState>({
        projectName: "My LED Project",
        selectedProductId: null,
        voltage: '208v',
        phase: 'three-phase',
        screenWidthTiles: 8,
        screenHeightTiles: 5,
    });

    const [results, setResults] = useState<CalculatedResults | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await getProducts();
            if (data) {
                setProducts(data as LedProduct[]);
                // Set initial product
                if (data.length > 0 && !formState.selectedProductId) {
                    handleFormChange('selectedProductId', data[0].id);
                }
            }
            if (error) {
                console.error("Failed to fetch LED products:", error);
            }
        }
        fetchProducts();
    }, []);

    const selectedProduct = useMemo(() => {
        if (!formState.selectedProductId) return null;
        return products.find(p => p.id === formState.selectedProductId) ?? null;
    }, [formState.selectedProductId, products]);


    const calculateResults = useCallback(() => {
        if (!selectedProduct) {
            setResults(null);
            return;
        }

        const { screenWidthTiles, screenHeightTiles, voltage, phase } = formState;

        // Resolution & Properties
        const resWidth = screenWidthTiles * selectedProduct.tileWidthPx;
        const resHeight = screenHeightTiles * selectedProduct.tileHeightPx;
        const totalPixels = resWidth * resHeight;
        const gcd = greatestCommonDivisor(resWidth, resHeight);
        const aspectX = resWidth / gcd;
        const aspectY = resHeight / gcd;
        const aspectRatio = `${aspectX}:${aspectY} (${(aspectX / aspectY).toFixed(2)}:1)`;
        const totalTiles = screenWidthTiles * screenHeightTiles;

        // Physical Dimensions
        const widthMm = screenWidthTiles * selectedProduct.tileWidthMm;
        const heightMm = screenHeightTiles * selectedProduct.tileHeightMm;
        const widthIn = widthMm / 25.4;
        const heightIn = heightMm / 25.4;
        const widthFt = widthIn / 12;
        const heightFt = heightIn / 12;

        // Total Weight
        const totalWeightKg = totalTiles * selectedProduct.tileWeightKg;
        const totalWeightLbs = totalWeightKg * 2.20462;

        // Power Consumption
        const screenAreaM2 = (widthMm / 1000) * (heightMm / 1000);
        const totalMaxPower = totalTiles * selectedProduct.maxPowerConsumption;
        const totalAvgPower = totalTiles * selectedProduct.avgPowerConsumption;

        const maxPowerPerM2 = screenAreaM2 > 0 ? totalMaxPower / screenAreaM2 : 0;
        const avgPowerPerM2 = screenAreaM2 > 0 ? totalAvgPower / screenAreaM2 : 0;

        // Current Draw
        const vNum = parseInt(voltage.replace('v', ''));
        const phaseDivisor = phase === 'three-phase' ? Math.sqrt(3) : 1;
        const maxAmps = totalMaxPower / (vNum * phaseDivisor);
        const avgAmps = totalAvgPower / (vNum * phaseDivisor);
        
        const phaseText = phase === 'three-phase' ? 'Three Phase' : 'Single Phase';
        const currentDrawLabel = `Current Draw @ ${vNum}V (${phaseText})`;
        
        setResults({
            resolution: { width: resWidth, height: resHeight },
            totalPixels,
            aspectRatio,
            dimensionsMm: { width: widthMm, height: heightMm },
            dimensionsIn: { width: widthIn, height: heightIn },
            dimensionsFt: { width: widthFt, height: heightFt },
            totalWeightKg,
            totalWeightLbs,
            powerPerM2: { max: maxPowerPerM2, avg: avgPowerPerM2 },
            totalPower: { max: totalMaxPower, avg: totalAvgPower },
            currentDraw: { max: maxAmps, avg: avgAmps, label: currentDrawLabel },
            totalTiles,
        });

    }, [formState, selectedProduct]);

    useEffect(() => {
        calculateResults();
    }, [calculateResults]);

    const handleFormChange = (field: keyof FormState, value: any) => {
        setFormState(prevState => ({
            ...prevState,
            [field]: value,
        }));
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Input Parameters</CardTitle>
                            <CardDescription>
                                Enter the details of your LED setup to calculate power and data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CalculatorForm 
                                products={products}
                                formState={formState}
                                onFormChange={handleFormChange}
                                selectedProduct={selectedProduct}
                            />
                        </CardContent>
                    </Card>
                    <div className="mt-4">
                        <Link href="/add-led">
                            <Button variant="outline" className="w-full">
                                <PlusCircle className="mr-2" />
                                Add New LED Product
                            </Button>
                        </Link>
                    </div>
                </div>
                <div>
                    {results ? <ResultsDisplay results={results} formState={formState} /> : <ResultsDisplaySkeleton />}
                </div>
            </div>
        </div>
    );
}

function CalculatorFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

function ResultsDisplaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

    