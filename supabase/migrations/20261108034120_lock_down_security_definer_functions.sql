/*
# Lock down SECURITY DEFINER functions exposed through the Data API

1. Summary
- Moves the three row-level-security helper functions (is_project_collaborator, is_project_owner, is_verified_user) out of the public schema into a private schema. Functions in private are not exposed as /rest/v1/rpc endpoints, but RLS policies can still call them.
- Restricts consume_rate_limit so only the server role can execute it. Callers are server-side code and edge functions, never browsers.

2. Security changes
- New schema `private`, usable by signed-in and anonymous roles only for policy evaluation.
- EXECUTE on the moved helpers revoked from PUBLIC and anon; granted to authenticated and service_role.
- EXECUTE on consume_rate_limit revoked from PUBLIC, anon, and authenticated; granted to service_role only.

3. Notes
- Policies reference functions by internal id, so moving them does not change what the policies check.
- Re-running this migration is safe: schema creation is idempotent and the moves are guarded.
*/

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'is_project_collaborator') THEN
    ALTER FUNCTION public.is_project_collaborator(uuid) SET SCHEMA private;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'is_project_owner') THEN
    ALTER FUNCTION public.is_project_owner(uuid) SET SCHEMA private;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'is_verified_user') THEN
    ALTER FUNCTION public.is_verified_user() SET SCHEMA private;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION private.is_project_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_project_collaborator(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.is_project_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_project_owner(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.is_verified_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_verified_user() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
