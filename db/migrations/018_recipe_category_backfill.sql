-- ============================================================================
-- 018 — Backfill recipe_categories from legacy recipes.category
-- ============================================================================
-- Purpose:
-- 1) Preserve existing recipe discoverability while moving to many categories.
-- 2) Map legacy single category values into normalized category assignments.
-- 3) Keep legacy recipes.category untouched for backward compatibility.

WITH normalized_legacy AS (
  SELECT
    r.id AS recipe_id,
    lower(trim(coalesce(r.category, ''))) AS legacy_category
  FROM public.recipes r
),
mapped AS (
  SELECT recipe_id, 'Breakfast'::text AS target_name
  FROM normalized_legacy
  WHERE legacy_category = 'breakfast'

  UNION ALL SELECT recipe_id, 'Mexican'
  FROM normalized_legacy WHERE legacy_category = 'mexican'

  UNION ALL SELECT recipe_id, 'Italian'
  FROM normalized_legacy WHERE legacy_category = 'italian'

  UNION ALL SELECT recipe_id, 'Indian'
  FROM normalized_legacy WHERE legacy_category = 'indian'

  UNION ALL SELECT recipe_id, 'Mediterranean'
  FROM normalized_legacy WHERE legacy_category = 'mediterranean'

  UNION ALL SELECT recipe_id, 'Vegan'
  FROM normalized_legacy WHERE legacy_category = 'vegan'

  UNION ALL SELECT recipe_id, 'Vegetarian'
  FROM normalized_legacy WHERE legacy_category = 'vegetarian'

  UNION ALL SELECT recipe_id, 'High Protein'
  FROM normalized_legacy WHERE legacy_category = 'high protein'

  UNION ALL SELECT recipe_id, 'Low Carb'
  FROM normalized_legacy WHERE legacy_category = 'low carb'

  UNION ALL SELECT recipe_id, 'Grilled'
  FROM normalized_legacy WHERE legacy_category = 'grilled'

  UNION ALL SELECT recipe_id, 'Dessert'
  FROM normalized_legacy WHERE legacy_category IN ('desserts', 'dessert')

  UNION ALL SELECT recipe_id, 'Soup'
  FROM normalized_legacy WHERE legacy_category IN ('soups and stews', 'soup')

  UNION ALL SELECT recipe_id, 'Salad'
  FROM normalized_legacy WHERE legacy_category IN ('salads', 'salad')

  UNION ALL SELECT recipe_id, 'Appetizer'
  FROM normalized_legacy WHERE legacy_category IN ('appetizers', 'appetizer', 'party food')

  UNION ALL SELECT recipe_id, 'Snack'
  FROM normalized_legacy WHERE legacy_category IN ('fast food', 'kids food', 'snack')

  UNION ALL SELECT recipe_id, 'Dinner'
  FROM normalized_legacy WHERE legacy_category IN ('main courses', 'main course', 'dinner')

  UNION ALL SELECT recipe_id, 'Chinese'
  FROM normalized_legacy WHERE legacy_category = 'asian'

  UNION ALL SELECT recipe_id, 'Other'
  FROM normalized_legacy WHERE legacy_category IN ('international', 'other')
),
resolved AS (
  SELECT
    m.recipe_id,
    c.id AS category_id
  FROM mapped m
  JOIN public.categories c
    ON c.name = m.target_name
)
INSERT INTO public.recipe_categories (recipe_id, category_id)
SELECT DISTINCT recipe_id, category_id
FROM resolved
ON CONFLICT (recipe_id, category_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
