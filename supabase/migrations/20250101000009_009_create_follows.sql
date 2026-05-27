-- ============================================================================
-- 009 — Follow system (Phase 5.2)
-- ============================================================================
-- Idempotent — safe to re-run.
-- Run as the `postgres` / project owner in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.follows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique_pair UNIQUE (follower_id, following_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id
  ON public.follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id
  ON public.follows (following_id);

CREATE INDEX IF NOT EXISTS idx_follows_created_at
  ON public.follows (created_at DESC);

GRANT SELECT ON TABLE public.follows TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.follows TO authenticated;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;

CREATE POLICY "follows_select_all"
  ON public.follows
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "follows_insert_own"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "follows_delete_own"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

NOTIFY pgrst, 'reload schema';
