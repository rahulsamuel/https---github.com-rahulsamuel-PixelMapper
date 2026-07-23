/*
  # Add Multi-User Collaboration & Realtime to Pixel Map Projects

  1. New Tables
    - `project_collaborators`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to pixel_map_projects, ON DELETE CASCADE)
      - `user_id` (uuid, FK to users, ON DELETE CASCADE)
      - `role` (text, default 'editor')
      - `created_at` (timestamptz)
      - Unique constraint on (project_id, user_id) to prevent duplicate invites

  2. Modified Tables
    - `pixel_map_projects`: no schema changes, but RLS policies updated to allow collaborators access

  3. Security
    - Enable RLS on `project_collaborators`
    - Project owners can SELECT/INSERT/DELETE collaborators on their projects
    - Collaborators can SELECT collaborators on projects they belong to
    - Update `pixel_map_projects` SELECT policy: owner OR collaborator can read
    - Update `pixel_map_projects` UPDATE policy: owner OR collaborator can update
    - `pixel_map_projects` INSERT/DELETE remain owner-only

  4. Realtime
    - Enable realtime publication on `pixel_map_projects` so clients receive live UPDATE events
      when project_data changes (last-write-wins sync)

  5. Notes
    - Collaborators are looked up by email via the `users` table before being added
    - Only the project owner can invite or remove collaborators
    - All collaborators (including owner) can edit the project — last write wins
    - Realtime is enabled via `ALTER TABLE ... REPLICA IDENTITY FULL` + publication
*/

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- Enable RLS on project_collaborators
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborator policies: owner can manage, collaborators can view
DROP POLICY IF EXISTS "select_collaborators" ON project_collaborators;
CREATE POLICY "select_collaborators"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_collaborators" ON project_collaborators;
CREATE POLICY "insert_collaborators"
  ON project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_collaborators" ON project_collaborators;
CREATE POLICY "delete_collaborators"
  ON project_collaborators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Update pixel_map_projects policies to allow collaborator access
-- Drop old owner-only policies
DROP POLICY IF EXISTS "Users can read own projects" ON pixel_map_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON pixel_map_projects;

-- New SELECT policy: owner OR collaborator
CREATE POLICY "read_own_or_collab_projects"
  ON pixel_map_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = pixel_map_projects.id
      AND c.user_id = auth.uid()
    )
  );

-- New UPDATE policy: owner OR collaborator
CREATE POLICY "update_own_or_collab_projects"
  ON pixel_map_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = pixel_map_projects.id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators c
      WHERE c.project_id = pixel_map_projects.id
      AND c.user_id = auth.uid()
    )
  );

-- Enable realtime on pixel_map_projects
ALTER TABLE pixel_map_projects REPLICA IDENTITY FULL;

-- Add to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'pixel_map_projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pixel_map_projects;
  END IF;
END $$;

-- Index for collaborator lookups
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
