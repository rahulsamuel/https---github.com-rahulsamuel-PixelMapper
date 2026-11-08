/*
# Scope product image writes to their owner

1. Security changes
  - Replaces the bucket-wide INSERT and DELETE policies on the `product-images` bucket, which let
    any signed-in user overwrite or delete any other seller's product imagery.
  - Writes are now limited to the object's own uploader (`owner = auth.uid()`) or an administrator.
  - Public read access is unchanged.

2. Important notes
  1. The spec sheet parser uploads these images with the service role, which bypasses row level
     security, so automated uploads are unaffected.
  2. An explicit UPDATE policy is added so an uploader can replace their own file.
*/

DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_owner_update" ON storage.objects;

CREATE POLICY "product_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    owner = auth.uid()
    OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
  )
);

CREATE POLICY "product_images_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    owner = auth.uid()
    OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    owner = auth.uid()
    OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
  )
);

CREATE POLICY "product_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    owner = auth.uid()
    OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true'
  )
);
