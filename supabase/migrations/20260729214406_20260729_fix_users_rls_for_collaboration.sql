/*
# Fix users table RLS for collaboration features

## Problem
The `users` table only allows users to read their own row (`auth.uid() = id`).
This breaks collaboration:
- `inviteCollaborator` looks up a user by email → returns null → "No user found"
- `getCollaborators` joins `users!inner (email, full_name)` → returns no rows
- `getProjectOwner` joins `users!inner (email)` → returns no rows

## Fix
Add a SELECT policy allowing authenticated users to read all rows in the `users` table.
This is required for collaboration: users must be able to look up collaborators by email
and see collaborator/owner email addresses. The table only contains basic profile info
(id, email, full_name, company, is_admin) — no sensitive data.

## Security
- Existing policies (read own, update own, insert own, admin read all) are preserved.
- New policy: authenticated users can SELECT all rows (needed for collaboration lookups).
*/

DROP POLICY IF EXISTS "Users can read all profiles for collaboration" ON users;
CREATE POLICY "Users can read all profiles for collaboration"
ON users FOR SELECT
TO authenticated
USING (true);
