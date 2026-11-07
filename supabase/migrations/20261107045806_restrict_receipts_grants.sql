/*
# Restrict receipts table privileges to read-only for signed-in owners

1. Modified Tables
- `receipts`: privileges reduced to the minimum needed.

2. Security
- Revoked all privileges on `receipts` from `anon` and `authenticated`. Supabase grants full table access to these roles by default on new tables; row level security alone would block writes, but the grants should not be there.
- Granted SELECT to `authenticated` only. The existing `select_own_receipts` policy limits reads to the signed-in user's own receipts.
- `service_role` keeps its privileges because the checkout and payment webhook functions write receipts on the server.

3. Notes
- Idempotent: safe to re-run.
- No data is changed.
*/

REVOKE ALL ON receipts FROM anon, authenticated;
GRANT SELECT ON receipts TO authenticated;
