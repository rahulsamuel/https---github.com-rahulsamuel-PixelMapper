/*
# Prevent project ownership from being reassigned

1. Security changes
  - Revokes the table-level UPDATE privilege on `public.pixel_map_projects` from `authenticated`,
    which covered the `user_id` column and allowed an invited collaborator to set themselves as the
    project owner while still satisfying the update policy.
  - Re-grants UPDATE only on (project_name, project_data, updated_at), the columns the app writes
    when a project is saved.

2. Important notes
  1. SELECT, INSERT and DELETE privileges and all policies are unchanged, so saving, sharing and
     deleting projects continue to work exactly as before.
*/

REVOKE UPDATE ON public.pixel_map_projects FROM authenticated;

GRANT UPDATE (project_name, project_data, updated_at) ON public.pixel_map_projects TO authenticated;
