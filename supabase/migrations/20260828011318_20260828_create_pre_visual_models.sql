/*
# Create pre_visual_models table and storage bucket

1. New Tables
   - `pre_visual_models`
     - `id` (uuid, primary key) — unique identifier for each model entry
     - `name` (text, not null) — display name for the model
     - `category` (text, not null) — one of: tile, hardware, processor, misc
     - `file_url` (text, not null) — public URL of the uploaded file in Supabase Storage
     - `file_name` (text, not null) — original uploaded file name
     - `file_size` (bigint, not null) — file size in bytes
     - `uploaded_at` (timestamptz, default now()) — upload timestamp

2. Storage
   - Create public bucket `pre-visual-models` for storing 3D model files (GLB, GLTF, OBJ, etc.)
   - Public bucket so the anon-key frontend can upload and read files directly.

3. Security
   - Enable RLS on `pre_visual_models`.
   - Allow anon + authenticated CRUD because the model library is intentionally shared/public (no-auth admin app pattern matching existing rack-equipment-images bucket).
   - Storage bucket policies allow public read, insert, update, delete.

4. Notes
   - The table is single-tenant (no user_id) matching the existing app pattern where LED products and rack equipment are shared libraries.
   - Files are stored as `<uuid>.<ext>` in the bucket.
   - The migration is idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS pre_visual_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('tile', 'hardware', 'processor', 'misc')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE pre_visual_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pre_visual_models" ON pre_visual_models;
CREATE POLICY "anon_select_pre_visual_models"
  ON pre_visual_models FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pre_visual_models" ON pre_visual_models;
CREATE POLICY "anon_insert_pre_visual_models"
  ON pre_visual_models FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pre_visual_models" ON pre_visual_models;
CREATE POLICY "anon_update_pre_visual_models"
  ON pre_visual_models FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pre_visual_models" ON pre_visual_models;
CREATE POLICY "anon_delete_pre_visual_models"
  ON pre_visual_models FOR DELETE
  TO anon, authenticated USING (true);

-- Storage bucket for 3D model files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pre-visual-models', 'pre-visual-models', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_pre_visual_models" ON storage.objects;
CREATE POLICY "public_read_pre_visual_models"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'pre-visual-models');

DROP POLICY IF EXISTS "public_insert_pre_visual_models" ON storage.objects;
CREATE POLICY "public_insert_pre_visual_models"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'pre-visual-models');

DROP POLICY IF EXISTS "public_update_pre_visual_models" ON storage.objects;
CREATE POLICY "public_update_pre_visual_models"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'pre-visual-models')
  WITH CHECK (bucket_id = 'pre-visual-models');

DROP POLICY IF EXISTS "public_delete_pre_visual_models" ON storage.objects;
CREATE POLICY "public_delete_pre_visual_models"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'pre-visual-models');
