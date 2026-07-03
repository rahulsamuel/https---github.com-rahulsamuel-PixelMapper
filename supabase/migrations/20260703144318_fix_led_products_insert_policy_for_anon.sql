-- Drop the old insert policy that blocks anon users
DROP POLICY IF EXISTS "Users can create LED products" ON led_products;

-- Allow both authenticated users (with created_by = their uid)
-- and anonymous users (with created_by = null)
CREATE POLICY "Anyone can create LED products" ON led_products FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND created_by IS NULL) OR
    (auth.uid() = created_by)
  );

-- Also fix SELECT policy to allow anon reads
DROP POLICY IF EXISTS "Anyone can read LED products" ON led_products;

CREATE POLICY "Anyone can read LED products" ON led_products FOR SELECT
  TO anon, authenticated
  USING (true);
