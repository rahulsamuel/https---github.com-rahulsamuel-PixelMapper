
'use server';

import { CalculatorForm } from '@/components/calculator/calculator-form';
import { ResultsDisplay } from '@/components/calculator/results-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CalculatorPage() {
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
              <CalculatorForm />
            </CardContent>
          </Card>
        </div>
        <div>
          <ResultsDisplay />
        </div>
      </div>
    </div>
  );
}
