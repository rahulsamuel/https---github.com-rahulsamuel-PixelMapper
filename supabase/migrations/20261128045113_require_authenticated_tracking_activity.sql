/*
# Require signed-in users for tracking activity

1. Summary
   The application requires an account for all tool use, so tracking records must
   never be created as anonymous activity. This migration removes the anonymous
   snapshot insert path and leaves only the authenticated path, where the stored
   user ID must match the signed-in session.

2. Modified table
   - `pixel_map_snapshots`
   - No columns or existing records are changed.

3. Security changes
   - Removes the anonymous insert policy.
   - Authenticated users may insert only rows with `user_id = auth.uid()`.
   - Anonymous clients no longer receive INSERT permission on this table.
   - Existing read and administrator policies are unchanged.

4. Important notes
   - The API route also rejects requests without a valid signed-in session.
   - The client does not send tracking requests when no session is present.
   - Historical unowned rows are retained for data safety but are no longer
     included in the admin activity lists.
*/

DROP POLICY IF EXISTS "Guests can insert unowned snapshots" ON pixel_map_snapshots;
DROP POLICY IF EXISTS "Anon and guests can insert snapshots" ON pixel_map_snapshots;
DROP POLICY IF EXISTS "Authenticated users can insert owned snapshots" ON pixel_map_snapshots;

CREATE POLICY "Authenticated users can insert owned snapshots"
ON pixel_map_snapshots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

REVOKE INSERT ON pixel_map_snapshots FROM anon;
GRANT INSERT ON pixel_map_snapshots TO authenticated;
