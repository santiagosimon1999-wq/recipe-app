-- ============================================================================
-- 016 — Social security lockdown (notifications/comments/abuse controls)
-- ============================================================================
-- Purpose:
-- 1) Ensure notifications cannot be directly inserted by clients.
-- 2) Ensure comments are only visible/insertable on visible recipes.
-- 3) Add conservative server-side rate limits for social write actions.
--
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Helper — recipe visible to current user (public or own)
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
-- 2) Notifications — RPC only (no direct INSERT from clients)
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
-- 3) Comments — visible recipe only
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

-- ---------------------------------------------------------------------------
-- 4) Abuse prevention — conservative write rate limits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.social_rate_limit_guard(
  p_actor uuid,
  p_table regclass,
  p_actor_column text,
  p_window interval,
  p_max_count integer,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text;
  v_count integer;
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_sql := format(
    'SELECT count(*)::int FROM %s WHERE %I = $1 AND created_at > (now() - $2)',
    p_table,
    p_actor_column
  );

  EXECUTE v_sql INTO v_count USING p_actor, p_window;

  IF coalesce(v_count, 0) >= p_max_count THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = p_message;
  END IF;
END;
$$;

-- Comments: max 15 per minute per user.
CREATE OR REPLACE FUNCTION public.comments_rate_limit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.social_rate_limit_guard(
    NEW.user_id,
    'public.comments'::regclass,
    'user_id',
    interval '1 minute',
    15,
    'You are commenting too quickly. Please wait a moment and try again.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_rate_limit ON public.comments;
CREATE TRIGGER trg_comments_rate_limit
BEFORE INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.comments_rate_limit_trigger();

-- Likes: max 120 per minute per user.
CREATE OR REPLACE FUNCTION public.recipe_likes_rate_limit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.social_rate_limit_guard(
    NEW.user_id,
    'public.recipe_likes'::regclass,
    'user_id',
    interval '1 minute',
    120,
    'You are liking recipes too quickly. Please wait a moment and try again.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recipe_likes_rate_limit ON public.recipe_likes;
CREATE TRIGGER trg_recipe_likes_rate_limit
BEFORE INSERT ON public.recipe_likes
FOR EACH ROW
EXECUTE FUNCTION public.recipe_likes_rate_limit_trigger();

-- Follows: max 30 follow actions per minute per user.
CREATE OR REPLACE FUNCTION public.follows_rate_limit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.social_rate_limit_guard(
    NEW.follower_id,
    'public.follows'::regclass,
    'follower_id',
    interval '1 minute',
    30,
    'You are following too quickly. Please wait a moment and try again.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_follows_rate_limit ON public.follows;
CREATE TRIGGER trg_follows_rate_limit
BEFORE INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.follows_rate_limit_trigger();

NOTIFY pgrst, 'reload schema';
