/*
# LED product owner guardrails

1. Changes
- Owners may delete only their own PRIVATE products. Public products are referenced by saved projects, so only admins can remove them.
- A trigger stops non-admin owners from changing a public product back to private or transferring ownership. Public products stay available to everyone who already uses them.

2. Security
- Replaces the owner DELETE policy on led_products (policy only; no data changed).
- Adds a BEFORE UPDATE trigger on led_products (enforced for every writer, admins exempt).

3. Notes
- Existing rows are not modified.
*/

DROP POLICY IF EXISTS "Users can delete own LED products" ON led_products;
DROP POLICY IF EXISTS "Users can delete own private LED products" ON led_products;
CREATE POLICY "Users can delete own private LED products"
ON led_products FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND visibility = 'private');

CREATE OR REPLACE FUNCTION led_products_owner_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', '') = 'true' THEN
    RETURN NEW;
  END IF;
  IF OLD.visibility = 'shared' AND NEW.visibility <> 'shared' THEN
    RAISE EXCEPTION 'Public products cannot be made private again. Ask an admin.';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Only admins can change the owner of a product.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS led_products_owner_guard ON led_products;
CREATE TRIGGER led_products_owner_guard
BEFORE UPDATE ON led_products
FOR EACH ROW EXECUTE FUNCTION led_products_owner_guard();
