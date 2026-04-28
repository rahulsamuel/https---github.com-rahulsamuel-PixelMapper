/*
  # Fix pixel_map_snapshots RLS policies

  ## Changes
  1. Fix "Admins can read all snapshots" - was using recursive public.users.is_admin
     check (broken), now reads from JWT app_metadata (authoritative, no recursion)
  2. Allow anon role to insert snapshots with null user_id (guest tracking via API route
     which runs without an auth session)
*/

-- Fix admin read policy
DROP POLICY IF EXISTS "Admins can read all snapshots" ON public.pixel_map_snapshots;

CREATE POLICY "Admins can read all snapshots"
  ON public.pixel_map_snapshots
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
  );

-- Allow anon role to insert guest snapshots (API route has no session)
DROP POLICY IF EXISTS "Guests can insert snapshots" ON public.pixel_map_snapshots;

CREATE POLICY "Anon and guests can insert snapshots"
  ON public.pixel_map_snapshots
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
