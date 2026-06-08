import { Globe, Moon, PlusCircle, Salad, Share2, Sun } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import GuestWelcomeCard from './GuestWelcomeCard'
import MoreMenuDropdown from './MoreMenuDropdown'
import ProfileCard from './ProfileCard'
import { useAuthNavigation } from '../hooks/useAuthNavigation'
import { getCompactHeaderTitle } from '../lib/headerRoutes'
import { isMoreMenuActiveRoute } from '../lib/moreMenu'

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
  variant?: 'full' | 'compact'
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'theme-toggle-button nav-btn--active'
    : 'theme-toggle-button'
}

type HeaderNavProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onLogout: () => void
  onStartCreateRecipe: () => void
  savingRecipe: boolean
  isLoggedIn: boolean
  unreadNotifications: number
  isMoreActive: boolean
}

function HeaderUtilities({
  theme,
  onToggleTheme,
  onLogout,
  isLoggedIn,
}: Pick<
  HeaderNavProps,
  'theme' | 'onToggleTheme' | 'onLogout' | 'isLoggedIn'
>) {
  const { goToLogin, goToSignUp } = useAuthNavigation()

  return (
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

      <NavLink
        to="/search"
        className="app-nav__mobile-search theme-toggle-button"
        aria-label="Go to search page"
      >
        Search
      </NavLink>

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
  )
}

function HeaderPrimaryNav({
  isLoggedIn,
  onStartCreateRecipe,
  savingRecipe,
  unreadNotifications,
  isMoreActive,
}: Pick<
  HeaderNavProps,
  | 'isLoggedIn'
  | 'onStartCreateRecipe'
  | 'savingRecipe'
  | 'unreadNotifications'
  | 'isMoreActive'
>) {
  return (
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

        <MoreMenuDropdown
          isLoggedIn={isLoggedIn}
          unreadNotifications={unreadNotifications}
          isActive={isMoreActive}
        />
      </div>
    </div>
  )
}

function AppCompactHeader({
  theme,
  onToggleTheme,
  onLogout,
  onStartCreateRecipe,
  savingRecipe,
  isLoggedIn,
  unreadNotifications,
  routeTitle,
  isMoreActive,
}: HeaderNavProps & { routeTitle: string | null }) {
  return (
    <header className="app-compact-header" data-testid="app-compact-header">
      <nav className="app-nav app-nav--compact" aria-label="Site header">
        <div className="app-compact-header__row">
          <div className="app-compact-header__brand">
            <NavLink
              to="/"
              className="app-compact-header__brand-link"
              aria-label="Go to Savora home"
            >
              <span className="app-compact-header__logo">Savora</span>
            </NavLink>
            {routeTitle ? (
              <p className="app-compact-header__route-title">{routeTitle}</p>
            ) : null}
          </div>

          <HeaderUtilities
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            isLoggedIn={isLoggedIn}
          />
        </div>

        <HeaderPrimaryNav
          isLoggedIn={isLoggedIn}
          onStartCreateRecipe={onStartCreateRecipe}
          savingRecipe={savingRecipe}
          unreadNotifications={unreadNotifications}
          isMoreActive={isMoreActive}
        />
      </nav>
    </header>
  )
}

function AppFullHeader({
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
  isMoreActive,
}: Omit<AppHeaderProps, 'variant'> & { isMoreActive: boolean }) {
  const { goToSignUp } = useAuthNavigation()

  return (
    <header className="app-hero" data-testid="app-full-header">
      <nav className="app-nav" aria-label="Site header">
        <div className="app-nav__top">
          <NavLink to="/" className="app-nav__brand-link" aria-label="Go to home">
            <p className="app-eyebrow">Recipe social tracker</p>
            <h1 className="app__title">Savora</h1>
          </NavLink>

          <HeaderUtilities
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            isLoggedIn={isLoggedIn}
          />
        </div>

        <HeaderPrimaryNav
          isLoggedIn={isLoggedIn}
          onStartCreateRecipe={onStartCreateRecipe}
          savingRecipe={savingRecipe}
          unreadNotifications={unreadNotifications}
          isMoreActive={isMoreActive}
        />
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

export default function AppHeader({
  variant = 'full',
  unreadNotifications = 0,
  ...props
}: AppHeaderProps) {
  const location = useLocation()
  const isMoreActive = isMoreMenuActiveRoute(location.pathname)
  const navProps: HeaderNavProps = {
    theme: props.theme,
    onToggleTheme: props.onToggleTheme,
    onLogout: props.onLogout,
    onStartCreateRecipe: props.onStartCreateRecipe,
    savingRecipe: props.savingRecipe,
    isLoggedIn: props.isLoggedIn,
    unreadNotifications,
    isMoreActive,
  }

  if (variant === 'compact') {
    return (
      <AppCompactHeader
        {...navProps}
        routeTitle={getCompactHeaderTitle(location.pathname)}
      />
    )
  }

  return (
    <AppFullHeader
      {...props}
      unreadNotifications={unreadNotifications}
      isMoreActive={isMoreActive}
    />
  )
}
