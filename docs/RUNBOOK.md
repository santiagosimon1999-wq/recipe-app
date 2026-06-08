# Savora Runbook

## Environment

Copy `.env.example` to `.env` and set:

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon/public key only |
| `VITE_SENTRY_DSN` | No (recommended) | Production error monitoring — see `docs/SENTRY_PRODUCTION.md` |
| `VITE_FEEDBACK_EMAIL` | No (recommended) | Beta feedback mailto on `/feedback` — e.g. `your-beta-inbox@example.com` |

Never commit `.env` or use the `service_role` key in the frontend.

**Vercel Production:** set `VITE_FEEDBACK_EMAIL` to your real beta inbox so testers can reach you from the Feedback page.

**Legal:** Privacy/Terms are beta placeholders — `docs/LAUNCH_LEGAL_CHECKLIST.md`.

**Cookies/analytics:** Sentry only today — no cookie banner required — `docs/ANALYTICS_AND_COOKIES.md`.

## Database migrations

**Before public or closed-beta users:**

1. Follow `db/PRODUCTION_MIGRATION_CHECKLIST.md` on your **live** Supabase project.
2. Ensure migrations **001–019** are applied (especially **016** social security lockdown).
3. Run security checks in `db/TESTING.md` after applying 014–016.
4. Regenerate types if schema changed: `npm run gen:types`

Canonical SQL: `db/migrations/`  
Supabase CLI mirror: `supabase/migrations/`

## Pre-deploy commands

```bash
npm run lint
npm test
npm run build
npm run test:e2e:install
npm run test:e2e
```

With test credentials (optional full gate): see `docs/E2E_RELEASE_GATE.md`.

After deploy: `docs/PRODUCTION_SMOKE_TEST.md`

## Launch Phase 1

Summary and sign-off: `docs/LAUNCH_PHASE1.md`

## CI

GitHub Actions (`.github/workflows/ci.yml`) on push/PR to `main`/`master`:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e` (logged-out smoke only; no secrets)

## Local commands

```bash
npm run dev          # development server
npm test             # unit tests
npm run build        # production build
npm run preview      # preview production build
npm run test:e2e     # Playwright smoke tests
```
