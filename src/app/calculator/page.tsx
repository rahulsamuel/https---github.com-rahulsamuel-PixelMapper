
'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
    wattsPerTile: number;
    maxPowerWPerSqm: number | null;
    avgPowerWPerSqm: number | null;
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

        // Use per-sqm values if available, otherwise derive from wattsPerTile
        const maxPowerPerM2 = selectedProduct.maxPowerWPerSqm != null
            ? selectedProduct.maxPowerWPerSqm
            : (screenAreaM2 > 0 ? (totalTiles * selectedProduct.wattsPerTile) / screenAreaM2 : 0);
        const avgPowerPerM2 = selectedProduct.avgPowerWPerSqm != null
            ? selectedProduct.avgPowerWPerSqm
            : maxPowerPerM2 * 0.4;

        const totalMaxPower = maxPowerPerM2 * screenAreaM2;
        const totalAvgPower = avgPowerPerM2 * screenAreaM2;

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
        <div className="h-[calc(100svh-3.5rem)] flex overflow-hidden">
            {/* Left sidebar */}
            <div className="w-80 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
                    <h2 className="font-semibold text-sm">Input Parameters</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter your LED setup details.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-0">
                        <CalculatorForm
                            products={products}
                            formState={formState}
                            onFormChange={handleFormChange}
                            selectedProduct={selectedProduct}
                        />
                        <div className="pt-4">
                            <Link href="/add-led">
                                <Button variant="outline" className="w-full" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add New LED Product
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main content */}
            <div className="flex-1 overflow-auto p-6">
                {results ? <ResultsDisplay results={results} formState={formState} /> : <ResultsDisplaySkeleton />}
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

    