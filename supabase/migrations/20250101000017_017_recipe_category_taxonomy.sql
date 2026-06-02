-- Mirror of db/migrations/017_recipe_category_taxonomy.sql
-- ============================================================================
-- 017 — Recipe category taxonomy (normalized)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.category_groups (
  id bigserial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id bigserial PRIMARY KEY,
  group_id bigint NOT NULL REFERENCES public.category_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, name)
);

CREATE TABLE IF NOT EXISTS public.recipe_categories (
  recipe_id bigint NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  category_id bigint NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_group_order
  ON public.categories(group_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_recipe_id
  ON public.recipe_categories(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_category_id
  ON public.recipe_categories(category_id);

ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_groups_public_read" ON public.category_groups;
CREATE POLICY "category_groups_public_read"
  ON public.category_groups
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "recipe_categories_public_read" ON public.recipe_categories;
CREATE POLICY "recipe_categories_public_read"
  ON public.recipe_categories
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_categories.recipe_id
        AND (r.is_public = true OR r.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "recipe_categories_owner_insert" ON public.recipe_categories;
CREATE POLICY "recipe_categories_owner_insert"
  ON public.recipe_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_categories.recipe_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "recipe_categories_owner_delete" ON public.recipe_categories;
CREATE POLICY "recipe_categories_owner_delete"
  ON public.recipe_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_categories.recipe_id
        AND r.user_id = auth.uid()
    )
  );

INSERT INTO public.category_groups (key, label, sort_order)
VALUES
  ('meal_type', 'Meal Type', 1),
  ('cuisine', 'Cuisine', 2),
  ('diet', 'Diet', 3),
  ('cooking_method', 'Cooking Method', 4)
ON CONFLICT (key) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.categories (group_id, name, slug, icon, sort_order, is_active)
SELECT g.id, v.name, v.slug, v.icon, v.sort_order, true
FROM public.category_groups g
JOIN (
  VALUES
    ('meal_type', 'Breakfast', 'breakfast', 'sunrise', 10),
    ('meal_type', 'Lunch', 'lunch', 'sandwich', 20),
    ('meal_type', 'Dinner', 'dinner', 'utensils', 30),
    ('meal_type', 'Appetizer', 'appetizer', 'sparkles', 40),
    ('meal_type', 'Side Dish', 'side-dish', 'leaf', 50),
    ('meal_type', 'Soup', 'soup', 'soup', 60),
    ('meal_type', 'Salad', 'salad', 'salad', 70),
    ('meal_type', 'Snack', 'snack', 'cookie', 80),
    ('meal_type', 'Dessert', 'dessert', 'cake', 90),
    ('meal_type', 'Beverage', 'beverage', 'cup-soda', 100),
    ('meal_type', 'Other', 'other', 'shapes', 999),
    ('cuisine', 'American', 'american', 'flag', 10),
    ('cuisine', 'Italian', 'italian', 'pizza', 20),
    ('cuisine', 'Mexican', 'mexican', 'pepper', 30),
    ('cuisine', 'South American', 'south-american', 'mountain', 40),
    ('cuisine', 'Caribbean', 'caribbean', 'palm-tree', 50),
    ('cuisine', 'Spanish', 'spanish', 'chef-hat', 60),
    ('cuisine', 'French', 'french', 'croissant', 70),
    ('cuisine', 'German', 'german', 'beer', 80),
    ('cuisine', 'Mediterranean', 'mediterranean', 'waves', 90),
    ('cuisine', 'Middle Eastern', 'middle-eastern', 'sun', 100),
    ('cuisine', 'Indian', 'indian', 'flame', 110),
    ('cuisine', 'Chinese', 'chinese', 'chopsticks', 120),
    ('cuisine', 'Japanese', 'japanese', 'fish', 130),
    ('cuisine', 'Korean', 'korean', 'drumstick', 140),
    ('cuisine', 'Thai', 'thai', 'leafy-green', 150),
    ('cuisine', 'Vietnamese', 'vietnamese', 'soup', 160),
    ('diet', 'High Protein', 'high-protein', 'dumbbell', 10),
    ('diet', 'Low Carb', 'low-carb', 'wheat-off', 20),
    ('diet', 'Keto', 'keto', 'egg', 30),
    ('diet', 'Vegetarian', 'vegetarian', 'leaf', 40),
    ('diet', 'Vegan', 'vegan', 'sprout', 50),
    ('diet', 'Gluten Free', 'gluten-free', 'wheat-off', 60),
    ('diet', 'Dairy Free', 'dairy-free', 'milk-off', 70),
    ('diet', 'Healthy', 'healthy', 'heart-pulse', 80),
    ('cooking_method', 'Grilled', 'grilled', 'flame', 10),
    ('cooking_method', 'Baked', 'baked', 'cooking-pot', 20),
    ('cooking_method', 'Fried', 'fried', 'chef-hat', 30),
    ('cooking_method', 'Slow Cooker', 'slow-cooker', 'clock3', 40),
    ('cooking_method', 'Air Fryer', 'air-fryer', 'wind', 50),
    ('cooking_method', 'BBQ', 'bbq', 'flame-kindling', 60)
) AS v(group_key, name, slug, icon, sort_order)
  ON v.group_key = g.key
ON CONFLICT (slug) DO UPDATE
SET
  group_id = EXCLUDED.group_id,
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

NOTIFY pgrst, 'reload schema';
