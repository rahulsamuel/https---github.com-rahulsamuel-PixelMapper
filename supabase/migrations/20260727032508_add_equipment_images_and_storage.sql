/*
# Add front/rear images to rack equipment

1. Schema Changes
   - `rack_equipment_library`:
     - `front_image_url` (text, nullable) — public URL of the cropped front-view image in Supabase Storage.
     - `rear_image_url`  (text, nullable) — public URL of the cropped rear-view image in Supabase Storage.

2. Storage
   - Create public bucket `rack-equipment-images` (if not already present) for storing the cropped equipment photos.
   - A public bucket is appropriate here because the equipment library is intentionally shared/public (no-auth admin app), and images are referenced by public URL in the rack builder.

3. Security
   - No RLS policy changes to the table itself (existing anon+authenticated CRUD policies remain in place).
   - The storage bucket is public so the anon-key frontend can both upload (via the client SDK) and read back the images.

4. Notes
   - Columns are nullable so existing rows and the fallback static library keep working without images.
   - Images are stored as `<equipment-id>-front.<ext>` / `<equipment-id>-rear.<ext>` in the bucket.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rack_equipment_library' AND column_name = 'front_image_url'
  ) THEN
    ALTER TABLE rack_equipment_library ADD COLUMN front_image_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rack_equipment_library' AND column_name = 'rear_image_url'
  ) THEN
    ALTER TABLE rack_equipment_library ADD COLUMN rear_image_url text;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('rack-equipment-images', 'rack-equipment-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_rack_equipment_images" ON storage.objects;
CREATE POLICY "public_read_rack_equipment_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'rack-equipment-images');

DROP POLICY IF EXISTS "public_insert_rack_equipment_images" ON storage.objects;
CREATE POLICY "public_insert_rack_equipment_images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'rack-equipment-images');

DROP POLICY IF EXISTS "public_update_rack_equipment_images" ON storage.objects;
CREATE POLICY "public_update_rack_equipment_images"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'rack-equipment-images')
  WITH CHECK (bucket_id = 'rack-equipment-images');

DROP POLICY IF EXISTS "public_delete_rack_equipment_images" ON storage.objects;
CREATE POLICY "public_delete_rack_equipment_images"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'rack-equipment-images');
