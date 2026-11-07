/*
# Record non-admin LED listing fee acknowledgements

Plain-English summary: when a non-admin user opens the Add LED Product page, they must read the listing fee terms and tick a box confirming they understand the fee is non-refundable. Each confirmation is saved here with a timestamp.

1. New Tables
- `led_listing_fee_acknowledgements`
  - `id` (uuid, primary key)
  - `user_id` (uuid, the signed-in user who confirmed; defaults to the current user)
  - `acknowledged_at` (timestamptz, when the user confirmed)
  - `product_fee_cents` (integer, per-product listing fee shown to the user at confirmation)
  - `non_refundable_acknowledged` (boolean, must be true)
  - `terms_version` (text, identifies the wording the user agreed to)

2. Security
- Enable RLS on `led_listing_fee_acknowledgements`.
- Grant SELECT and INSERT to `authenticated` only. No UPDATE or DELETE, so confirmations cannot be altered.
- Users can read and insert only their own rows.

3. Notes
- Rows are append-only audit records.
*/

CREATE TABLE IF NOT EXISTS led_listing_fee_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  product_fee_cents integer NOT NULL CHECK (product_fee_cents >= 0),
  non_refundable_acknowledged boolean NOT NULL DEFAULT true CHECK (non_refundable_acknowledged = true),
  terms_version text NOT NULL DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS led_listing_fee_ack_user_idx ON led_listing_fee_acknowledgements (user_id);

ALTER TABLE led_listing_fee_acknowledgements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON led_listing_fee_acknowledgements TO authenticated;

DROP POLICY IF EXISTS "select_own_listing_fee_acknowledgements" ON led_listing_fee_acknowledgements;
CREATE POLICY "select_own_listing_fee_acknowledgements" ON led_listing_fee_acknowledgements
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_listing_fee_acknowledgements" ON led_listing_fee_acknowledgements;
CREATE POLICY "insert_own_listing_fee_acknowledgements" ON led_listing_fee_acknowledgements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
