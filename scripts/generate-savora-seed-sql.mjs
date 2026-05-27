import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const recipes = JSON.parse(
  readFileSync(join(root, 'db/seed-data/savora-recipes.json'), 'utf8')
)

function sqlEscape(value) {
  return String(value).replace(/'/g, "''")
}

function sqlTextArray(items) {
  const parts = items.map((item) => `'${sqlEscape(item)}'`)
  return `ARRAY[${parts.join(', ')}]::text[]`
}

const inserts = recipes
  .map((recipe) => {
    const imageUrl = recipe.image?.trim() ? `'${sqlEscape(recipe.image.trim())}'` : 'NULL'

    return `
  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = '${sqlEscape(recipe.title)}'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      '${sqlEscape(recipe.title)}',
      '${sqlEscape(recipe.description)}',
      ${sqlTextArray(recipe.ingredients)},
      '${sqlEscape(recipe.instructions)}',
      '${sqlEscape(recipe.category)}',
      ${imageUrl},
      ${recipe.calories},
      ${recipe.protein},
      ${recipe.carbs},
      ${recipe.fat},
      true
    );
  END IF;`
  })
  .join('\n')

const sql = `-- ============================================================================
-- 012 — Seed Savora team starter recipes (generated)
-- ============================================================================
-- Prerequisites (run once in Supabase Auth + SQL):
-- 1. Create a user account you will use as the system chef (email/password or OAuth).
-- 2. Set profiles.username = 'savora-team' and display_name = 'Savora Chef' for that user.
--
-- Idempotent — skips rows that already exist for savora-team with the same title.
-- Regenerate this file: npm run seed:generate-sql

DO $$
DECLARE
  team_id uuid;
BEGIN
  SELECT id INTO team_id
  FROM public.profiles
  WHERE lower(username) = 'savora-team'
  LIMIT 1;

  IF team_id IS NULL THEN
    RAISE EXCEPTION 'Profile with username savora-team not found. Create the user and profile first.';
  END IF;
${inserts}
END $$;

NOTIFY pgrst, 'reload schema';
`

const outPath = join(root, 'db/migrations/012_seed_savora_team_recipes.sql')
writeFileSync(outPath, sql)
console.log(`Wrote ${outPath} (${recipes.length} recipes)`)
