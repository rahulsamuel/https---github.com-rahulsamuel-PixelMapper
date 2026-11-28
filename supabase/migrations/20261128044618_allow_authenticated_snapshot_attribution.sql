/*
# Attribute download snapshots to signed-in users

1. Summary
   Download and pixel-map tracking records now preserve the signed-in user's
   identity. The application sends the active session token to its tracking route,
   and the route writes that user's ID into the snapshot. This lets the admin
   Pixel Maps and Visitor Tracking views show the user's stored email and name
   instead of incorrectly labeling authenticated activity as Guest.

2. Security changes
   - Anonymous visitors may insert only unowned snapshots (`user_id IS NULL`).
   - Authenticated users may insert only snapshots whose `user_id` equals
     `auth.uid()`; a user cannot attribute an event to another account.
   - No existing snapshot rows are changed by this migration.
   - Read and administrative access remain governed by the existing policies.

3. Important notes
   - This is policy-only; no columns or tables are added or removed.
   - Policies are dropped and recreated so the migration is safe to re-run.
*/

DROP POLICY IF EXISTS "Guests can insert unowned snapshots" ON pixel_map_snapshots;
DROP POLICY IF EXISTS "Anon and guests can insert snapshots" ON pixel_map_snapshots;
DROP POLICY IF EXISTS "Authenticated users can insert owned snapshots" ON pixel_map_snapshots;

CREATE POLICY "Guests can insert unowned snapshots"
ON pixel_map_snapshots FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated users can insert owned snapshots"
ON pixel_map_snapshots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
