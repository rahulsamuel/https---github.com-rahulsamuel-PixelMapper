/*
# Add device model pictures

1. New Tables
- `device_model_images`
  - `model` (text, primary key) - device model name such as "XD Box" or "CVT10".
  - `image_url` (text, not null) - public URL of the picture in storage.
  - `updated_at` (timestamptz) - when the picture was last replaced.

2. Storage
- Public bucket `device-images` for device pictures (5 MB limit, image types only).

3. Security
- Everyone (signed-in and anonymous app users) can read the pictures and the table.
- Only administrators (checked from the signed-in session's admin flag) can add, replace or change pictures, both in the table and in the bucket.
- Administrator status is read from the JWT app_metadata claim, the same source the rest of the app uses.
*/

CREATE TABLE IF NOT EXISTS device_model_images (
  model text PRIMARY KEY,
  image_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE device_model_images ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON device_model_images TO anon, authenticated;
GRANT INSERT, UPDATE ON device_model_images TO authenticated;

DROP POLICY IF EXISTS "public_read_device_model_images" ON device_model_images;
CREATE POLICY "public_read_device_model_images"
ON device_model_images FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_device_model_images" ON device_model_images;
CREATE POLICY "admin_insert_device_model_images"
ON device_model_images FOR INSERT
TO authenticated
WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "admin_update_device_model_images" ON device_model_images;
CREATE POLICY "admin_update_device_model_images"
ON device_model_images FOR UPDATE
TO authenticated
USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('device-images', 'device-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "public_read_device_images" ON storage.objects;
CREATE POLICY "public_read_device_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'device-images');

DROP POLICY IF EXISTS "admin_insert_device_images" ON storage.objects;
CREATE POLICY "admin_insert_device_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'device-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

DROP POLICY IF EXISTS "admin_update_device_images" ON storage.objects;
CREATE POLICY "admin_update_device_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'device-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
)
WITH CHECK (
  bucket_id = 'device-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);
