import ProfileCard from './ProfileCard'

type AppHeaderProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  view: 'dashboard' | 'profile' | 'community'
  onChangeView: (view: 'dashboard' | 'profile' | 'community') => void
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
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            type="button"
            className="theme-toggle-button"
            onClick={() => onChangeView('dashboard')}
          >
            Recipes
          </button>

          <button
            type="button"
            className="theme-toggle-button"
            onClick={() => onChangeView('community')}
          >
            {view === 'community' ? 'Community feed' : 'Community'}
          </button>

          {isLoggedIn ? (
            <button
              type="button"
              className="theme-toggle-button"
              onClick={() => onChangeView('profile')}
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
