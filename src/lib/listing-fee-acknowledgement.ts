import { supabase } from '@/lib/supabase/client';
import { PRODUCT_FEE_CENTS } from '@/lib/product-checkout';

export const LISTING_FEE_TERMS_VERSION = 'v1';

export async function recordListingFeeAcknowledgement(): Promise<string | null> {
  const { error } = await supabase.from('led_listing_fee_acknowledgements').insert({
    product_fee_cents: PRODUCT_FEE_CENTS,
    non_refundable_acknowledged: true,
    terms_version: LISTING_FEE_TERMS_VERSION,
  });
  if (error) {
    console.error('listing-fee-acknowledgement:', error.message);
    return 'Something went wrong. Please try again.';
  }
  return null;
}
