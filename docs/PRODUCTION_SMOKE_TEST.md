# Production Smoke Test Checklist (Savora)

Run this against your **live production URL** (Vercel deploy + production Supabase) after migrations **016–019** are verified. See `db/PRODUCTION_MIGRATION_CHECKLIST.md` first.

**Tester:** _______________  
**Date:** _______________  
**Production URL:** _______________  
**Device(s):** Desktop ☐ · iPhone ☐ · Android ☐

Mark each item ✅ Pass · ❌ Fail · ⏭ Skipped. Note failures in the **Notes** column.

---

## 1. Authentication

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1.1 | Sign up | Open prod URL → Sign Up tab → new email + password → Create account | Account created; confirmation or auto-login per Supabase settings | ☐ | |
| 1.2 | Log in | Log out if needed → Log in with test account | Header shows New Recipe, Profile, Log out | ☐ | |
| 1.3 | Log out | Click Log out | Login/sign-up screen or public home | ☐ | |

---

## 2. Recipes (CRUD)

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.1 | Create recipe | Click **Create a new recipe** (header) or bottom **Create** | Form opens; fill title, ingredients, instructions | ☐ | |
| 2.2 | Save recipe | Save Recipe (public) | Recipe appears in Your Recipes / community | ☐ | |
| 2.3 | Upload recipe image | Create or edit → upload image ≤ 5 MB | Image displays on card and detail | ☐ | |
| 2.4 | Edit recipe | Open own recipe → Edit (modal or pencil on card) | Form pre-filled; Update Recipe saves | ☐ | |
| 2.5 | Delete recipe | Open own recipe → Delete → confirm | Recipe removed from lists | ☐ | |
| 2.6 | Private recipe | Create with “Share publicly” unchecked | Not visible to second account in search | ☐ | |

---

## 3. Social interactions

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 3.1 | Like recipe | Like another user’s public recipe | Count increases; heart active | ☐ | |
| 3.2 | Unlike recipe | Click like again | Count decreases | ☐ | |
| 3.3 | Comment | Open recipe → write comment → Submit | Comment appears | ☐ | |
| 3.4 | Delete comment | Delete your own comment | Comment removed | ☐ | |
| 3.5 | Follow user | Visit `/users/{username}` → Follow | Button shows Following | ☐ | |
| 3.6 | Unfollow user | Click Following | Button shows Follow | ☐ | |

---

## 4. Saved, collections, notifications

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 4.1 | Save recipe | Heart/save on recipe card | Appears on **Saved** page | ☐ | |
| 4.2 | Unsave recipe | Toggle save off | Removed from Saved | ☐ | |
| 4.3 | Create collection | **Collections** → create named list | Collection appears | ☐ | |
| 4.4 | Add to collection | Save recipe to collection | Recipe listed in collection | ☐ | |
| 4.5 | Notification (like) | Second account likes your recipe | Inbox shows `@user liked your recipe` + title | ☐ | |
| 4.6 | Notification (comment) | Second account comments | Human-readable comment notification | ☐ | |
| 4.7 | Notification (follow) | Second account follows you | Follow notification | ☐ | |
| 4.8 | Mark read | Open notification / Mark all read | Unread styling clears; badge → 0 | ☐ | |

---

## 5. Public surfaces

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 5.1 | Public recipe URL | Open `/recipes/{id}` while signed out (public recipe) | Recipe detail/modal loads | ☐ | |
| 5.2 | Private recipe URL | Open private recipe URL as non-owner | Not available / private message | ☐ | |
| 5.3 | Public profile | Open `/users/{username}` signed out | Profile, public recipes, Follow (if logged in) | ☐ | |
| 5.4 | Search (signed out) | `/search` without login | Search page loads | ☐ | |
| 5.5 | Community (signed out) | `/community` | Community feed loads | ☐ | |

---

## 6. Profile & media

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 6.1 | Profile page | `/profile` | Stats, recipes, edit option | ☐ | |
| 6.2 | Edit profile | Change display name / bio → save | Updates persist after reload | ☐ | |
| 6.3 | Upload avatar | Profile → upload JPG/PNG/WebP ≤ 5 MB | Avatar displays on profile and cards | ☐ | |

---

## 7. Mobile navigation (< 760px)

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 7.1 | Bottom nav visible | Resize or use phone | Home, Community, Create, Notifications, Profile | ☐ | |
| 7.2 | Home tab | Tap Home | Discover/home loads | ☐ | |
| 7.3 | Community tab | Tap Community | Community feed | ☐ | |
| 7.4 | Create (logged in) | Tap Create | Recipe form opens | ☐ | |
| 7.5 | Create (logged out) | Tap Create | Login/sign-up screen (via protected route) | ☐ | |
| 7.6 | Notifications tab | Tap Notifications | Inbox loads; badge if unread | ☐ | |
| 7.7 | Profile tab | Tap Profile | Profile or auth screen | ☐ | |
| 7.8 | Safe areas | Standalone or Safari | Content not under notch/home indicator | ☐ | |

---

## 8. PWA

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 8.1 | Manifest | Chrome DevTools → Application → Manifest | Valid manifest, 192+512 icons | ☐ | |
| 8.2 | Android install | Chrome → use site → Install prompt/banner | Installable; opens standalone | ☐ | |
| 8.3 | iOS Add to Home | Safari → Share → Add to Home Screen | Icon on home screen; standalone launch | ☐ | |
| 8.4 | Install hint | First visit mobile Safari (not installed) | iOS hint or Android banner (once) | ☐ | |

---

## 9. Error & performance sanity

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 9.1 | No console spam | Browse 2 min | No repeating red errors | ☐ | |
| 9.2 | Broken image fallback | Recipe without image | Placeholder, not broken layout | ☐ | |
| 9.3 | Sentry (if enabled) | Trigger test boundary error in preview | Event in Sentry dashboard | ☐ | |

---

## Sign-off

| Criteria | Ready? |
|---|---|
| All **auth + recipe CRUD** tests pass | ☐ |
| All **social** tests pass | ☐ |
| **Migrations 016–019** verified | ☐ |
| **Mobile** bottom nav works | ☐ |
| No **P0** failures open | ☐ |

**Closed beta ready?** ☐ Yes · ☐ No — blockers: _______________
