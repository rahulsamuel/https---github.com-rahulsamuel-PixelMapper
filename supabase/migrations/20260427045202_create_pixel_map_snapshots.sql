/*
  # Create pixel map snapshots table

  ## Purpose
  Stores snapshots of pixel maps created by users (guests and logged-in).
  Each snapshot captures a thumbnail image (PNG data URL), the full project JSON,
  screen metadata, and links to a user if authenticated.

  ## New Tables
  - `pixel_map_snapshots`
    - `id` (uuid, primary key)
    - `user_id` (uuid, nullable FK → auth.users) — null for guests
    - `session_id` (text) — anonymous session identifier for guests
    - `screen_name` (text) — name of the screen/project
    - `grid_width` (int) — number of tile columns
    - `grid_height` (int) — number of tile rows
    - `thumbnail` (text) — base64 PNG data URL of the rendered grid
    - `project_data` (jsonb) — full project JSON snapshot
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled; admins read all, users read/write own, guests insert only
  - Admins are identified via the `users.is_admin` column
*/

CREATE TABLE IF NOT EXISTS pixel_map_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL DEFAULT '',
  screen_name text NOT NULL DEFAULT 'Untitled',
  grid_width int NOT NULL DEFAULT 0,
  grid_height int NOT NULL DEFAULT 0,
  thumbnail text NOT NULL DEFAULT '',
  project_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pixel_map_snapshots ENABLE ROW LEVEL SECURITY;

-- Admins can read all snapshots
CREATE POLICY "Admins can read all snapshots"
  ON pixel_map_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_admin = true
    )
  );

-- Authenticated users can read their own snapshots
CREATE POLICY "Users can read own snapshots"
  ON pixel_map_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own snapshots
CREATE POLICY "Users can insert own snapshots"
  ON pixel_map_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Authenticated users can update their own snapshots
CREATE POLICY "Users can update own snapshots"
  ON pixel_map_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guests (anon) can insert snapshots (user_id will be null)
CREATE POLICY "Guests can insert snapshots"
  ON pixel_map_snapshots FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON pixel_map_snapshots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON pixel_map_snapshots (user_id);
