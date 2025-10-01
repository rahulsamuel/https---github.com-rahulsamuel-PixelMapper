
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, FileDown } from "lucide-react";

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

const ResultRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-semibold text-lg">{value}</p>
  </div>
);

const ResultBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

export function ResultsDisplay({ results, formState }: { results: CalculatedResults; formState: FormState }) {
  
  const formatNumber = (num: number, digits = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline">Calculated Results</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline">
                    <Copy className="mr-2" />
                    Copy
                </Button>
                <Button variant="outline">
                    <FileDown className="mr-2" />
                    PDF
                </Button>
            </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Screen Resolution & Properties</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ResultBlock title="Resolution">
                <p className="font-bold text-2xl">{formatNumber(results.resolution.width, 0)} x {formatNumber(results.resolution.height, 0)} <span className="text-sm text-muted-foreground font-normal">pixels</span></p>
            </ResultBlock>
            <ResultBlock title="Tile Configuration">
                <p className="font-bold text-2xl">{formState.screenWidthTiles} x {formState.screenHeightTiles} <span className="text-sm text-muted-foreground font-normal">({results.totalTiles} total)</span></p>
            </ResultBlock>
            <ResultBlock title="Total Pixels">
                <p className="font-bold text-2xl">{formatNumber(results.totalPixels, 0)}</p>
            </ResultBlock>
            <ResultBlock title="Aspect Ratio">
                <p className="font-bold text-2xl">{results.aspectRatio}</p>
            </ResultBlock>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Physical Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <ResultBlock title="Metric">
                     <ResultRow label="Millimeters" value={`${formatNumber(results.dimensionsMm.width, 1)} x ${formatNumber(results.dimensionsMm.height, 1)} mm`} />
                     <ResultRow label="Meters" value={`${formatNumber(results.dimensionsMm.width / 1000, 2)} x ${formatNumber(results.dimensionsMm.height / 1000, 2)} m`} />
                </ResultBlock>
                <ResultBlock title="Imperial">
                    <ResultRow label="Inches" value={`${formatNumber(results.dimensionsIn.width, 1)}" x ${formatNumber(results.dimensionsIn.height, 1)}"`} />
                    <ResultRow label="Feet" value={`${formatNumber(results.dimensionsFt.width, 2)}' x ${formatNumber(results.dimensionsFt.height, 2)}'`} />
                </ResultBlock>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Total Weight</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ResultBlock title="Metric">
                <p className="font-bold text-2xl">{formatNumber(results.totalWeightKg, 1)} <span className="text-sm text-muted-foreground font-normal">kg</span></p>
            </ResultBlock>
            <ResultBlock title="Imperial">
                <p className="font-bold text-2xl">{formatNumber(results.totalWeightLbs, 1)} <span className="text-sm text-muted-foreground font-normal">lbs</span></p>
            </ResultBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Power Consumption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <ResultBlock title="Per Square Meter">
                <div className="grid grid-cols-2 gap-4">
                    <ResultRow label="Maximum" value={`${formatNumber(results.powerPerM2.max, 0)} W/m²`} />
                    <ResultRow label="Average" value={`${formatNumber(results.powerPerM2.avg, 0)} W/m²`} />
                </div>
            </ResultBlock>
            <Separator />
            <ResultBlock title="Total Power">
                <div className="grid grid-cols-2 gap-4">
                    <ResultRow label="Maximum" value={`${formatNumber(results.totalPower.max, 2)} W`} />
                    <ResultRow label="Average" value={`${formatNumber(results.totalPower.avg, 2)} W`} />
                </div>
            </ResultBlock>
             <Separator />
            <ResultBlock title={results.currentDraw.label}>
                <div className="grid grid-cols-2 gap-4">
                    <ResultRow label="Maximum" value={`${formatNumber(results.currentDraw.max, 2)} A`} />
                    <ResultRow label="Average" value={`${formatNumber(results.currentDraw.avg, 2)} A`} />
                </div>
            </ResultBlock>
        </CardContent>
      </Card>
    </div>
  )
}

    