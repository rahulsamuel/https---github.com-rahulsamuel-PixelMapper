/*
# Create saved-preset table for the Test Video Generator tab

1. New Tables
- `test_video_presets`: named generator presets saved by a user inside a Pixel Map project.
  - `project_id` links to the project (cascades on delete; a preset belongs to a project's tab, not shared across projects).
  - `user_id` is the owner, defaulted to the signed-in user so inserts can omit it.
  - `name` is the user-chosen preset name.
  - `settings` holds the generator configuration as JSON (resolution, frame rate, duration, pattern).
  - `created_at` / `updated_at` timestamps.

2. Security
- Row level security is enabled.
- SELECT, INSERT, UPDATE, DELETE granted to `authenticated` only.
- Policies limit all access to rows owned by the signed-in user whose linked project they own.

3. Notes
- Presets are scoped per project, mirroring how the other tab save tables are structured,
  but the client may treat a single project's presets as the working set.
- Deleting a Pixel Map project removes its presets automatically.
*/

CREATE TABLE IF NOT EXISTS test_video_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 60),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_video_presets_project_idx ON test_video_presets (project_id, user_id);

ALTER TABLE test_video_presets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON test_video_presets TO authenticated;

DROP POLICY IF EXISTS "select_own_test_video_presets" ON test_video_presets;
CREATE POLICY "select_own_test_video_presets" ON test_video_presets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_test_video_presets" ON test_video_presets;
CREATE POLICY "insert_own_test_video_presets" ON test_video_presets FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_test_video_presets" ON test_video_presets;
CREATE POLICY "update_own_test_video_presets" ON test_video_presets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_test_video_presets" ON test_video_presets;
CREATE POLICY "delete_own_test_video_presets" ON test_video_presets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
