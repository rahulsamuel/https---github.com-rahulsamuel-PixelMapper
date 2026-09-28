/*
  # Create Signal Flow Diagrams

  1. New Tables
    - `signal_flow_diagrams`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to pixel_map_projects, ON DELETE CASCADE)
      - `user_id` (uuid, FK to users, ON DELETE CASCADE — the diagram owner)
      - `diagram_name` (text, default 'Untitled Signal Flow')
      - `diagram_data` (jsonb — stores devices, connections, cable types)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (project_id) — one signal flow diagram per project

  2. Security
    - Enable RLS on `signal_flow_diagrams`
    - SELECT: owner OR collaborator of the parent pixel_map_project
    - INSERT: only the project owner (user creates a signal flow for their project)
    - UPDATE: owner OR collaborator
    - DELETE: owner only
    - Reuses the existing project_collaborators table for access checks

  3. Notes
    - Each pixel_map_project can have exactly one signal flow diagram
    - Collaborators can edit the diagram (last-write-wins, same as project_data)
    - The diagram_data JSON stores: devices (with ports, positions, labels) and connections (cable paths between ports)
*/

CREATE TABLE IF NOT EXISTS signal_flow_diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagram_name text NOT NULL DEFAULT 'Untitled Signal Flow',
  diagram_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id)
);

ALTER TABLE signal_flow_diagrams ENABLE ROW LEVEL SECURITY;

-- SELECT: owner of the diagram OR collaborator of the parent project
DROP POLICY IF EXISTS "select_signal_flow_diagrams" ON signal_flow_diagrams;
CREATE POLICY "select_signal_flow_diagrams"
  ON signal_flow_diagrams FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = signal_flow_diagrams.project_id
      AND c.user_id = auth.uid()
    )
  );

-- INSERT: only the project owner can create a signal flow for their project
DROP POLICY IF EXISTS "insert_signal_flow_diagrams" ON signal_flow_diagrams;
CREATE POLICY "insert_signal_flow_diagrams"
  ON signal_flow_diagrams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = signal_flow_diagrams.project_id
      AND p.user_id = auth.uid()
    )
  );

-- UPDATE: owner OR collaborator
DROP POLICY IF EXISTS "update_signal_flow_diagrams" ON signal_flow_diagrams;
CREATE POLICY "update_signal_flow_diagrams"
  ON signal_flow_diagrams FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = signal_flow_diagrams.project_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = signal_flow_diagrams.project_id
      AND c.user_id = auth.uid()
    )
  );

-- DELETE: owner only
DROP POLICY IF EXISTS "delete_signal_flow_diagrams" ON signal_flow_diagrams;
CREATE POLICY "delete_signal_flow_diagrams"
  ON signal_flow_diagrams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_signal_flow_diagrams_project_id ON signal_flow_diagrams(project_id);
CREATE INDEX IF NOT EXISTS idx_signal_flow_diagrams_user_id ON signal_flow_diagrams(user_id);
