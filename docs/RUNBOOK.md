# Savora Runbook

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN` (optional)

Never commit `.env` or use the `service_role` key in the frontend.

## Database migrations

1. Open Supabase → SQL Editor.
2. Run `db/migrations/001` through `015` in order (see `db/README.md`).
3. Run `NOTIFY pgrst, 'reload schema';`
4. Regenerate types: `npm run gen:types`

## Security migrations (014–015)

After applying **014** and **015**, run checks in `db/TESTING.md`.

## CI

GitHub Actions runs `lint`, `test`, `build`, and logged-out E2E on push/PR to `main`/`master`.

## Local commands

```bash
npm run dev          # development server
npm test             # unit tests
npm run build        # production build
npm run test:e2e     # Playwright smoke tests
```
