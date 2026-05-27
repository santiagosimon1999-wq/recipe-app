# Security verification (after migration 014)

Run these in the Supabase SQL Editor as **authenticated** test user (or via the app + REST with user JWT).

## Expected: blocked

1. **Comment on private recipe you do not own** — INSERT into `comments` should fail RLS.
2. **Like on private recipe you do not own** — INSERT into `recipe_likes` should fail.
3. **Direct notification INSERT** — `INSERT INTO notifications (...)` should fail (permission denied). Use `create_notification_safe` RPC only.
4. **Notification spam** — RPC with wrong type or without follow/like/comment proof should raise an exception.

## Expected: allowed

1. **Comment on public recipe** — INSERT succeeds when `auth.uid() = user_id`.
2. **Read comments on public recipe** — SELECT succeeds for anon and authenticated.
3. **Save to collection** — `collection_recipes` INSERT when recipe is public or yours.
4. **Follow counts on public profile** — `SELECT * FROM get_follow_counts('profile-uuid')` returns counts for anon.

## Manual RPC smoke test

```sql
-- As authenticated user A (replace UUIDs):
SELECT public.create_notification_safe(
  'recipient-uuid'::uuid,
  'follow',
  'Someone started following you.',
  NULL
);
```

## Storage (after migration 015)

1. Upload avatar to `profile-avatars/{your-user-id}/test.jpg` — succeeds.
2. Upload to `profile-avatars/{other-user-id}/test.jpg` — fails.
3. Public read URL for recipe image — succeeds.
