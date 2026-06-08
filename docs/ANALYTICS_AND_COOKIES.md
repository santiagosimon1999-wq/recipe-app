# Analytics and cookies

## Current state (closed beta)

| Tool | Purpose | Env var |
|------|---------|---------|
| **Sentry** (optional) | Client error monitoring | `VITE_SENTRY_DSN` |

Savora does **not** ship product analytics (no Google Analytics, Plausible, Mixpanel, PostHog, etc.).

Supabase Auth may use session cookies/tokens as part of normal login — that is authentication, not marketing analytics.

## Cookie / consent banner

**Not required today** for closed beta with the setup above.

Add a cookie or analytics notice only if you:

- Enable third-party analytics or ad tracking
- Embed widgets that set non-essential cookies
- Expand Sentry or other tools to collect marketing/behavior data beyond error reports

## If you add analytics later

1. Document the tool in this file and in the Privacy page.
2. Update `docs/LAUNCH_LEGAL_CHECKLIST.md`.
3. Add a short in-app notice (footer or Privacy page) describing what is collected.
4. Implement a proper consent flow if required in your jurisdiction.

Recommended placement: link from Privacy page + one line in the app footer.
