import ProfileCard from './ProfileCard'

type AppView = 'dashboard' | 'profile' | 'community' | 'public-profile'

type AppHeaderProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  view: AppView
  onChangeView: (view: AppView) => void
  onLogout: () => void
  onStartCreateRecipe: () => void
  savingRecipe: boolean
  displayName: string
  email?: string | null
  userInitial: string
  totalRecipes: number
  favoriteCount: number
  averageCalories: number
  isLoggedIn: boolean
}

function navClass(current: AppView, target: AppView) {
  return current === target
    ? 'theme-toggle-button nav-btn--active'
    : 'theme-toggle-button'
}

export default function AppHeader({
  theme,
  onToggleTheme,
  view,
  onChangeView,
  onLogout,
  onStartCreateRecipe,
  savingRecipe,
  displayName,
  email,
  userInitial,
  totalRecipes,
  favoriteCount,
  averageCalories,
  isLoggedIn,
}: AppHeaderProps) {
  return (
    <header className="app-hero">
      <nav className="app-nav">
        <div>
          <p className="app-eyebrow">Recipe social tracker</p>
          <h1 className="app__title">Savora</h1>
        </div>

        <div className="app-nav__actions">
          <button
            type="button"
            className="theme-toggle-button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            type="button"
            className={navClass(view, 'dashboard')}
            onClick={() => onChangeView('dashboard')}
            aria-current={view === 'dashboard' ? 'page' : undefined}
          >
            Recipes
          </button>

          <button
            type="button"
            className={navClass(view, 'community')}
            onClick={() => onChangeView('community')}
            aria-current={view === 'community' ? 'page' : undefined}
          >
            Community
          </button>

          {isLoggedIn ? (
            <button
              type="button"
              className={navClass(view, 'profile')}
              onClick={() => onChangeView('profile')}
              aria-current={view === 'profile' ? 'page' : undefined}
            >
              Profile
            </button>
          ) : null}

          {isLoggedIn ? (
            <button type="button" className="logout-button" onClick={onLogout}>
              Log out
            </button>
          ) : null}
        </div>
      </nav>

      <ProfileCard
        displayName={displayName}
        email={email}
        userInitial={userInitial}
        totalRecipes={totalRecipes}
        favoriteCount={favoriteCount}
        averageCalories={averageCalories}
      />

      <section className="hero-content">
        <div>
          <p className="app__subtitle">
            Save your recipes, track macros, and discover meal ideas like a
            social recipe board.
          </p>

          <div className="hero-tags">
            <span>📸 Social recipe sharing</span>
            <span>🥗 Macro tracking</span>
            <span>🌎 Community feed</span>
          </div>
        </div>

        {isLoggedIn ? (
          <button
            type="button"
            className="create-recipe-toggle-button"
            onClick={onStartCreateRecipe}
            disabled={savingRecipe}
          >
            + Create Recipe
          </button>
        ) : null}
      </section>
    </header>
  )
}
