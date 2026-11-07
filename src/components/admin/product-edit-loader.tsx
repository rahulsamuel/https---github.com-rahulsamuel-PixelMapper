'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EditProductForm } from '@/components/admin/edit-product-form';
import { supabase } from '@/lib/supabase/client';
import { fetchLedProductWithOwner, type LedProduct } from '@/services/supabase';

export function ProductEditLoader({ productId, backHref, backLabel }: { productId: string; backHref: string; backLabel: string }) {
  const [product, setProduct] = useState<LedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedProductWithOwner(supabase, productId).then(({ data, error }) => {
      setProduct(data);
      setError(error);
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading product...</p>;
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? 'Product not found.'}</AlertDescription>
        </Alert>
        <Link href={backHref}>
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2" />
            {backLabel}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit LED Product</CardTitle>
          <CardDescription>
            Update the details for &quot;{product.manufacturer} {product.productName}&quot; below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProductForm product={product} />
        </CardContent>
      </Card>
      <Link href={backHref}>
        <Button variant="outline" className="w-full">
          <ArrowLeft className="mr-2" />
          {backLabel}
        </Button>
      </Link>
    </div>
  );
}
