-- ============================================================================
-- 014 — Security hardening (Phase 1 launch gate)
-- ============================================================================
-- Tightens RLS on comments, likes, notifications, collections, profiles,
-- follows; adds safe notification RPC; strengthens recipes.author_id invariant.
--
-- Prerequisites: 001–013 applied.
-- Idempotent — safe to re-run in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Helper — recipe visible to current user (public or own)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recipe_is_visible(p_recipe_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.recipes r
    WHERE r.id = p_recipe_id
      AND (r.is_public = TRUE OR r.user_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Comments — only on visible recipes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
DROP POLICY IF EXISTS "comments_select_visible_recipe" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_visible_recipe" ON public.comments;

CREATE POLICY "comments_select_visible_recipe"
  ON public.comments
  FOR SELECT
  TO anon, authenticated
  USING (public.recipe_is_visible(recipe_id));

CREATE POLICY "comments_insert_visible_recipe"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.recipe_is_visible(recipe_id)
  );

-- comments_delete_own unchanged (008)

-- ---------------------------------------------------------------------------
-- 3. Recipe likes — insert only on visible recipes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "recipe_likes_insert_own" ON public.recipe_likes;

CREATE POLICY "recipe_likes_insert_visible_recipe"
  ON public.recipe_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.recipe_is_visible(recipe_id)
  );

-- ---------------------------------------------------------------------------
-- 4. Collection recipes — recipe must be visible to collector
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "collection_recipes_insert_own" ON public.collection_recipes;

CREATE POLICY "collection_recipes_insert_own"
  ON public.collection_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.collections c
      WHERE c.id = collection_id
        AND c.user_id = auth.uid()
    )
    AND public.recipe_is_visible(recipe_id)
  );

-- ---------------------------------------------------------------------------
-- 5. Profiles — hide soft-deleted accounts from public reads
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_active" ON public.profiles;

CREATE POLICY "profiles_select_active"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- ---------------------------------------------------------------------------
-- 6. Follows — limit row reads; expose counts via RPC
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
DROP POLICY IF EXISTS "follows_select_involved" ON public.follows;

CREATE POLICY "follows_select_involved"
  ON public.follows
  FOR SELECT
  TO authenticated
  USING (
    follower_id = auth.uid()
    OR following_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.get_follow_counts(p_profile_id uuid)
RETURNS TABLE(followers integer, following integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT count(*)::integer
      FROM public.follows f
      WHERE f.following_id = p_profile_id
    ) AS followers,
    (
      SELECT count(*)::integer
      FROM public.follows f
      WHERE f.follower_id = p_profile_id
    ) AS following;
$$;

REVOKE ALL ON FUNCTION public.get_follow_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Notifications — RPC only (no direct INSERT from clients)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

REVOKE INSERT ON TABLE public.notifications FROM authenticated;
REVOKE INSERT ON TABLE public.notifications FROM anon;

CREATE OR REPLACE FUNCTION public.create_notification_safe(
  p_user_id uuid,
  p_type text,
  p_message text,
  p_recipe_id bigint DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_id uuid;
  v_message text;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id IS NULL OR p_user_id = v_actor THEN
    RETURN NULL;
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('comment', 'like', 'follow') THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  v_message := left(trim(coalesce(p_message, '')), 500);
  IF char_length(v_message) < 1 THEN
    RAISE EXCEPTION 'Notification message is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.deleted_at IS NOT NULL
  ) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND n.actor_id = v_actor
      AND n.type = p_type
      AND (
        p_recipe_id IS NULL
        OR n.recipe_id IS NOT DISTINCT FROM p_recipe_id
      )
      AND n.created_at > (now() - interval '24 hours')
  ) THEN
    RETURN NULL;
  END IF;

  IF p_type IN ('comment', 'like') THEN
    IF p_recipe_id IS NULL THEN
      RAISE EXCEPTION 'recipe_id is required for comment and like notifications';
    END IF;

    IF NOT public.recipe_is_visible(p_recipe_id) THEN
      RAISE EXCEPTION 'Recipe is not accessible';
    END IF;

    IF p_type = 'comment' AND NOT EXISTS (
      SELECT 1
      FROM public.comments c
      WHERE c.recipe_id = p_recipe_id
        AND c.user_id = v_actor
    ) THEN
      RAISE EXCEPTION 'Comment notification requires a comment by the actor';
    END IF;

    IF p_type = 'like' AND NOT EXISTS (
      SELECT 1
      FROM public.recipe_likes rl
      WHERE rl.recipe_id = p_recipe_id
        AND rl.user_id = v_actor
    ) THEN
      RAISE EXCEPTION 'Like notification requires a like by the actor';
    END IF;
  ELSIF p_type = 'follow' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.follows f
      WHERE f.follower_id = v_actor
        AND f.following_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Follow notification requires an active follow';
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    actor_id,
    recipe_id,
    message
  )
  VALUES (
    p_user_id,
    p_type,
    v_actor,
    p_recipe_id,
    v_message
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification_safe(uuid, text, text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification_safe(uuid, text, text, bigint)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Recipes — author_id must match user_id
-- ---------------------------------------------------------------------------
UPDATE public.recipes
SET author_id = user_id
WHERE author_id IS DISTINCT FROM user_id
  AND user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.recipes_sync_author_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.author_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_author_matches_user;

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_author_matches_user
  CHECK (author_id IS NULL OR author_id = user_id) NOT VALID;

ALTER TABLE public.recipes VALIDATE CONSTRAINT recipes_author_matches_user;

NOTIFY pgrst, 'reload schema';
