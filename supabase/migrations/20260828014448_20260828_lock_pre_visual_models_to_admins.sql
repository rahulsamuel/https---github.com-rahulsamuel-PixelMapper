/*
# Lock 3D model uploads to admins only

1. Security changes
   - Replace the permissive anon INSERT/UPDATE/DELETE policies on `pre_visual_models`
     with admin-only policies. Previously any anonymous or authenticated user could
     upload, modify, or delete 3D model entries. Now only authenticated users whose
     JWT `app_metadata.is_admin` is `true` may write.
   - SELECT remains open to anon + authenticated (models are public reference data
     the viewer needs to read).
   - Storage bucket `pre-visual-models` INSERT/UPDATE/DELETE policies are likewise
     restricted to admin-only. SELECT remains public so the viewer can load model files.

2. Notes
   - Matches the pattern established by `led_products` admin-lock migration.
   - Idempotent — safe to re-run.
*/

-- Table policies: lock writes to admins
DROP POLICY IF EXISTS "anon_insert_pre_visual_models" ON pre_visual_models;
CREATE POLICY "admin_insert_pre_visual_models"
  ON pre_visual_models FOR INSERT
  TO authenticated
  WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text);

DROP POLICY IF EXISTS "anon_update_pre_visual_models" ON pre_visual_models;
CREATE POLICY "admin_update_pre_visual_models"
  ON pre_visual_models FOR UPDATE
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text);

DROP POLICY IF EXISTS "anon_delete_pre_visual_models" ON pre_visual_models;
CREATE POLICY "admin_delete_pre_visual_models"
  ON pre_visual_models FOR DELETE
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text);

-- Storage policies: lock writes to admins
DROP POLICY IF EXISTS "public_insert_pre_visual_models" ON storage.objects;
CREATE POLICY "admin_insert_pre_visual_models"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pre-visual-models'
    AND ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text
  );

DROP POLICY IF EXISTS "public_update_pre_visual_models" ON storage.objects;
CREATE POLICY "admin_update_pre_visual_models"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pre-visual-models'
    AND ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text
  )
  WITH CHECK (
    bucket_id = 'pre-visual-models'
    AND ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text
  );

DROP POLICY IF EXISTS "public_delete_pre_visual_models" ON storage.objects;
CREATE POLICY "admin_delete_pre_visual_models"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pre-visual-models'
    AND ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text) = 'true'::text
  );
