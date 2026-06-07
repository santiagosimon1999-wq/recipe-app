# Production Migration Checklist (Savora)

Use this checklist **before inviting public users**. The repo cannot prove what has been applied to your live Supabase project — verify each item manually in the Supabase Dashboard.

## How to verify

### Option A — Supabase Dashboard (recommended)

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Run the verification queries below for each migration.
3. Mark each row ✅ only when the check passes.

### Option B — Supabase CLI (if linked to production)

```bash
supabase migration list
```

Compare applied migrations against `db/migrations/` (001–019). A migration listed locally but not applied remotely still needs a manual run.

---

## Migration 016 — `016_social_security_lockdown.sql`

**Why it matters:** Blocks direct client INSERT into `notifications`, tightens comment visibility, adds social rate limits.

| Check | Verification query | Expected if applied |
|---|---|---|
| Direct notification INSERT revoked | `SELECT has_table_privilege('authenticated', 'public.notifications', 'INSERT');` | `false` |
| `create_notification_safe` exists | `SELECT proname FROM pg_proc WHERE proname = 'create_notification_safe';` | One row |
| `recipe_is_visible` exists | `SELECT proname FROM pg_proc WHERE proname = 'recipe_is_visible';` | One row |
| Comment rate-limit trigger | `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_comments_rate_limit';` | One row |

**If missing:** Run the full file in SQL Editor:

`db/migrations/016_social_security_lockdown.sql`

**Repo sync:** Also present as `supabase/migrations/20250101000016_016_social_security_lockdown.sql`.

---

## Migration 017 — `017_recipe_category_taxonomy.sql`

**Why it matters:** Category groups, categories table, recipe–category junction, taxonomy for filters/search.

| Check | Verification query | Expected if applied |
|---|---|---|
| `category_groups` table | `SELECT to_regclass('public.category_groups');` | `category_groups` |
| `categories` table | `SELECT to_regclass('public.categories');` | `categories` |
| `recipe_categories` table | `SELECT to_regclass('public.recipe_categories');` | `recipe_categories` |

**If missing:** Run `db/migrations/017_recipe_category_taxonomy.sql` in SQL Editor.

---

## Migration 018 — `018_recipe_category_backfill.sql`

**Why it matters:** Backfills categories for existing recipes so filters and search work on real data.

| Check | Verification query | Expected if applied |
|---|---|---|
| Recipes have category links | `SELECT count(*) FROM public.recipe_categories;` | `> 0` (if you have seeded/user recipes) |
| Categories populated | `SELECT count(*) FROM public.categories;` | `> 0` |

**If missing:** Run `db/migrations/018_recipe_category_backfill.sql` after 017.

---

## Migration 019 — `019_add_cooking_time_servings.sql`

**Why it matters:** Stores cooking time and servings on recipes (nutrition form + card display).

| Check | Verification query | Expected if applied |
|---|---|---|
| `cooking_time_minutes` column | `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'cooking_time_minutes';` | One row |
| `servings` column | `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'servings';` | One row |

**If missing:** Run `db/migrations/019_add_cooking_time_servings.sql` in SQL Editor.

---

## Post-migration smoke tests (app)

After applying any missing migration:

1. **Like** a public recipe → recipient gets a notification (no console RPC errors).
2. **Comment** on a public recipe → notification appears; private recipe comment blocked for non-owner.
3. **Follow** a user → follow notification appears.
4. **Create recipe** with cooking time + servings → values persist after reload.
5. **Category filter** on home/search returns expected results.

See also `db/TESTING.md` for RLS security checks.

---

## Checklist summary

| Migration | File | Applied in production? |
|---|---|---|
| 016 | `016_social_security_lockdown.sql` | ☐ |
| 017 | `017_recipe_category_taxonomy.sql` | ☐ |
| 018 | `018_recipe_category_backfill.sql` | ☐ |
| 019 | `019_add_cooking_time_servings.sql` | ☐ |

Do not check these boxes until you have run the verification queries on your **live** Supabase project.
