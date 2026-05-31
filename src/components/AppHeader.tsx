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
  unreadNotifications?: number
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
  unreadNotifications = 0,
}: AppHeaderProps) {
  return (
    <header className="app-hero">
      <nav className="app-nav">
        <div className="app-nav__top">
          <div className="app-nav__brand">
            <p className="app-eyebrow">Recipe social tracker</p>
            <h1 className="app__title">Savora</h1>
          </div>

          <div className="app-nav__utility">
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

            {isLoggedIn ? (
              <button type="button" className="logout-button" onClick={onLogout}>
                Log out
              </button>
            ) : null}
          </div>
        </div>

        <div className="app-nav__routes" aria-label="Primary navigation">
          <div className="app-nav__actions app-nav__actions--primary">
            <NavLink to="/" end className={navLinkClass}>
              Recipes
            </NavLink>
            <NavLink to="/community" className={navLinkClass}>
              Community
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Search
            </NavLink>
          </div>

          {isLoggedIn ? (
            <div className="app-nav__actions app-nav__actions--secondary">
              <NavLink to="/creator" className={navLinkClass}>
                Creator
              </NavLink>
              <NavLink to="/following" className={navLinkClass}>
                Activity
              </NavLink>
              <NavLink to="/collections" className={navLinkClass}>
                Collections
              </NavLink>
              <NavLink to="/notifications" className={navLinkClass}>
                <span className="app-nav__notifications-label">
                  Alerts
                  {unreadNotifications > 0 ? (
                    <span className="app-nav__badge">{unreadNotifications}</span>
                  ) : null}
                </span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </div>
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
