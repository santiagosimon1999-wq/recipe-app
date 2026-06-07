# E2E Release Gate (Playwright)

Automated smoke tests live in `e2e/smoke.spec.ts`. They guard core flows before deploy.

## Commands

```bash
# One-time: install Chromium for Playwright
npm run test:e2e:install

# Run full smoke suite (builds app + starts preview server on :4173)
npm run test:e2e
```

Playwright config: `playwright.config.ts`

- **Base URL:** `http://127.0.0.1:4173`
- **Web server:** `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`
- **Browser:** Chromium (headless)
- **Timeout:** 30s per test; 180s webServer startup

## What runs without credentials (CI default)

GitHub Actions (`.github/workflows/ci.yml`) runs **logged-out** tests only:

| Test | What it checks |
|---|---|
| Auth smoke | Home loads; Sign Up tab reachable |
| Search (signed out) | `/search` loads (public route) |
| Activity feed (signed out) | `/following` shows auth gate |
| Creator (signed out) | `/creator` shows auth gate |

These pass with **no** env vars.

## What requires test credentials

Set these in your shell **before** `npm run test:e2e` (never commit values):

| Variable | Required for | Description |
|---|---|---|
| `E2E_TEST_EMAIL` | Authenticated suite | Primary test account email |
| `E2E_TEST_PASSWORD` | Authenticated suite | Primary test account password |

**Authenticated tests (skipped if vars missing):**

- Recipe create / edit / delete happy path
- Search page while signed in
- Activity feed while signed in
- Creator dashboard while signed in

### Optional variables (extra coverage)

| Variable | Required for | Description |
|---|---|---|
| `E2E_TEST_SECOND_EMAIL` | Public/private visibility test | Second Supabase user email |
| `E2E_TEST_SECOND_PASSWORD` | Public/private visibility test | Second user password |
| `E2E_TEST_TARGET_USERNAME` | Follow/unfollow test | Existing public username to follow |
| `E2E_TEST_COMMENT_RECIPE_ID` | Comment test | Numeric ID of a public recipe |

### Example (local — use your own accounts)

```bash
export E2E_TEST_EMAIL="your-test-user@example.com"
export E2E_TEST_PASSWORD="your-test-password"

# Optional
export E2E_TEST_SECOND_EMAIL="second-user@example.com"
export E2E_TEST_SECOND_PASSWORD="second-password"
export E2E_TEST_TARGET_USERNAME="savora-team"
export E2E_TEST_COMMENT_RECIPE_ID="123"

npm run test:e2e
```

Create dedicated **test accounts** in Supabase Auth for E2E. Do not use production admin or real user passwords in CI logs.

## Stable selectors

Create-recipe actions use the accessible name **`Create a new recipe`** (`aria-label` on the header button), not visible button text. This survives label copy changes.

## Recommended pre-deploy sequence

```bash
npm run lint
npm test
npm run build
npm run test:e2e:install
npm run test:e2e                                    # logged-out gate (CI parity)
# With credentials exported:
npm run test:e2e                                    # full authenticated gate
```

## CI vs local

| Context | Credentials | Tests run |
|---|---|---|
| GitHub Actions CI | None | Logged-out smoke only |
| Local release gate | `E2E_TEST_*` set | Full suite |

To run authenticated tests in CI, add `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` as GitHub Actions secrets and export them in the workflow (not configured by default).

## Troubleshooting

| Issue | Fix |
|---|---|
| `Timed out waiting for webServer` | Ensure port 4173 is free; run `npm run build` manually first |
| Chromium missing | `npm run test:e2e:install` |
| Authenticated tests skipped | Export `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` |
| Login timeout | Confirm Supabase URL/key in `.env` match test project |
| Create button not found | Ensure logged-in; selector is `Create a new recipe` |
