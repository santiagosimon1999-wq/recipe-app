-- ============================================================================
-- 019 — Add cooking_time_minutes and servings to recipes
-- ============================================================================
-- Purpose:
-- 1) Track cooking time (in minutes) per recipe.
-- 2) Track serving count per recipe.
-- 3) Both columns are nullable so existing rows are unaffected.
--
-- Idempotent — safe to re-run.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS cooking_time_minutes INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT NULL;

NOTIFY pgrst, 'reload schema';
