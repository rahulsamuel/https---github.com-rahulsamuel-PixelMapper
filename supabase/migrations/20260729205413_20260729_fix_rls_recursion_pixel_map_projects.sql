/*
# Fix infinite RLS recursion between pixel_map_projects and project_collaborators

## Problem
The SELECT and UPDATE policies on `pixel_map_projects` check `project_collaborators`
for collaboration access, while the policies on `project_collaborators` check
`pixel_map_projects` for ownership. This creates an infinite recursion that
causes all queries (save, share, load) to fail with an RLS error.

## Fix
1. Create two `SECURITY DEFINER` helper functions that bypass RLS:
   - `is_project_collaborator(project_id uuid)` — returns true if the current
     user is a collaborator on the given project.
   - `is_project_owner(project_id uuid)` — returns true if the current user
     owns the given project.
2. Rewrite the `pixel_map_projects` SELECT and UPDATE policies to use
   `is_project_collaborator()` instead of an inline EXISTS subquery on
   `project_collaborators`.
3. Rewrite the `project_collaborators` SELECT, INSERT, and DELETE policies to
   use `is_project_owner()` instead of an inline EXISTS subquery on
   `pixel_map_projects`.

The `SECURITY DEFINER` functions run with the table owner's privileges and
bypass RLS, breaking the mutual recursion.

## Tables affected
- `pixel_map_projects` — SELECT and UPDATE policies rewritten
- `project_collaborators` — SELECT, INSERT, and DELETE policies rewritten
*/

-- Helper: is the current user a collaborator on this project?
CREATE OR REPLACE FUNCTION public.is_project_collaborator(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators c
    WHERE c.project_id = p_project_id
      AND c.user_id = auth.uid()
  );
$$;

-- Helper: is the current user the owner of this project?
CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pixel_map_projects p
    WHERE p.id = p_project_id
      AND p.user_id = auth.uid()
  );
$$;

-- pixel_map_projects: rewrite SELECT policy
DROP POLICY IF EXISTS "read_own_or_collab_projects" ON public.pixel_map_projects;
CREATE POLICY "read_own_or_collab_projects"
ON public.pixel_map_projects FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_project_collaborator(id)
);

-- pixel_map_projects: rewrite UPDATE policy
DROP POLICY IF EXISTS "update_own_or_collab_projects" ON public.pixel_map_projects;
CREATE POLICY "update_own_or_collab_projects"
ON public.pixel_map_projects FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_project_collaborator(id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_project_collaborator(id)
);

-- project_collaborators: rewrite SELECT policy
DROP POLICY IF EXISTS "select_collaborators" ON public.project_collaborators;
CREATE POLICY "select_collaborators"
ON public.project_collaborators FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_project_owner(project_id)
);

-- project_collaborators: rewrite INSERT policy
DROP POLICY IF EXISTS "insert_collaborators" ON public.project_collaborators;
CREATE POLICY "insert_collaborators"
ON public.project_collaborators FOR INSERT
TO authenticated
WITH CHECK (public.is_project_owner(project_id));

-- project_collaborators: rewrite DELETE policy
DROP POLICY IF EXISTS "delete_collaborators" ON public.project_collaborators;
CREATE POLICY "delete_collaborators"
ON public.project_collaborators FOR DELETE
TO authenticated
USING (public.is_project_owner(project_id));
