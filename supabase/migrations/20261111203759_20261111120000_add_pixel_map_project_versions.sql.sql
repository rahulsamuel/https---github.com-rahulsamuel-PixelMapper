/*
# Add version history for pixel map projects

Plain-English summary
- Every time a saved pixel map project's contents change, the previous contents are copied into a history table first, so an earlier version can always be restored.
- Snapshots are taken at most once every 5 minutes per project, and only the 50 most recent snapshots are kept per project to limit storage.

1. New Tables
- `pixel_map_project_versions`
  - `id` (uuid, primary key)
  - `project_id` (uuid, references pixel_map_projects, cascade delete)
  - `project_name` (text)
  - `project_data` (jsonb, the full project contents at that point)
  - `created_at` (timestamptz)

2. Triggers and functions
- `snapshot_pixel_map_project_version()` runs after an update to pixel_map_projects. It stores the old contents when project_data changed and no snapshot was taken in the last 5 minutes. It then keeps only the newest 50 snapshots for that project.

3. Security
- Row level security enabled on `pixel_map_project_versions`.
- Authenticated users can read versions only for projects they can already see (owner or collaborator), using the existing pixel_map_projects access rules.
- No insert, update, or delete grants for app users; snapshots are written only by the trigger.
- The trigger function is not callable through the Data API.

4. Important notes
- Restoring a version is done by the app as a normal project update, which itself creates a snapshot of the current contents first, so a restore can be undone.
*/

CREATE TABLE IF NOT EXISTS pixel_map_project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  project_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pixel_map_project_versions_project_created
  ON pixel_map_project_versions (project_id, created_at DESC);

ALTER TABLE pixel_map_project_versions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON pixel_map_project_versions TO authenticated;

DROP POLICY IF EXISTS "select_versions_of_visible_projects" ON pixel_map_project_versions;
CREATE POLICY "select_versions_of_visible_projects" ON pixel_map_project_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = pixel_map_project_versions.project_id
    )
  );

CREATE OR REPLACE FUNCTION snapshot_pixel_map_project_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.project_data IS DISTINCT FROM NEW.project_data
     AND NOT EXISTS (
       SELECT 1 FROM pixel_map_project_versions v
       WHERE v.project_id = OLD.id
         AND v.created_at > now() - interval '5 minutes'
     ) THEN
    INSERT INTO pixel_map_project_versions (project_id, project_name, project_data)
    VALUES (OLD.id, OLD.project_name, OLD.project_data);

    DELETE FROM pixel_map_project_versions
    WHERE project_id = OLD.id
      AND id NOT IN (
        SELECT id FROM pixel_map_project_versions
        WHERE project_id = OLD.id
        ORDER BY created_at DESC
        LIMIT 50
      );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION snapshot_pixel_map_project_version() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS snapshot_pixel_map_project_version_trigger ON pixel_map_projects;
CREATE TRIGGER snapshot_pixel_map_project_version_trigger
  AFTER UPDATE OF project_data ON pixel_map_projects
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_pixel_map_project_version();
