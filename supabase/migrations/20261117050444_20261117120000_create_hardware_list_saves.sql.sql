/*
# Create saved-work table for the Hardware List tab

1. New Tables
- `hardware_list_saves`: one saved Hardware List configuration per Pixel Map project.
  - `project_id` links to the project (unique, one save per project, cascades on delete).
  - `user_id` is the owner, defaulted to the signed-in user so inserts can omit it.
  - `screens` holds the per-screen hardware configuration as JSON (one entry per screen:
    mounting type, rigging bar type, corner blocks, sandbag weight, quantity adjustments).
  - `updated_at` timestamp.

2. Security
- Row level security is enabled.
- SELECT, INSERT, UPDATE, DELETE granted to `authenticated` only.
- Policies limit all access to rows owned by the signed-in user whose linked project they own.

3. Notes
- Deleting a Pixel Map project removes its saved hardware list automatically.
- Mirrors the existing `rack_drawing_saves` / `pre_visual_saves` pattern.
*/

CREATE TABLE IF NOT EXISTS hardware_list_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  screens jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hardware_list_saves_user_id_idx ON hardware_list_saves (user_id);

ALTER TABLE hardware_list_saves ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON hardware_list_saves TO authenticated;

DROP POLICY IF EXISTS "select_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "select_own_hardware_list_saves" ON hardware_list_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "insert_own_hardware_list_saves" ON hardware_list_saves FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "update_own_hardware_list_saves" ON hardware_list_saves FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "delete_own_hardware_list_saves" ON hardware_list_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Register the new tab in the per-tab identifier system (backfill for existing saves).
INSERT INTO project_tab_identifiers (project_id, tab_key)
SELECT DISTINCT h.project_id, 'hardware_list' FROM hardware_list_saves h
ON CONFLICT (project_id, tab_key) DO NOTHING;