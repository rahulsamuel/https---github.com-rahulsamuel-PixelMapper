'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { fetchReceipts, formatReceiptDate, type Receipt } from '@/lib/receipts';
import { downloadReceiptPdf } from '@/lib/receipt-pdf';
import { formatCents } from '@/lib/product-checkout';
import { ReceiptDetailDialog } from '@/components/receipts/receipt-detail-dialog';
import { cn } from '@/lib/utils';

export function ReceiptsView() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchReceipts().then(({ data, error }) => {
      setReceipts(data);
      setLoadError(error);
      setLoading(false);
    });
  }, [userId]);

  async function handleDownload(receipt: Receipt) {
    setDownloadingId(receipt.id);
    try {
      await downloadReceiptPdf(receipt);
    } finally {
      setDownloadingId(null);
    }
  }

  if (authLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-4">
        <p className="text-muted-foreground">Sign in to see your receipts.</p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Receipts for every product listing fee you have paid. Download a PDF copy at any time.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading receipts...</p>}
      {loadError && <p className="text-sm text-destructive">Could not load your receipts: {loadError}</p>}

      {!loading && !loadError && receipts.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          You have no receipts yet.
        </div>
      )}

      {receipts.length > 0 && (
        <div className="rounded-xl border bg-card divide-y">
          {receipts.map(receipt => {
            const isPaid = receipt.status === 'paid';
            return (
              <div key={receipt.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{receipt.receipt_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatReceiptDate(receipt.paid_at ?? receipt.created_at)} · {receipt.items.length} {receipt.items.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-xs font-medium rounded-full px-2.5 py-0.5 capitalize',
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                  )}>
                    {receipt.status}
                  </span>
                  <span className="font-semibold tabular-nums">{formatCents(receipt.total_cents)}</span>
                  <Button variant="outline" size="sm" onClick={() => setViewReceipt(receipt)}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                  </Button>
                  {isPaid && (
                    <Button variant="outline" size="sm" onClick={() => handleDownload(receipt)} disabled={downloadingId === receipt.id}>
                      {downloadingId === receipt.id
                        ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5 mr-1.5" />}
                      PDF
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReceiptDetailDialog
        receipt={viewReceipt}
        onOpenChange={open => { if (!open) setViewReceipt(null); }}
        onDownload={handleDownload}
        downloading={viewReceipt !== null && downloadingId === viewReceipt.id}
      />
    </div>
  );
}
