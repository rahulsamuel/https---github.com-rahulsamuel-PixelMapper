/*
# Secure the rack equipment image bucket

1. Security changes
  - Replaces the three write policies on the `rack-equipment-images` bucket, which allowed the
    unauthenticated `anon` role to upload, overwrite and delete any object in the bucket.
  - Uploads, updates and deletes now require an administrator (the app only writes this bucket from
    the rack equipment admin screen). Public read access is unchanged, so the rack builder keeps
    showing the images.
  - Adds a 5 MB size limit and an image-only MIME allowlist to the bucket.

2. Important notes
  1. Administrator status is read from the JWT app_metadata claim, the same source the app uses.
  2. Read access remains public, which is intentional for a public bucket of equipment artwork.
*/

DROP POLICY IF EXISTS "public_insert_rack_equipment_images" ON storage.objects;
DROP POLICY IF EXISTS "public_update_rack_equipment_images" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_rack_equipment_images" ON storage.objects;

CREATE POLICY "admin_insert_rack_equipment_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rack-equipment-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

CREATE POLICY "admin_update_rack_equipment_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rack-equipment-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
)
WITH CHECK (
  bucket_id = 'rack-equipment-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

CREATE POLICY "admin_delete_rack_equipment_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rack-equipment-images'
  AND ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
);

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'rack-equipment-images';
