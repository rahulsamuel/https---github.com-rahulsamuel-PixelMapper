
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, FileDown } from "lucide-react";

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

export function ResultsDisplay() {
  
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
                <p className="font-bold text-2xl">1408 x 880 <span className="text-sm text-muted-foreground font-normal">pixels</span></p>
            </ResultBlock>
            <ResultBlock title="Tile Configuration">
                <p className="font-bold text-2xl">8 x 5 <span className="text-sm text-muted-foreground font-normal">(40 total)</span></p>
            </ResultBlock>
            <ResultBlock title="Total Pixels">
                <p className="font-bold text-2xl">1,239,040</p>
            </ResultBlock>
            <ResultBlock title="Aspect Ratio">
                <p className="font-bold text-2xl">8:5 <span className="text-sm text-muted-foreground font-normal">(1.60:1)</span></p>
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
                     <ResultRow label="Millimeters" value="4000.0 x 2500.0 mm" />
                     <ResultRow label="Meters" value="4.00 x 2.50 m" />
                </ResultBlock>
                <ResultBlock title="Imperial">
                    <ResultRow label="Inches" value={`157.5 x 98.4"`} />
                    <ResultRow label="Feet" value={`13.12 x 8.20'`} />
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
                <p className="font-bold text-2xl">374.0 <span className="text-sm text-muted-foreground font-normal">kg</span></p>
            </ResultBlock>
            <ResultBlock title="Imperial">
                <p className="font-bold text-2xl">824.5 <span className="text-sm text-muted-foreground font-normal">lbs</span></p>
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
                    <ResultRow label="Maximum" value="760 W/m²" />
                    <ResultRow label="Average" value="380 W/m²" />
                </div>
            </ResultBlock>
            <Separator />
            <ResultBlock title="Total Power">
                <div className="grid grid-cols-2 gap-4">
                    <ResultRow label="Maximum" value="7600.00 W" />
                    <ResultRow label="Average" value="3800.00 W" />
                </div>
            </ResultBlock>
             <Separator />
            <ResultBlock title="Current Draw @ 208V (Three Phase)">
                <div className="grid grid-cols-2 gap-4">
                    <ResultRow label="Maximum" value="26.37 A" />
                    <ResultRow label="Average" value="13.18 A" />
                </div>
            </ResultBlock>
        </CardContent>
      </Card>
    </div>
  )
}
