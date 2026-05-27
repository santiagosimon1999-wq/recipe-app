-- Row Level Security for Panda Recipes
-- Run this entire script in the Supabase SQL Editor (as postgres / project owner).
-- Safe to re-run: drops named policies before recreating them.
--
-- Supabase needs BOTH table GRANTs and RLS policies. GRANTs alone are not enough;
-- RLS alone is not enough either.

-- ---------------------------------------------------------------------------
-- Table privileges (fixes "permission denied for table ...")
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.recipes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.recipes TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.saved_recipes TO authenticated;

GRANT SELECT ON TABLE public.recipe_likes TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.recipe_likes TO authenticated;

-- Required for IDENTITY / serial inserts (saved_recipes, recipes, recipe_likes)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Any signed-in or anonymous user can read profiles (public profile pages).
-- App must never expose email here; profiles table has no email column.
CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select_public_or_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_insert_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_update_own" ON public.recipes;
DROP POLICY IF EXISTS "recipes_delete_own" ON public.recipes;

-- Anonymous + authenticated: read public recipes.
-- Authenticated: also read own private recipes.
CREATE POLICY "recipes_select_public_or_own"
  ON public.recipes
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = TRUE
    OR auth.uid() = user_id
  );

CREATE POLICY "recipes_insert_own"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipes_update_own"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipes_delete_own"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- saved_recipes (favorites)
-- ---------------------------------------------------------------------------
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_recipes_select_own" ON public.saved_recipes;
DROP POLICY IF EXISTS "saved_recipes_insert_own" ON public.saved_recipes;
DROP POLICY IF EXISTS "saved_recipes_delete_own" ON public.saved_recipes;

CREATE POLICY "saved_recipes_select_own"
  ON public.saved_recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "saved_recipes_insert_own"
  ON public.saved_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_id
        AND (r.is_public = TRUE OR r.user_id = auth.uid())
    )
  );

CREATE POLICY "saved_recipes_delete_own"
  ON public.saved_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- recipe_likes (optional — keeps likes working under RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_likes_select_all" ON public.recipe_likes;
DROP POLICY IF EXISTS "recipe_likes_insert_own" ON public.recipe_likes;
DROP POLICY IF EXISTS "recipe_likes_delete_own" ON public.recipe_likes;

CREATE POLICY "recipe_likes_select_all"
  ON public.recipe_likes
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "recipe_likes_insert_own"
  ON public.recipe_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipe_likes_delete_own"
  ON public.recipe_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
