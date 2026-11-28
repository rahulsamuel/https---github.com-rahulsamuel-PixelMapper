/*
# Fix receipt read access and add admin read policy

1. Problem
- A blanket "verified users only" policy (require_verified_select) was allowing
  EVERY verified account to read ALL receipts, including other people's
  purchase records with names, emails, and payment amounts. Receipts should be
  readable only by their buyer and by admins.

2. Changes
- `receipts` table, policies only (no data changed):
  - Drops the overly broad require_verified_select / insert / update / delete
    policies on receipts. These writes happen through payment server functions
    using the service role, which bypasses policies, so regular users never
    needed them.
  - Keeps "select_own_receipts": each user can still read their own receipts.
  - Adds "Admins can read all receipts": users with app_metadata.is_admin =
    true can read every receipt, which the new admin Purchases tab uses.

3. Security
- Regular users: can read only receipts where user_id matches their own
  session (auth.uid()).
- Admins: can read all receipts.
- anon: has no grants on receipts and no policy, so no access.
- The user-facing Receipts page keeps working unchanged.

4. Notes
- The SELECT grant to authenticated already exists and is re-asserted here.
- No columns, types, or rows are modified.
*/

DROP POLICY IF EXISTS "require_verified_select" ON receipts;
DROP POLICY IF EXISTS "require_verified_insert" ON receipts;
DROP POLICY IF EXISTS "require_verified_update" ON receipts;
DROP POLICY IF EXISTS "require_verified_delete" ON receipts;

GRANT SELECT ON receipts TO authenticated;

DROP POLICY IF EXISTS "select_own_receipts" ON receipts;
CREATE POLICY "select_own_receipts"
ON receipts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all receipts" ON receipts;
CREATE POLICY "Admins can read all receipts"
ON receipts FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true');
