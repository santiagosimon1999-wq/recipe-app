# Savora

Savora is a social recipe platform where users can create recipes, share them publicly, discover community content, follow creators, save recipes to collections, and engage through likes, comments, and activity feeds.

Designed as a portfolio-grade startup-style product, Savora focuses on:
- real social interactions (follow, like, comment, notify)
- creator and profile surfaces
- safe public/private content visibility
- practical production habits (typed data layer, tests, error handling, migrations)

---

## Product Overview

Savora combines recipe management with social discovery:
- **For creators:** publish recipes, manage visibility, grow followers
- **For consumers:** search, save, and engage with community recipes
- **For both:** profile identity, notifications, collections, and activity updates

The app is intentionally built with production-minded architecture while remaining approachable for iteration.

---

## Core Features

- Authentication (email/password + OAuth)
- Recipe creation, editing, deletion
- Public/private recipe visibility
- Community feed + following activity feed
- Public profiles (avatar, bio, follow state, social stats)
- Follow/unfollow creators
- Likes and comments on supported recipes
- Collections (save recipes into lists)
- Shareable recipe links
- In-app notifications (likes/comments/follows)
- Advanced search (title + ingredient-aware + category + nutrition + sort)
- Responsive layout with mobile-first behavior

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Lucide React (icons)
- Sonner (toasts)

### Backend / Data
- Supabase (Postgres + Auth + Storage + RLS)
- SQL migrations for schema and security policies

### Quality & Tooling
- ESLint
- Vitest
- Playwright (e2e scaffolding)
- Sentry integration hooks

---

## Architecture Overview

Savora follows a layered frontend architecture:

- **Pages** (`src/pages/*`): route-level composition
- **Components** (`src/components/*`): reusable UI and feature blocks
- **Hooks** (`src/hooks/*`): stateful feature logic (recipes, favorites, likes, filters, unread notifications)
- **Services / Lib** (`src/services/*`, `src/lib/*`): Supabase data access, mappers, business utilities
- **Types** (`src/types/*`): domain models + generated database types

High-level flow:

1. UI triggers user action (`RecipeModal`, `FollowButton`, `SearchPage`)
2. Hook/service executes typed Supabase call
3. Data is normalized in mappers (`recipeMappers`)
4. State updates optimistically where safe
5. Errors are surfaced via toasts and boundaries

---

## Screenshots

> Add screenshots to showcase key product surfaces before sharing with recruiters.

Recommended files:
- `docs/screenshots/home-feed.png`
- `docs/screenshots/public-profile.png`
- `docs/screenshots/recipe-modal.png`
- `docs/screenshots/activity-feed.png`
- `docs/screenshots/search-advanced.png`

Markdown template:

```md
![Home Feed](docs/screenshots/home-feed.png)
![Public Profile](docs/screenshots/public-profile.png)
![Recipe Modal](docs/screenshots/recipe-modal.png)
![Activity Feed](docs/screenshots/activity-feed.png)
![Advanced Search](docs/screenshots/search-advanced.png)
```

---

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` in project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=optional_sentry_dsn
```

### 3) Start development server

```bash
npm run dev
```

### 4) Quality checks

```bash
npm run lint
npm test
npm run build
```

### 5) Optional e2e setup

```bash
npm run test:e2e:install
npm run test:e2e
```

---

## Environment Variables

- `VITE_SUPABASE_URL` (required): Supabase project URL
- `VITE_SUPABASE_ANON_KEY` (required): Supabase anon API key
- `VITE_SENTRY_DSN` (optional): Sentry DSN for frontend error monitoring

---

## Database Overview

Schema and policies are managed through `db/migrations/*`.

Key tables:
- `profiles`
- `recipes`
- `recipe_likes`
- `comments`
- `follows`
- `collections`
- `collection_recipes`
- `notifications`
- `saved_recipes`

Key platform patterns:
- Row Level Security (RLS) policies to enforce data boundaries
- Helper SQL functions like `recipe_is_visible(...)`
- Security-definer RPC patterns for constrained writes (notifications)
- Aggregated views like `recipe_like_counts`

---

## Engineering Challenges Solved

- **Public/private recipe safety:** enforced visibility-aware queries and policies
- **Social graph mechanics:** follow relationships with counts and profile integration
- **Cross-surface consistency:** likes/comments/author identity mapped across feeds, cards, and detail routes
- **Activity aggregation:** merged heterogeneous social events into a coherent user feed
- **Advanced search without schema expansion:** ingredient-aware + nutrition filtering using safe existing data
- **Production-minded hardening:** security migrations, defensive typing, and test/build validation

---

## Future Roadmap

- Followers/Following dedicated pages
- Creator dashboard analytics (recipes, likes, comments, performance)
- Activity Feed V2 (smarter grouping, priorities, server-aware pagination)
- Ratings system (1–5 stars + aggregate ranking)
- Recommendation/personalization improvements
- Security hardening enhancements and abuse-prevention tuning

---

## Portfolio Notes

Why this project is strong for interviews:
- End-to-end product thinking (not just component demos)
- Real social feature complexity with typed data contracts
- Security and migration awareness
- Practical UX decisions for growth/retention surfaces

Before showcasing broadly:
- Add polished screenshots/GIF walkthroughs
- Include one architecture diagram
- Document known limitations + next milestones transparently

---

## License

Add your preferred license (e.g. MIT) if this repository will be public.
