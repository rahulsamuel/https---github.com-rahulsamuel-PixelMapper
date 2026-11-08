/*
# Restrict user directory reads and add an owner-checked collaborator invite

1. Security changes
  - Drops the permissive `Users can read all profiles for collaboration` SELECT policy on
    `public.users`, which allowed every signed-in user to read every profile row
    (email, full name, company, admin flag).
  - Adds `private.shares_project_with(uuid)`, a SECURITY DEFINER helper that reports whether the
    calling user and the target user are connected through a project (owner <-> collaborator or
    two collaborators on the same project).
  - Adds a replacement SELECT policy `read_project_peers` on `public.users` using that helper, so a
    user can still see the profiles the collaboration screens need, and nothing else.
  - Adds `public.invite_project_collaborator(uuid, text)`: a SECURITY DEFINER RPC that resolves an
    invitee by email case-insensitively and inserts the collaborator row, but only when the caller
    is the verified owner of the project. It returns a short status string and no profile data, so
    the client no longer needs to read the users table to invite somebody.
  - Adds a unique index on (project_id, user_id) in `public.project_collaborators` when the existing
    data permits it, so repeated invites cannot create duplicate rows.

2. Important notes
  1. Existing own-row and admin SELECT policies on `public.users` are unchanged.
  2. EXECUTE on both new functions is revoked from PUBLIC and anon.
*/

CREATE OR REPLACE FUNCTION private.shares_project_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pixel_map_projects p
    LEFT JOIN public.project_collaborators pc ON pc.project_id = p.id
    WHERE (p.user_id = auth.uid() OR pc.user_id = auth.uid())
      AND (
        p.user_id = p_user_id
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc2
          WHERE pc2.project_id = p.id AND pc2.user_id = p_user_id
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION private.shares_project_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.shares_project_with(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can read all profiles for collaboration" ON public.users;

DROP POLICY IF EXISTS "read_project_peers" ON public.users;
CREATE POLICY "read_project_peers"
ON public.users FOR SELECT
TO authenticated
USING (private.shares_project_with(id));

DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS project_collaborators_project_user_key
      ON public.project_collaborators (project_id, user_id);
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Duplicate collaborator rows exist; unique index not created.';
  END;
END $$;

CREATE OR REPLACE FUNCTION public.invite_project_collaborator(p_project_id uuid, p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid;
  v_inserted integer;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_verified_user() THEN
    RETURN 'unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pixel_map_projects
    WHERE id = p_project_id AND user_id = auth.uid()
  ) THEN
    RETURN 'unauthorized';
  END IF;

  SELECT id INTO v_user
  FROM public.users
  WHERE lower(email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN 'not_found';
  END IF;

  IF v_user = auth.uid() THEN
    RETURN 'self';
  END IF;

  INSERT INTO public.project_collaborators (project_id, user_id)
  VALUES (p_project_id, v_user)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN 'exists';
  END IF;

  RETURN 'ok';
END $$;

REVOKE EXECUTE ON FUNCTION public.invite_project_collaborator(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_project_collaborator(uuid, text) TO authenticated;
