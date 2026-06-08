# Launch Phase 1 — Readiness Summary

Phase 1 focuses on **safe pre-launch fixes** — no new features, no redesign.

## Completed in repo

| Item | Status | Reference |
|---|---|---|
| Migration 016 synced to `supabase/migrations/` | ✅ | `supabase/migrations/20250101000016_016_social_security_lockdown.sql` |
| Production migration verification guide | ✅ | `db/PRODUCTION_MIGRATION_CHECKLIST.md` |
| BottomNav auth fix (no `/auth` route) | ✅ | `src/components/BottomNav.tsx` |
| Label consistency (Notifications) | ✅ | Bottom nav + header |
| E2E stable create selector | ✅ | `e2e/smoke.spec.ts` |
| E2E signed-out search test fix | ✅ | Matches public `/search` route |
| Sentry privacy audit | ✅ | `docs/SENTRY_PRODUCTION.md` |
| Production smoke test checklist | ✅ | `docs/PRODUCTION_SMOKE_TEST.md` |
| E2E release gate docs | ✅ | `docs/E2E_RELEASE_GATE.md` |
| lint / build / unit tests | ✅ | Pass locally |

## Still requires manual action (you)

| Item | Owner | Doc |
|---|---|---|
| Verify migrations 016–019 in **production** Supabase | You | `db/PRODUCTION_MIGRATION_CHECKLIST.md` |
| Set `VITE_SENTRY_DSN` in Vercel Production | You | `docs/SENTRY_PRODUCTION.md` |
| Run production smoke test on live URL | You | `docs/PRODUCTION_SMOKE_TEST.md` |
| Run E2E with test credentials before deploy | You | `docs/E2E_RELEASE_GATE.md` |
| Confirm Supabase Auth (email confirm, OAuth redirects) for prod domain | You | Supabase Dashboard |
| Set `VITE_FEEDBACK_EMAIL` in Vercel Production | You | `/feedback` mailto |
| Legal review of Privacy/Terms before public launch | You | `docs/LAUNCH_LEGAL_CHECKLIST.md` |

## Production environment variables

### Required (Vercel Production)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (browser-safe) |

### Recommended (Vercel Production)

| Variable | Purpose |
|---|---|
| `VITE_SENTRY_DSN` | Browser error monitoring (optional but recommended) |
| `VITE_FEEDBACK_EMAIL` | Beta feedback mailto on `/feedback` (e.g. `your-beta-inbox@example.com`) |

### Optional

| Variable | Purpose |
|---|---|
| `VITE_SITE_URL` | Absolute origin for future OG/social meta (not wired in `index.html` today) |

### E2E only (local/CI secrets — never in Vercel production)

| Variable | Purpose |
|---|---|
| `E2E_TEST_EMAIL` | Primary Playwright test user |
| `E2E_TEST_PASSWORD` | Primary test password |
| `E2E_TEST_SECOND_EMAIL` | Second user (visibility test) |
| `E2E_TEST_SECOND_PASSWORD` | Second password |
| `E2E_TEST_TARGET_USERNAME` | Follow test target |
| `E2E_TEST_COMMENT_RECIPE_ID` | Comment test recipe ID |

**Never set** `service_role`, database passwords, or Sentry auth tokens in the frontend.

## Commands before deploy

```bash
# 1. Code quality
npm run lint
npm test
npm run build

# 2. Automated smoke (logged-out — matches CI)
npm run test:e2e:install
npm run test:e2e

# 3. Full E2E (optional, with your test credentials exported)
# export E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=...
npm run test:e2e

# 4. After deploy — manual
# Follow docs/PRODUCTION_SMOKE_TEST.md on live URL
```

## Closed beta readiness

**Ready for closed beta after you:**

1. ✅ Merge Phase 1 repo changes
2. ☐ Confirm migrations **016–019** on production Supabase
3. ☐ Deploy to Vercel with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
4. ☐ (Recommended) Set `VITE_SENTRY_DSN` in production
5. ☐ (Recommended) Set `VITE_FEEDBACK_EMAIL` in production
6. ☐ Complete `docs/PRODUCTION_SMOKE_TEST.md` on live URL
7. ☐ Invite a small test group (5–20 users)

**Beta placeholders in app:** `/privacy`, `/terms`, `/about`, `/whats-new`, `/feedback` — require legal review before public launch (`docs/LAUNCH_LEGAL_CHECKLIST.md`). No cookie banner needed unless analytics beyond Sentry are added (`docs/ANALYTICS_AND_COOKIES.md`).

**Verdict:** Savora is **ready for closed beta** once production migrations are verified and the manual smoke test passes. The codebase and docs are in place; remaining work is **ops verification**, not app rewrites.
