# Launch legal checklist (beta → public)

Savora includes **beta placeholder** Privacy and Terms pages. They are **not** final legal documents.

## Before public launch — review with a qualified professional

- [ ] **Privacy policy** — data collection, retention, user rights, third parties (Supabase, Sentry)
- [ ] **Terms of service** — acceptable use, liability, account termination, governing law
- [ ] **Nutrition / health disclaimer** — recipes and macros are informational only; not medical advice
- [ ] **User-generated content & moderation** — reporting, removal, copyright, community guidelines

## In-app pages (beta placeholders)

| Page | Route |
|------|-------|
| Privacy notice (beta) | `/privacy` |
| Terms of use (beta) | `/terms` |
| About | `/about` |
| Feedback | `/feedback` |

Update copy in `src/pages/PrivacyPage.tsx` and `src/pages/TermsPage.tsx` after legal review.

## Cookie / analytics notice

**Current setup:** optional Sentry error monitoring only. No Google Analytics, Mixpanel, or similar product analytics.

**Action:** No cookie consent banner is required today. If you add analytics or advertising trackers later, add a notice and revisit Privacy — see `docs/ANALYTICS_AND_COOKIES.md`.
