'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCents, PRODUCT_FEE_CENTS } from '@/lib/product-checkout';
import { formatReceiptDate, type Receipt } from '@/lib/receipts';
import { BUSINESS_ADDRESS, BUSINESS_NAME } from '@/lib/receipt-pdf';

type Props = {
  receipt: Receipt | null;
  downloading: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (receipt: Receipt) => void;
};

export function ReceiptDetailDialog({ receipt, downloading, onOpenChange, onDownload }: Props) {
  return (
    <Dialog open={receipt !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {receipt && (
          <>
            <DialogHeader>
              <DialogTitle>Receipt {receipt.receipt_number}</DialogTitle>
              <DialogDescription>
                {formatReceiptDate(receipt.paid_at ?? receipt.created_at)} · {receipt.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold">{BUSINESS_NAME}</p>
                {BUSINESS_ADDRESS.map(line => (
                  <p key={line} className="text-muted-foreground">{line}</p>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                {receipt.items.map((item, i) => (
                  <div key={`${item.manufacturer}-${item.product_name}-${i}`} className="flex items-start justify-between gap-4">
                    <span className="min-w-0 break-words">{item.manufacturer} {item.product_name}</span>
                    <span className="tabular-nums shrink-0">{formatCents(PRODUCT_FEE_CENTS)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Card processing fee</span>
                  <span className="tabular-nums">{formatCents(receipt.processing_fee_cents)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCents(receipt.total_cents)}</span>
              </div>
            </div>

            {receipt.status === 'paid' && (
              <Button onClick={() => onDownload(receipt)} disabled={downloading} className="w-full">
                {downloading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />}
                Download PDF
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
