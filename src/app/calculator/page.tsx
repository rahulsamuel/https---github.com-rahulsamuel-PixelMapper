
'use server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CalculatorPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>LED Calculator</CardTitle>
          <CardDescription>
            A powerful tool to help you plan your LED wall power and data requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This feature is coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
