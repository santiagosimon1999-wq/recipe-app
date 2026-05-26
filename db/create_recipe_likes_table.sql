-- SQL to create recipe_likes table for Supabase/Postgres
-- Run this in Supabase SQL editor or psql

CREATE TABLE IF NOT EXISTS public.recipe_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipe_id BIGINT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recipe_likes_unique_pair UNIQUE (recipe_id, user_id)
);

-- Optional index for fast counts
CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe_id ON public.recipe_likes(recipe_id);

-- If you want to link user_id to auth.users (Supabase), you can add a foreign key:
-- ALTER TABLE public.recipe_likes
--   ADD CONSTRAINT fk_recipe_likes_user
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
