import { Globe, Moon, Salad, Share2, Sun } from 'lucide-react'
import { NavLink } from 'react-router'
import ProfileCard from './ProfileCard'

type AppHeaderProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
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

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'theme-toggle-button nav-btn--active'
    : 'theme-toggle-button'
}

export default function AppHeader({
  theme,
  onToggleTheme,
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
            className="theme-toggle-button theme-toggle-button--with-icon"
            onClick={onToggleTheme}
            aria-label={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
          >
            {theme === 'light' ? (
              <>
                <Moon size={16} aria-hidden="true" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={16} aria-hidden="true" />
                <span>Light</span>
              </>
            )}
          </button>

          <NavLink to="/" end className={navLinkClass}>
            Recipes
          </NavLink>

          <NavLink to="/community" className={navLinkClass}>
            Community
          </NavLink>

          {isLoggedIn ? (
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
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
            <span className="hero-tags__item">
              <Share2 size={14} aria-hidden="true" />
              Social recipe sharing
            </span>
            <span className="hero-tags__item">
              <Salad size={14} aria-hidden="true" />
              Macro tracking
            </span>
            <span className="hero-tags__item">
              <Globe size={14} aria-hidden="true" />
              Community feed
            </span>
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
