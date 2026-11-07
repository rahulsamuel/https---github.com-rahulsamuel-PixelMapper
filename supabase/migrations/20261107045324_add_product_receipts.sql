/*
# Add product receipts table

1. New Tables
- `receipts`: one row per checkout for LED product submissions by non-admin users.
  - `id` (uuid, primary key): also passed to Stripe so the payment can be matched back to this receipt.
  - `user_id` (uuid): the signed-in user who paid. Defaults to the current user.
  - `receipt_number` (text, unique): human-readable receipt reference shown on the PDF.
  - `status` (text): `pending` until Stripe confirms payment, then `paid`; `expired` if the checkout is abandoned.
  - `customer_email` (text): the user's account email, printed on the receipt.
  - `items` (jsonb): the products covered by this receipt, including each product's saved record id once created.
  - `product_fee_cents`, `processing_fee_cents`, `total_cents` (integer): amounts in US cents.
  - `currency` (text): always `usd`.
  - `paid_at` (timestamptz): when Stripe confirmed payment.
  - `created_at` (timestamptz).

2. Security
- Row level security is enabled.
- Signed-in users can read only their own receipts (SELECT). They cannot create, change, or delete receipts directly.
- Payment functions on the server write receipts using the service role, which bypasses these policies by design.

3. Notes
- Amounts are stored in cents to avoid rounding errors.
- The index on (user_id, created_at) keeps the receipts list fast as history grows.
*/

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  customer_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_fee_cents integer NOT NULL CHECK (product_fee_cents >= 0),
  processing_fee_cents integer NOT NULL CHECK (processing_fee_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipts_user_id_created_at_idx ON receipts (user_id, created_at DESC);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO service_role;

DROP POLICY IF EXISTS "select_own_receipts" ON receipts;
CREATE POLICY "select_own_receipts" ON receipts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
