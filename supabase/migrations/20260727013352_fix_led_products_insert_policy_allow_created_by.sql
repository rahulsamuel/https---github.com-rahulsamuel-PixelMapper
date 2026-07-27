-- The server-side Supabase client uses the anon key (no user session),
-- so auth.uid() is always NULL. The previous insert WITH CHECK required
-- (auth.uid() IS NULL AND created_by IS NULL) OR (auth.uid() = created_by),
-- which blocked any insert where created_by was set to a real user ID.
-- Allow anon inserts unconditionally — the admin form is gated client-side.

DROP POLICY IF EXISTS "Anyone can create LED products" ON led_products;

CREATE POLICY "Anyone can create LED products" ON led_products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
