/*
# Require verified email for all signed-in database access

1. New Function
- `public.is_verified_user()` returns true when the signed-in account has a confirmed email address (`auth.users.email_confirmed_at` is set).
- Execute is granted to signed-in users only, not to the public or anonymous role.

2. Security
- For every table in `public`, adds four RESTRICTIVE policies (select, insert, update, delete) that apply only to the `authenticated` role.
- A restrictive policy is combined with (ANDed to) the existing permissive policies, so a signed-in user with an unconfirmed email is blocked even if an ownership policy would allow the row.
- Anonymous (signed-out) access is unchanged: the restrictive policies do not target `anon`, so public catalog reads and the contact and feedback submissions keep working.

3. Notes
- Existing permissive policies are not modified or removed.
- The policies are dropped and recreated first, so re-running this migration is safe.
*/

CREATE OR REPLACE FUNCTION public.is_verified_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_verified_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_user() TO authenticated;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'require_verified_select', t.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_verified_user())', 'require_verified_select', t.tablename);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'require_verified_insert', t.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_verified_user())', 'require_verified_insert', t.tablename);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'require_verified_update', t.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_verified_user()) WITH CHECK (public.is_verified_user())', 'require_verified_update', t.tablename);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'require_verified_delete', t.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_verified_user())', 'require_verified_delete', t.tablename);
  END LOOP;
END $$;
