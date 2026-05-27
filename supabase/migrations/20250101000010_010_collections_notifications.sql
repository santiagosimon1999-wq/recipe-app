-- ============================================================================
-- 010 — Collections & notifications (Phase 5.8+)
-- ============================================================================
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_name_length CHECK (
    char_length(name) >= 1 AND char_length(name) <= 80
  )
);

CREATE TABLE IF NOT EXISTS public.collection_recipes (
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  recipe_id bigint NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id
  ON public.collections (user_id);

CREATE INDEX IF NOT EXISTS idx_collection_recipes_recipe_id
  ON public.collection_recipes (recipe_id);

GRANT SELECT ON TABLE public.collections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.collections TO authenticated;
GRANT SELECT ON TABLE public.collection_recipes TO authenticated;
GRANT INSERT, DELETE ON TABLE public.collection_recipes TO authenticated;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collections_select_own" ON public.collections;
DROP POLICY IF EXISTS "collections_insert_own" ON public.collections;
DROP POLICY IF EXISTS "collections_update_own" ON public.collections;
DROP POLICY IF EXISTS "collections_delete_own" ON public.collections;

CREATE POLICY "collections_select_own"
  ON public.collections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "collections_insert_own"
  ON public.collections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collections_update_own"
  ON public.collections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "collections_delete_own"
  ON public.collections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "collection_recipes_select_own" ON public.collection_recipes;
DROP POLICY IF EXISTS "collection_recipes_insert_own" ON public.collection_recipes;
DROP POLICY IF EXISTS "collection_recipes_delete_own" ON public.collection_recipes;

CREATE POLICY "collection_recipes_select_own"
  ON public.collection_recipes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "collection_recipes_insert_own"
  ON public.collection_recipes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "collection_recipes_delete_own"
  ON public.collection_recipes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Notifications (persisted activity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipe_id bigint REFERENCES public.recipes(id) ON DELETE CASCADE,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (
    type IN ('comment', 'like', 'follow')
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;
GRANT INSERT ON TABLE public.notifications TO authenticated;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can create notifications for others (app inserts on comment/like/follow)
CREATE POLICY "notifications_insert_service"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (TRUE);

NOTIFY pgrst, 'reload schema';
