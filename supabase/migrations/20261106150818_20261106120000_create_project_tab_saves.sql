/*
# Create saved-work tables for Power & Data, Rack Drawing and Pre-Visual

1. New Tables
- `power_data_settings`: one saved Power & Data setup per Pixel Map project screen.
  - `project_id` links to the project, `screen_id` identifies the screen inside it.
  - `settings` holds the tab's inputs as JSON.
- `rack_drawing_saves`: one saved Rack Drawing layout per Pixel Map project.
- `pre_visual_saves`: one saved Pre-Visual setup per Pixel Map project.
  - `settings` holds the view settings and `screens` holds the screen list as JSON.

2. Security
- Row level security is enabled on all three tables.
- Each table is readable and writable only by the signed-in user who owns the linked project.
- Access is granted to the `authenticated` role only. Anonymous visitors cannot read or write these tables.

3. Notes
- Deleting a Pixel Map project removes its saved tab work automatically.
- The owner column defaults to the signed-in user, so inserts do not need to pass it.
*/

CREATE TABLE IF NOT EXISTS power_data_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  screen_id text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, screen_id)
);

CREATE TABLE IF NOT EXISTS rack_drawing_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pre_visual_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  screens jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS power_data_settings_user_id_idx ON power_data_settings (user_id);
CREATE INDEX IF NOT EXISTS rack_drawing_saves_user_id_idx ON rack_drawing_saves (user_id);
CREATE INDEX IF NOT EXISTS pre_visual_saves_user_id_idx ON pre_visual_saves (user_id);

ALTER TABLE power_data_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rack_drawing_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_visual_saves ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON power_data_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rack_drawing_saves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pre_visual_saves TO authenticated;

DROP POLICY IF EXISTS "select_own_power_data_settings" ON power_data_settings;
CREATE POLICY "select_own_power_data_settings" ON power_data_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_power_data_settings" ON power_data_settings;
CREATE POLICY "insert_own_power_data_settings" ON power_data_settings FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_power_data_settings" ON power_data_settings;
CREATE POLICY "update_own_power_data_settings" ON power_data_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_power_data_settings" ON power_data_settings;
CREATE POLICY "delete_own_power_data_settings" ON power_data_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "select_own_rack_drawing_saves" ON rack_drawing_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "insert_own_rack_drawing_saves" ON rack_drawing_saves FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "update_own_rack_drawing_saves" ON rack_drawing_saves FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "delete_own_rack_drawing_saves" ON rack_drawing_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "select_own_pre_visual_saves" ON pre_visual_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "insert_own_pre_visual_saves" ON pre_visual_saves FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "update_own_pre_visual_saves" ON pre_visual_saves FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "delete_own_pre_visual_saves" ON pre_visual_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
