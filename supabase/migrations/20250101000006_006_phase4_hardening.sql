-- ============================================================================
-- 006 — Phase 4.1 launch-hardening foundation
-- ============================================================================
-- Adds indexes, foreign keys, length CHECK constraints, drops the dead
-- `recipes.author_name` column, and tightens RLS on `recipe_likes` so that
-- anon users can no longer enumerate which user liked which recipe.
--
-- Idempotent — safe to re-run.
-- Run as the `postgres` / project owner in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Drop dead column: recipes.author_name
--    Replaced by the join to profiles.display_name in app code (Phase 3 Step 5).
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipes
  DROP COLUMN IF EXISTS author_name;

-- ---------------------------------------------------------------------------
-- 2. Foreign keys
--    recipe_likes.user_id was previously unreferenced — orphan likes were
--    possible when an auth user was deleted.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'recipe_likes_user_id_fkey'
      AND table_name = 'recipe_likes'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.recipe_likes
      ADD CONSTRAINT recipe_likes_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Indexes — hot-path queries
--    - recipes ordered by created_at (every recipe list query)
--    - recipes filtered by (user_id, is_public) (getRecipes / getCommunity)
--    - recipes filtered by is_public alone (partial index for community feed)
--    - saved_recipes by user_id (favorites fetch on login)
--    - recipe_likes by user_id (own-likes fetch on login)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_recipes_created_at
  ON public.recipes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id_is_public
  ON public.recipes (user_id, is_public);

CREATE INDEX IF NOT EXISTS idx_recipes_public_created_at
  ON public.recipes (created_at DESC)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id
  ON public.saved_recipes (user_id);

CREATE INDEX IF NOT EXISTS idx_recipe_likes_user_id
  ON public.recipe_likes (user_id);

-- ---------------------------------------------------------------------------
-- 4. Length CHECK constraints
--    Matches UI maxLength values. NOT VALID then VALIDATE so the migration
--    succeeds even if existing rows violate (you can clean those manually);
--    new writes are immediately enforced.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_display_name_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_display_name_length
  CHECK (display_name IS NULL OR char_length(display_name) <= 60) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_display_name_length;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length
  CHECK (username IS NULL OR char_length(username) <= 30) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_username_length;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length
  CHECK (bio IS NULL OR char_length(bio) <= 280) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_bio_length;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_title_length;
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_title_length
  CHECK (char_length(title) BETWEEN 1 AND 120) NOT VALID;
ALTER TABLE public.recipes VALIDATE CONSTRAINT recipes_title_length;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_description_length;
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_description_length
  CHECK (char_length(description) <= 500) NOT VALID;
ALTER TABLE public.recipes VALIDATE CONSTRAINT recipes_description_length;

-- ---------------------------------------------------------------------------
-- 5. Privacy hardening: recipe_likes
--    Old policy (005_enable_rls_policies.sql) allowed anon + authenticated
--    to SELECT every row → anyone could enumerate "user X liked recipe Y"
--    pairs across the entire app.
--
--    New model:
--      - Anon: no direct table access. Reads aggregate counts via
--        `recipe_like_counts` view only.
--      - Authenticated: can read OWN like rows (for "have I liked this?"
--        checks). Cannot read other users' rows.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "recipe_likes_select_all" ON public.recipe_likes;
DROP POLICY IF EXISTS "recipe_likes_select_own" ON public.recipe_likes;

CREATE POLICY "recipe_likes_select_own"
  ON public.recipe_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE SELECT ON TABLE public.recipe_likes FROM anon;

-- Aggregated counts view — exposes only (recipe_id, like_count).
-- Default (security definer) view perms: bypasses RLS so anon can see counts
-- without needing direct table read access.
CREATE OR REPLACE VIEW public.recipe_like_counts AS
SELECT
  recipe_id,
  count(*)::int AS like_count
FROM public.recipe_likes
GROUP BY recipe_id;

GRANT SELECT ON public.recipe_like_counts TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Refresh PostgREST schema cache so the dropped column and new view
--    are reflected immediately (otherwise clients may see stale schema
--    until the cache TTL expires).
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
