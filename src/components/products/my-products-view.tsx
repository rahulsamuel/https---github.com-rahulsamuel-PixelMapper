'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { fetchLedProducts, setLedProductVisibility, type LedProduct } from '@/services/supabase';
import { ProductCard, ProductDetailDialog } from '@/components/admin/led-product-admin';
import { deleteProductAction } from '@/app/products/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MyProductsView() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<LedProduct | null>(null);
  const [publishTarget, setPublishTarget] = useState<LedProduct | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchLedProducts(supabase, { ownerId: userId, includeOwner: false }).then(({ data, error }) => {
      setProducts(data);
      setLoadError(error);
      setLoading(false);
    });
  }, [userId]);

  async function handleDelete(product: LedProduct) {
    setActionError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const fd = new FormData();
    if (session?.access_token) fd.append('accessToken', session.access_token);
    const result = await deleteProductAction(product.id, fd);
    if (result.success) {
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setActionError(result.message);
    }
  }

  async function confirmPublish() {
    if (!publishTarget) return;
    setPublishing(true);
    setActionError(null);
    const { error } = await setLedProductVisibility(supabase, publishTarget.id, 'shared');
    if (error) {
      setActionError(error);
    } else {
      setProducts(prev => prev.map(p => (p.id === publishTarget.id ? { ...p, visibility: 'shared' } : p)));
    }
    setPublishing(false);
    setPublishTarget(null);
  }

  if (authLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-4">
        <p className="text-muted-foreground">Sign in to see the LED products you have added.</p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Products you added are private until you make them public. Public products are visible to everyone.
          </p>
        </div>
        <Link href="/add-led">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading products...</p>}
      {loadError && <p className="text-sm text-destructive">Could not load your products: {loadError}</p>}
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {!loading && !loadError && products.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          You have not added any products yet.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            editHref={`/my-products/${product.id}/edit`}
            onView={() => setViewProduct(product)}
            onDelete={product.visibility === 'private' ? () => handleDelete(product) : undefined}
            onToggleVisibility={product.visibility === 'private' ? () => setPublishTarget(product) : undefined}
          />
        ))}
      </div>

      <ProductDetailDialog product={viewProduct} open={!!viewProduct} onOpenChange={open => { if (!open) setViewProduct(null); }} />

      <AlertDialog open={!!publishTarget} onOpenChange={open => { if (!open) setPublishTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make this product public?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{publishTarget?.productName}</strong> will appear for everyone in the app, and your future edits will be visible to them.
              You cannot make it private again yourself; only an admin can.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} disabled={publishing}>
              {publishing ? 'Publishing...' : 'Make public'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
