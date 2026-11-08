/*
# Prevent users from writing their own admin flag or identity columns

1. Security changes
  - Revokes table-level INSERT and UPDATE on `public.users` from `authenticated`, which previously
    covered every column including `is_admin`.
  - Re-grants INSERT only on (id, email, full_name, company) — the columns the signup/sign-in
    profile upsert actually writes.
  - Re-grants UPDATE only on (full_name, company, updated_at) — the columns the profile screens
    actually change.

2. Important notes
  1. SELECT and DELETE privileges are unchanged.
  2. Administrator status continues to be read from the JWT app_metadata claim, so this change
     only removes the ability to forge the stored flag.
*/

REVOKE INSERT, UPDATE ON public.users FROM authenticated;

GRANT INSERT (id, email, full_name, company) ON public.users TO authenticated;
GRANT UPDATE (full_name, company, updated_at) ON public.users TO authenticated;
