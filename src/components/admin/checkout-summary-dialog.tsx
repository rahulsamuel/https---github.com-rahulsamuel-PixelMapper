'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lock } from 'lucide-react';
import { calculateCheckoutBreakdown, formatCents, PRODUCT_FEE_CENTS } from '@/lib/product-checkout';

type Props = {
  open: boolean;
  productCount: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function CheckoutSummaryDialog({ open, productCount, submitting, onOpenChange, onConfirm }: Props) {
  const breakdown = calculateCheckoutBreakdown(productCount);

  return (
    <Dialog open={open} onOpenChange={next => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review and pay</DialogTitle>
          <DialogDescription>
            Your {productCount === 1 ? 'product is' : `${productCount} products are`} saved after payment is confirmed. A receipt is available under your account at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              LED product listing fee
              {productCount > 1 && <span className="ml-1 text-xs">({productCount} x {formatCents(PRODUCT_FEE_CENTS)})</span>}
            </span>
            <span className="tabular-nums">{formatCents(breakdown.productFeeCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Card processing fee</span>
            <span className="tabular-nums">{formatCents(breakdown.processingFeeCents)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCents(breakdown.totalCents)}</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening secure checkout...</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" />Pay {formatCents(breakdown.totalCents)}</>
            )}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
