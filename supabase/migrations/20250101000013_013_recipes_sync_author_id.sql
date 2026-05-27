-- ============================================================================
-- 013 — Sync recipes.author_id with user_id for profile joins
-- ============================================================================
-- App code joins author via profiles!recipes_author_id_fkey. Rows created with
-- only user_id (including migration 012 seeds) had NULL author_id, so PostgREST
-- returned no author username/display_name.
--
-- Idempotent — safe to re-run in the Supabase SQL Editor.

UPDATE public.recipes
SET author_id = user_id
WHERE author_id IS NULL
  AND user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.recipes_sync_author_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.author_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.author_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recipes_sync_author_id_trigger ON public.recipes;

CREATE TRIGGER recipes_sync_author_id_trigger
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.recipes_sync_author_id();
