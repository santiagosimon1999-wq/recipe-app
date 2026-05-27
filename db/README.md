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
# In the Supabase SQL Editor, paste files in order: 001 → 006.
# Each is a self-contained script.
```

## After running migrations

If you add or remove columns, restart the PostgREST schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

## Future work (Phase 4.6)

Adopt the Supabase CLI (`supabase init`, `supabase migration new …`) so:
- Migrations live in `supabase/migrations/<timestamp>_name.sql`
- Local dev DB can be reset with `supabase db reset`
- TypeScript types are generated from the schema with `supabase gen types typescript`

For now, the manual numbered files above are the source of truth.
