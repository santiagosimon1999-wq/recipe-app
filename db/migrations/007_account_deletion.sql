-- ============================================================================
-- 007 — Account deletion (soft-delete / anonymization)
-- ============================================================================
-- Adds `profiles.deleted_at` and a `delete_user_account()` RPC that the
-- authenticated client can call from `ProfilePage` to deactivate their
-- account.
--
-- Model: anonymize-and-deactivate, NOT hard-delete-from-auth.
--   - profile is anonymized: display_name → 'Deleted user',
--     username/bio/avatar cleared, deleted_at = now()
--   - all saved_recipes (favorites) and recipe_likes by the user are removed
--   - all their recipes are made private (is_public = false) so the community
--     can no longer see them, but the rows are preserved so other users'
--     historical references survive
--   - auth.users row is NOT deleted (avoids cascading recipe/likes deletes
--     and lets you process a true "right to be forgotten" request manually
--     from the Supabase dashboard if a user emails support)
--
-- After calling the RPC, the client must `supabase.auth.signOut()` so the
-- session is invalidated locally.
--
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Schema — profiles.deleted_at
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. RPC — delete_user_account()
--    SECURITY DEFINER so it can DELETE rows from saved_recipes / recipe_likes
--    even after RLS would normally restrict that to "owned" rows. We still
--    scope every statement to `auth.uid()` so it can only ever operate on
--    the caller's own data.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Anonymize profile (keeps row for FK continuity)
  UPDATE public.profiles
  SET
    display_name = 'Deleted user',
    username = NULL,
    bio = NULL,
    avatar_url = NULL,
    deleted_at = now()
  WHERE id = uid;

  -- Drop caller's favorites and likes (other users' rows untouched)
  DELETE FROM public.saved_recipes WHERE user_id = uid;
  DELETE FROM public.recipe_likes WHERE user_id = uid;

  -- Make all of the caller's recipes private
  UPDATE public.recipes
  SET is_public = false
  WHERE user_id = uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Refresh PostgREST schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
