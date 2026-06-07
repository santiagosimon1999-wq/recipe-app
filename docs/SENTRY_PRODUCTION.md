# Sentry Production Readiness (Savora)

Savora uses `@sentry/react` for optional browser error monitoring. **No DSN is hardcoded** — monitoring is disabled unless you set an environment variable at build time.

## Required environment variable

| Variable | Required? | Where to set |
|---|---|---|
| `VITE_SENTRY_DSN` | Optional (recommended for production) | Vercel → Project → Settings → Environment Variables → **Production** |

Get the DSN from **Sentry** → your project → **Settings** → **Client Keys (DSN)**.

Use the **browser** DSN only. Never put the Sentry auth token or Supabase `service_role` key in the frontend.

## How it works in code

- `src/main.tsx` calls `initSentry()` once before React renders.
- `src/lib/sentry.ts` reads `import.meta.env.VITE_SENTRY_DSN`.
- If the DSN is **missing**, Sentry is a **no-op** (no SDK network calls).
- `src/AppShell.tsx` and `src/main.tsx` forward React boundary errors via `captureBoundaryError()`.

## Privacy safeguards (already configured)

| Setting | Value | Purpose |
|---|---|---|
| `sendDefaultPii` | `false` | Do not send IP, cookies, or user context by default |
| `replaysSessionSampleRate` | `0` | No routine session replay recording |
| `replaysOnErrorSampleRate` | `1.0` | Replay only when an error occurs |
| Replay `maskAllText` | `true` | Mask text in error replays |
| Replay `blockAllMedia` | `true` | Block images/video in replays |
| `beforeSend` | strips `?query` from URLs | Avoid leaking tokens in URL params |
| User identification | **not set** | No `Sentry.setUser()` calls in the app |

Sentry may still receive stack traces and page URLs (without query strings). Do not log passwords, tokens, or recipe content into `console.error` before throws.

## Recommended production setup

1. Create a Sentry project (e.g. `savora-web`, platform **React**).
2. Copy the **DSN** (format: `https://<key>@<org>.ingest.sentry.io/<project>`).
3. In **Vercel** → Environment Variables:
   - Name: `VITE_SENTRY_DSN`
   - Value: your DSN
   - Environment: **Production** (and optionally Preview)
   - Do **not** add to git or `.env` committed files.
4. Redeploy so Vite embeds the variable at build time.
5. Trigger a test error in staging/preview (or use Sentry’s “Test” button after first deploy).
6. Confirm events appear in Sentry with environment tag matching `production`.

## Local development

Leave `VITE_SENTRY_DSN` unset in `.env`. Local dev stays silent — no accidental production noise.

## What Sentry does *not* cover

- Supabase/database errors (unless they surface as uncaught JS exceptions)
- Failed RLS policies (usually returned as API errors, not crashes)
- Uptime / API latency (use Sentry performance or a separate monitor if needed)

For launch, Sentry is **recommended** but not blocking if you manually smoke-test production first.
