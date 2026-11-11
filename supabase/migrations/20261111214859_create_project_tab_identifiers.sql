/*
# Create per-tab identifiers for Pixel Map projects

Plain-English summary
Each saved Pixel Map project gets one identifier per saved tab (Power & Data, Rack Drawing, Pre-Visual, Signal Flow). The identifier is created once, never changes, and is shown in Project Details so the user can copy it.

1. New Table
- `project_tab_identifiers`
  - `id` (uuid, primary key)
  - `project_id` (uuid, references pixel_map_projects, cascades on delete)
  - `tab_key` (text: power_data, rack_drawing, pre_visual, or signal_flow)
  - `identifier` (text, 8 characters, generated automatically)
  - `created_at` (timestamp)
  - Unique on (project_id, tab_key), so each project has at most one identifier per tab.

2. Backfill
- Existing projects that already have a saved power data, rack drawing, pre-visual, or signal flow record receive an identifier for that tab. Generated values are not copied from another database.

3. Security
- Row level security is enabled.
- Only SELECT and INSERT are granted to `authenticated`. No UPDATE or DELETE is granted, so identifiers cannot be changed or removed from the app.
- Policies limit access to projects owned by the signed-in user.

4. Notes
- Identifiers are created when a tab is first saved (or by this backfill for tabs already saved).
*/

CREATE TABLE IF NOT EXISTS project_tab_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  tab_key text NOT NULL CHECK (tab_key IN ('power_data', 'rack_drawing', 'pre_visual', 'signal_flow')),
  identifier text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, tab_key)
);

ALTER TABLE project_tab_identifiers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON project_tab_identifiers TO authenticated;

DROP POLICY IF EXISTS "select_own_project_tab_identifiers" ON project_tab_identifiers;
CREATE POLICY "select_own_project_tab_identifiers" ON project_tab_identifiers FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM pixel_map_projects p
  WHERE p.id = project_tab_identifiers.project_id AND p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "insert_own_project_tab_identifiers" ON project_tab_identifiers;
CREATE POLICY "insert_own_project_tab_identifiers" ON project_tab_identifiers FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM pixel_map_projects p
  WHERE p.id = project_tab_identifiers.project_id AND p.user_id = auth.uid()
));

INSERT INTO project_tab_identifiers (project_id, tab_key)
SELECT DISTINCT project_id, 'power_data' FROM power_data_settings
ON CONFLICT (project_id, tab_key) DO NOTHING;

INSERT INTO project_tab_identifiers (project_id, tab_key)
SELECT DISTINCT project_id, 'rack_drawing' FROM rack_drawing_saves
ON CONFLICT (project_id, tab_key) DO NOTHING;

INSERT INTO project_tab_identifiers (project_id, tab_key)
SELECT DISTINCT project_id, 'pre_visual' FROM pre_visual_saves
ON CONFLICT (project_id, tab_key) DO NOTHING;

INSERT INTO project_tab_identifiers (project_id, tab_key)
SELECT DISTINCT project_id, 'signal_flow' FROM signal_flow_diagrams
ON CONFLICT (project_id, tab_key) DO NOTHING;
