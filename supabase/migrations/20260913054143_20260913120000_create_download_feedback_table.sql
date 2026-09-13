/*
# Create download_feedback table

1. New Tables
- `download_feedback`
  - `id` (uuid, primary key)
  - `category` (text, not null) — one of: 'bug_report', 'feature_request', 'suggestion', 'correction', 'other'
  - `download_type` (text, not null) — which export triggered the feedback (e.g. 'grid_png', 'wiring_diagram', 'raster_map', 'wall_layout', 'equipment_csv', 'equipment_png', 'equipment_pdf', 'deliverables_pdf', 'deliverables_html', 'deliverables_pixel_map', 'rack_png', 'composite_wiring')
  - `message` (text, not null) — the feedback text
  - `submitter_name` (text, nullable) — optional name if user identifies themselves
  - `submitter_email` (text, nullable) — optional email if user identifies themselves
  - `is_anonymous` (boolean, default true) — whether the submission is anonymous
  - `user_id` (uuid, nullable) — the authenticated user's ID if logged in, null for anonymous
  - `status` (text, default 'new') — one of: 'new', 'reviewed', 'resolved'
  - `admin_response` (text, nullable) — optional response from an admin
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `download_feedback`.
- INSERT: anyone (anon + authenticated) can submit feedback. This is a public feedback form.
- SELECT: only admin users (via JWT app_metadata is_admin) can read submissions.
- UPDATE: only admin users can change status or add responses.
- DELETE: only admin users can delete feedback.

3. Indexes
- Index on `created_at DESC` for chronological listing.
- Index on `status` for filtering by new/reviewed/resolved.
*/

CREATE TABLE IF NOT EXISTS download_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'suggestion', 'correction', 'other')),
  download_type text NOT NULL,
  message text NOT NULL,
  submitter_name text,
  submitter_email text,
  is_anonymous boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE download_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (public insert)
DROP POLICY IF EXISTS "Anyone can submit download feedback" ON download_feedback;
CREATE POLICY "Anyone can submit download feedback"
  ON download_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read feedback submissions
DROP POLICY IF EXISTS "Admins can read download feedback" ON download_feedback;
CREATE POLICY "Admins can read download feedback"
  ON download_feedback FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata') ->> 'is_admin' = 'true');

-- Only admins can update feedback (change status, add response)
DROP POLICY IF EXISTS "Admins can update download feedback" ON download_feedback;
CREATE POLICY "Admins can update download feedback"
  ON download_feedback FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata') ->> 'is_admin' = 'true')
  WITH CHECK ((auth.jwt() -> 'app_metadata') ->> 'is_admin' = 'true');

-- Only admins can delete feedback
DROP POLICY IF EXISTS "Admins can delete download feedback" ON download_feedback;
CREATE POLICY "Admins can delete download feedback"
  ON download_feedback FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata') ->> 'is_admin' = 'true');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_download_feedback_created_at ON download_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_feedback_status ON download_feedback(status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_download_feedback_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_download_feedback_updated_at ON download_feedback;
CREATE TRIGGER trg_download_feedback_updated_at
  BEFORE UPDATE ON download_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_download_feedback_updated_at();