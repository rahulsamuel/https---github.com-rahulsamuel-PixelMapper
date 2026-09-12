/*
# Allow admins to read contact messages

1. Security changes
- Adds a SELECT policy on `contact_messages` so authenticated admin users can read all submissions.
- The existing INSERT policy for public submissions remains unchanged.
- Non-admin authenticated users and anon users cannot read messages.
*/

DROP POLICY IF EXISTS "Admins can read contact messages" ON contact_messages;

CREATE POLICY "Admins can read contact messages"
ON contact_messages FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata') ->> 'is_admin' = 'true');
