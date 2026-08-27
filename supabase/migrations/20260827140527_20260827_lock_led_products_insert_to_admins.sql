/*
# Lock LED product creation to admins only

1. Security changes
- Replace the permissive "Anyone can create LED products" INSERT policy on `led_products`
  with an admin-only policy. Previously any anonymous or authenticated user could insert
  new LED products into the database. Now only authenticated users whose JWT
  `app_metadata.is_admin` is `true` may create products.
- SELECT remains open to anon + authenticated (products are public reference data).
- UPDATE and DELETE remain admin-only (already enforced by existing policies).
*/

-- Remove the permissive insert policy
DROP POLICY IF EXISTS "Anyone can create LED products" ON led_products;

-- Replace with admin-only insert
CREATE POLICY "Admins can create LED products"
ON led_products FOR INSERT
TO authenticated
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text);
