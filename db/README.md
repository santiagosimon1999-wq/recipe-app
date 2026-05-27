# Savora — Database Migrations

Manual numbered migrations for the Supabase Postgres backend.
Run them in order, in the Supabase SQL Editor, **as the `postgres` / project owner**.

Each file is idempotent (`CREATE … IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.) and safe to re-run.

## Order

| # | File | Purpose |
|---|------|---------|
| 001 | `001_create_saved_recipes.sql` | Saved-recipes (favorites) table + FK cascade |
| 002 | `002_create_recipe_likes.sql` | Recipe likes table + unique (recipe_id, user_id) |
| 003 | `003_profiles_avatar_username.sql` | Add `avatar_url`, `display_name`, `username` columns |
| 004 | `004_profiles_bio_and_unique_username.sql` | Add `bio` + case-insensitive unique username index |
| 005 | `005_enable_rls_policies.sql` | Table GRANTs + RLS policies for all tables |
| 006 | `006_phase4_hardening.sql` | **Phase 4.1:** indexes, FKs, length CHECKs, like-counts view, restricted like-rows RLS, drop dead `author_name` column |
| 007 | `007_account_deletion.sql` | **Phase 4.2:** `profiles.deleted_at` + `delete_user_account()` RPC for in-app account deactivation |

## Fresh DB bring-up

```bash
# In the Supabase SQL Editor, paste files in order: 001 → 007.
# Each is a self-contained script.
```

## After running migrations

If you add or remove columns, restart the PostgREST schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

## Supabase CLI (Phase 4.6)

The repo includes Supabase CLI scaffolding:

- `supabase/config.toml` — local CLI config
- `supabase/migrations/` — copies of `db/migrations/` with timestamp prefixes (for `supabase db reset` locally)

### Regenerate TypeScript types from your remote project

```bash
supabase login          # one-time, opens browser
npm run gen:types       # writes src/types/database.ts
```

The script reads your project ref from `VITE_SUPABASE_URL` in `.env`, or you can set `SUPABASE_PROJECT_REF` explicitly.

### Local dev database (optional)

```bash
supabase start
supabase db reset       # applies supabase/migrations/
supabase gen types typescript --local > src/types/database.ts
```

For production, the manual `db/migrations/` files remain the source of truth until you fully adopt linked remote migrations via the CLI.
