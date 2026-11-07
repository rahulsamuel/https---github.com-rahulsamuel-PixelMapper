/*
# LED products: private (user-owned) vs shared (catalog) visibility

1. Changed table: led_products
- New column `visibility` (text, default 'shared', must be 'shared' or 'private').
- Existing products keep 'shared', so the public catalog and calculator are unchanged.
- New index on `created_by` for per-user lookups.

2. Security
- Anyone (signed out or signed in) can read shared products only.
- Signed-in users can read their own products, whether shared or private.
- Admins can read every product.
- Signed-in users can add products only as themselves and only as private.
- Admins can still add any product, as before.
- Owners can edit and delete their own products. Admins can edit and delete any product.
- Removed the anonymous delete policy that let anyone delete any product with the public key.

3. Notes
- Policies are dropped with IF EXISTS before being recreated, so this migration is safe to re-run.
- Nothing is dropped from the table; no data is changed.
*/

ALTER TABLE led_products ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'shared';

ALTER TABLE led_products DROP CONSTRAINT IF EXISTS led_products_visibility_check;
ALTER TABLE led_products ADD CONSTRAINT led_products_visibility_check CHECK (visibility IN ('shared', 'private'));

CREATE INDEX IF NOT EXISTS led_products_created_by_idx ON led_products (created_by);

DROP POLICY IF EXISTS "Anyone can read LED products" ON led_products;
DROP POLICY IF EXISTS "Anyone can read shared LED products" ON led_products;
CREATE POLICY "Anyone can read shared LED products"
ON led_products FOR SELECT
TO anon, authenticated
USING (visibility = 'shared');

DROP POLICY IF EXISTS "Users can read own LED products" ON led_products;
CREATE POLICY "Users can read own LED products"
ON led_products FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can read any LED product" ON led_products;
CREATE POLICY "Admins can read any LED product"
ON led_products FOR SELECT
TO authenticated
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text);

DROP POLICY IF EXISTS "Users can create own private LED products" ON led_products;
CREATE POLICY "Users can create own private LED products"
ON led_products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by AND visibility = 'private');

DROP POLICY IF EXISTS "delete_led_products_anon" ON led_products;
