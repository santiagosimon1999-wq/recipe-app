import { Globe, Moon, PlusCircle, Salad, Share2, Sun } from 'lucide-react'
import { NavLink } from 'react-router'
import GuestWelcomeCard from './GuestWelcomeCard'
import ProfileCard from './ProfileCard'
import { useAuthNavigation } from '../hooks/useAuthNavigation'

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
  savedCount: number
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
  savedCount,
  averageCalories,
  isLoggedIn,
  unreadNotifications = 0,
}: AppHeaderProps) {
  const { goToLogin, goToSignUp } = useAuthNavigation()

  return (
    <header className="app-hero">
      <nav className="app-nav">
        <div className="app-nav__top">
          <NavLink to="/" className="app-nav__brand-link" aria-label="Go to home">
            <p className="app-eyebrow">Recipe social tracker</p>
            <h1 className="app__title">Savora</h1>
          </NavLink>

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
            ) : (
              <div className="app-nav__auth-ctas">
                <button
                  type="button"
                  className="auth-cta-button auth-cta-button--secondary"
                  onClick={() => goToLogin()}
                  aria-label="Log in"
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="auth-cta-button auth-cta-button--primary"
                  onClick={() => goToSignUp()}
                  aria-label="Sign up"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="app-nav__routes" aria-label="Primary navigation">
          <div className="app-nav__actions app-nav__actions--primary">
            <NavLink to="/" end className={navLinkClass}>
              Discover
            </NavLink>
            <NavLink to="/community" className={navLinkClass}>
              Community
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Search
            </NavLink>

            {isLoggedIn ? (
              <button
                type="button"
                className="app-nav__create-button"
                onClick={onStartCreateRecipe}
                disabled={savingRecipe}
                aria-label="Create a new recipe"
              >
                <PlusCircle size={16} aria-hidden="true" />
                <span>New Recipe</span>
              </button>
            ) : null}
          </div>

          {isLoggedIn ? (
            <div className="app-nav__actions app-nav__actions--secondary">
              <NavLink to="/creator" className={navLinkClass}>
                Creator
              </NavLink>
              <NavLink to="/following" className={navLinkClass}>
                Following
              </NavLink>
              <NavLink to="/saved" className={navLinkClass}>
                Saved
              </NavLink>
              <NavLink to="/collections" className={navLinkClass}>
                Collections
              </NavLink>
              <NavLink to="/notifications" className={navLinkClass}>
                <span className="app-nav__notifications-label">
                  Notifications
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

      {isLoggedIn ? (
        <ProfileCard
          displayName={displayName}
          email={email}
          userInitial={userInitial}
          totalRecipes={totalRecipes}
          savedCount={savedCount}
          averageCalories={averageCalories}
        />
      ) : (
        <GuestWelcomeCard />
      )}

      <section className="hero-content">
        <div>
          {isLoggedIn ? (
            <p className="app__subtitle">
              Save recipes in one place, organize them with collections, and
              discover meal ideas like a social recipe board.
            </p>
          ) : (
            <>
              <p className="app__subtitle">
                Discover, save, and share recipes with a food-loving community.
              </p>
              <p className="app__subtitle app__subtitle--secondary">
                Browse public recipes now, or create an account to save
                favorites, comment, and share your own.
              </p>
            </>
          )}

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

          {!isLoggedIn ? (
            <div className="hero-cta-row">
              <NavLink to="/community" className="auth-cta-button auth-cta-button--secondary">
                Explore recipes
              </NavLink>
              <button
                type="button"
                className="auth-cta-button auth-cta-button--primary"
                onClick={() =>
                  goToSignUp('Create your free account to save recipes and join the community.')
                }
                aria-label="Create your free account"
              >
                Create your free account
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </header>
  )
}
