# Savora — Database Migrations

Manual numbered migrations for the Supabase Postgres backend.
Run them in order, in the Supabase SQL Editor, **as the `postgres` / project owner**.

Each file is idempotent (`CREATE … IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.) and safe to re-run.

## Order

| # | File | Required | Purpose |
|---|------|----------|---------|
| 001 | `001_create_saved_recipes.sql` | Yes | Saved-recipes (favorites) table + FK cascade |
| 002 | `002_create_recipe_likes.sql` | Yes | Recipe likes table + unique (recipe_id, user_id) |
| 003 | `003_profiles_avatar_username.sql` | Yes | Add `avatar_url`, `display_name`, `username` columns |
| 004 | `004_profiles_bio_and_unique_username.sql` | Yes | Add `bio` + case-insensitive unique username index |
| 005 | `005_enable_rls_policies.sql` | Yes | Table GRANTs + RLS policies for core tables |
| 006 | `006_phase4_hardening.sql` | Yes | Indexes, FKs, CHECKs, like-counts view, drop `author_name` |
| 007 | `007_account_deletion.sql` | Yes | `profiles.deleted_at` + `delete_user_account()` RPC |
| 008 | `008_create_comments.sql` | Yes | `comments` table (RLS tightened in 014) |
| 009 | `009_create_follows.sql` | Yes | `follows` table (RLS tightened in 014) |
| 010 | `010_collections_notifications.sql` | Yes | `collections`, `collection_recipes`, `notifications` |
| 011 | `011_seed_savora_team_readme.sql` | No | Documentation only (superseded by 012) |
| 012 | `012_seed_savora_team_recipes.sql` | Optional | Seed 20 public recipes for `@savora-team` |
| 013 | `013_recipes_sync_author_id.sql` | **Yes** | Backfill `author_id`; trigger for profile joins |
| 014 | `014_security_hardening.sql` | **Yes** | Comment/like/collection RLS; notification RPC; profile filter |
| 015 | `015_storage_policies.sql` | **Yes** | Storage RLS for `recipe-images` + `profile-avatars` |

## Fresh DB bring-up

```text
001 → 002 → … → 015
```

Paste each file into the Supabase SQL Editor in order.

## After running migrations

Reload the PostgREST schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

Regenerate TypeScript types:

```bash
npm run gen:types
```

## Security verification

See [TESTING.md](./TESTING.md) for manual RLS checks after **014** and **015**.

## Supabase CLI (local)

- `supabase/migrations/` — timestamp-prefixed copies for `supabase db reset`
- Keep in sync with `db/migrations/` when adding new files

```bash
supabase start
supabase db reset
```

## Prerequisites for seed 012

Ensure a `profiles` row exists with `username = 'savora-team'` before running `012_seed_savora_team_recipes.sql`.
