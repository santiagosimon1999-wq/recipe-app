-- ============================================================================
-- 008 — Recipe comments (Phase 5.1)
-- ============================================================================
-- Adds public.comments with RLS: everyone reads, authenticated users create,
-- owners delete their own rows. Content capped at 500 characters.
--
-- Idempotent — safe to re-run.
-- Run as the `postgres` / project owner in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id bigint NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comments_content_length CHECK (
    char_length(content) >= 1 AND char_length(content) <= 500
  )
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id
  ON public.comments (recipe_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON public.comments (user_id);

CREATE INDEX IF NOT EXISTS idx_comments_created_at
  ON public.comments (created_at);

-- ---------------------------------------------------------------------------
-- 3. Privileges
-- ---------------------------------------------------------------------------
GRANT SELECT ON TABLE public.comments TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.comments TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;

-- Everyone (including anonymous visitors) can read comments on recipes they
-- can see. Recipe visibility is enforced separately on public.recipes.
CREATE POLICY "comments_select_all"
  ON public.comments
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "comments_insert_own"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Refresh PostgREST schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
