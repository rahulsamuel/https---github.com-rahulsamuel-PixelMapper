/*
# Admin-only technical document builder saves and images

1. New Tables
- `tech_doc_saves`: one saved Technical Document configuration per Pixel Map project.
  - `project_id` links to the project (unique, one save per project, cascades on delete).
  - `user_id` is the owner, defaulted to the signed-in user so inserts can omit it.
  - `doc` jsonb holds the document setup: title, revision, date, section order, and the
    storage path of each uploaded image (paths only, not file bytes).
  - `updated_at` timestamp.
- `tech_doc_versions`: revision history. Each save that changes the document inserts a row
  with the full `doc` snapshot so a previous revision can be recovered.
  - `project_id` links to the project (cascades on delete).
  - `user_id` owner, defaulted to the signed-in user.
  - `doc` jsonb snapshot, `created_at` timestamp.

2. New Storage bucket
- `tech-doc-images`: a PRIVATE bucket (no public read) holding uploaded diagram images.
  Objects are keyed `<project_id>/<uuid>.<ext>`. 15 MB size limit, image-only MIME allowlist.
  - All object policies (insert, update, delete, select) require the caller to be an
    administrator (JWT app_metadata.is_admin = 'true'), matching the feature's admin-only rule.

3. Security
- Row level security enabled on both tables.
- SELECT, INSERT, UPDATE, DELETE on tech_doc_saves and SELECT/INSERT/DELETE on
  tech_doc_versions granted to `authenticated` only.
- Policies restrict all row access to administrators (JWT app_metadata.is_admin = 'true')
  who own the row and whose linked project they own — non-admin users get no rows and
  cannot write.
- Storage policies restrict the private bucket to administrators for all operations.

4. Notes
- Deleting a Pixel Map project removes its saved document rows automatically (cascade).
- Mirrors the `hardware_list_saves` / admin-lockdown patterns already in this project.
*/

CREATE TABLE IF NOT EXISTS tech_doc_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doc jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tech_doc_saves_user_id_idx ON tech_doc_saves (user_id);

CREATE TABLE IF NOT EXISTS tech_doc_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doc jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tech_doc_versions_project_id_idx ON tech_doc_versions (project_id, created_at DESC);

ALTER TABLE tech_doc_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_doc_versions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON tech_doc_saves TO authenticated;
GRANT SELECT, INSERT, DELETE ON tech_doc_versions TO authenticated;

DROP POLICY IF EXISTS "admin_select_tech_doc_saves" ON tech_doc_saves;
CREATE POLICY "admin_select_tech_doc_saves" ON tech_doc_saves FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "admin_insert_tech_doc_saves" ON tech_doc_saves;
CREATE POLICY "admin_insert_tech_doc_saves" ON tech_doc_saves FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_update_tech_doc_saves" ON tech_doc_saves;
CREATE POLICY "admin_update_tech_doc_saves" ON tech_doc_saves FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
  )
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_delete_tech_doc_saves" ON tech_doc_saves;
CREATE POLICY "admin_delete_tech_doc_saves" ON tech_doc_saves FOR DELETE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "admin_select_tech_doc_versions" ON tech_doc_versions;
CREATE POLICY "admin_select_tech_doc_versions" ON tech_doc_versions FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "admin_insert_tech_doc_versions" ON tech_doc_versions;
CREATE POLICY "admin_insert_tech_doc_versions" ON tech_doc_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pixel_map_projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_delete_tech_doc_versions" ON tech_doc_versions;
CREATE POLICY "admin_delete_tech_doc_versions" ON tech_doc_versions FOR DELETE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
    AND auth.uid() = user_id
  );

-- Private bucket for uploaded technical-document images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tech-doc-images',
  'tech-doc-images',
  false,
  15728640,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "admin_insert_tech_doc_images" ON storage.objects;
CREATE POLICY "admin_insert_tech_doc_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tech-doc-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

DROP POLICY IF EXISTS "admin_update_tech_doc_images" ON storage.objects;
CREATE POLICY "admin_update_tech_doc_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tech-doc-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
)
WITH CHECK (
  bucket_id = 'tech-doc-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

DROP POLICY IF EXISTS "admin_delete_tech_doc_images" ON storage.objects;
CREATE POLICY "admin_delete_tech_doc_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tech-doc-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

DROP POLICY IF EXISTS "admin_select_tech_doc_images" ON storage.objects;
CREATE POLICY "admin_select_tech_doc_images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tech-doc-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);