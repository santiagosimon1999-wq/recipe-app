-- ============================================================================
-- 015 — Storage bucket policies (recipe images + profile avatars)
-- ============================================================================
-- Run in Supabase SQL Editor after buckets exist in the dashboard:
--   - recipe-images (public)
--   - profile-avatars (public)
--
-- Paths match src/lib/storageService.ts: {userId}/{uuid}.ext
-- Idempotent — safe to re-run.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- recipe-images
DROP POLICY IF EXISTS "recipe_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "recipe_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "recipe_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "recipe_images_owner_delete" ON storage.objects;

CREATE POLICY "recipe_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'recipe-images');

CREATE POLICY "recipe_images_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_images_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_images_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- profile-avatars
DROP POLICY IF EXISTS "profile_avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_avatars_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_avatars_owner_delete" ON storage.objects;

CREATE POLICY "profile_avatars_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "profile_avatars_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_avatars_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_avatars_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
