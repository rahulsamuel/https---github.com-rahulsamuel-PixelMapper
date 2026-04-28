/*
  # Fix admin RLS policies to use JWT app_metadata

  ## Problem
  The "Admins can read all users" policy checked public.users.is_admin to determine
  admin status, but public.users.is_admin may be out of sync. The authoritative
  admin flag is now stored in auth.users app_metadata (is_admin: true), embedded
  in the JWT and readable via auth.jwt().

  ## Changes
  - Drop the recursive "Admins can read all users" SELECT policy on users
  - Replace it with a JWT-based check: (auth.jwt()->'app_metadata'->>'is_admin')='true'
  - Same fix for led_products delete/update — only admins should be able to
    delete/update any product (not just their own), via JWT check
*/

-- Fix users admin read policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
  );

-- Also update led_products so admin can manage all products (not just own)
DROP POLICY IF EXISTS "Admins can delete any LED product" ON public.led_products;
DROP POLICY IF EXISTS "Admins can update any LED product" ON public.led_products;

CREATE POLICY "Admins can delete any LED product"
  ON public.led_products
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
  );

CREATE POLICY "Admins can update any LED product"
  ON public.led_products
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
  )
  WITH CHECK (
    (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
  );
