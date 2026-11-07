'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { calculateCheckoutBreakdown, formatCents, PRODUCT_FEE_CENTS } from '@/lib/product-checkout';
import { recordListingFeeAcknowledgement } from '@/lib/listing-fee-acknowledgement';

type Props = {
  onAccepted: () => void;
};

export function ListingFeeNoticeDialog({ onAccepted }: Props) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oneProduct = calculateCheckoutBreakdown(1);

  async function handleContinue() {
    setSaving(true);
    setError(null);
    const saveError = await recordListingFeeAcknowledgement();
    if (saveError) {
      setError('We could not save your confirmation. Please try again.');
      setSaving(false);
      return;
    }
    onAccepted();
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Listing fee before you add a product</DialogTitle>
          <DialogDescription>
            Adding an LED product to the library has a fee. Please review it before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LED product listing fee (per product)</span>
            <span className="tabular-nums">{formatCents(PRODUCT_FEE_CENTS)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Card processing fee (one product)</span>
            <span className="tabular-nums">{formatCents(oneProduct.processingFeeCents)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total for one product</span>
            <span className="tabular-nums">{formatCents(oneProduct.totalCents)}</span>
          </div>
          <p className="text-muted-foreground">
            Each additional product is charged the listing fee plus its own processing fee at checkout.
          </p>
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-foreground">
            <span className="font-semibold">Non-refundable.</span> Listing fees are not refunded once payment is complete, including if you later remove or edit the product.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="listing-fee-agree" checked={agreed} onCheckedChange={v => setAgreed(v === true)} disabled={saving} />
          <Label htmlFor="listing-fee-agree" className="cursor-pointer text-sm font-normal leading-snug">
            I understand there is a fee for each product I add, that it is non-refundable, and that I will be asked to pay before the product is saved.
          </Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" disabled={!agreed || saving} onClick={handleContinue}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to add product
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={saving} onClick={() => router.push('/calculator')}>
            Go back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
