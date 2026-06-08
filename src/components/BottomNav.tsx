import { Bell, ChefHat, Home, PlusCircle, Users2 } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { useAuthNavigation } from '../hooks/useAuthNavigation'
import { buildAuthReturnPath } from '../lib/authNavigation'

type BottomNavProps = {
  isLoggedIn: boolean
  unreadNotifications: number
  onStartCreateRecipe: () => void
}

function bottomNavLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'bottom-nav__tab bottom-nav__tab--active'
    : 'bottom-nav__tab'
}

export default function BottomNav({
  isLoggedIn,
  unreadNotifications,
  onStartCreateRecipe,
}: BottomNavProps) {
  const location = useLocation()
  const { goToProtectedRoute } = useAuthNavigation()
  const currentPath = buildAuthReturnPath(
    location.pathname,
    location.search,
    location.hash,
  )

  function handleCreate() {
    if (!isLoggedIn) {
      goToProtectedRoute(
        currentPath,
        'signup',
        'Create an account to publish your own recipes.',
      )
      return
    }
    onStartCreateRecipe()
  }

  function handleNotifications() {
    if (!isLoggedIn) {
      goToProtectedRoute(
        '/notifications',
        'login',
        'Log in to see likes, comments, and follows.',
      )
    }
  }

  function handleProfile() {
    if (!isLoggedIn) {
      goToProtectedRoute(
        '/profile',
        'login',
        'Create your profile to share recipes and follow creators.',
      )
    }
  }

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <NavLink to="/" end className={bottomNavLinkClass}>
        <Home size={22} aria-hidden="true" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/community" className={bottomNavLinkClass}>
        <Users2 size={22} aria-hidden="true" />
        <span>Community</span>
      </NavLink>

      <button
        type="button"
        className="bottom-nav__create"
        onClick={handleCreate}
        aria-label="Create a new recipe"
      >
        <PlusCircle size={26} aria-hidden="true" />
        <span>Create</span>
      </button>

      {isLoggedIn ? (
        <NavLink to="/notifications" className={bottomNavLinkClass}>
          <span
            className="bottom-nav__bell-wrapper"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
          >
            <Bell size={22} aria-hidden="true" />
            {unreadNotifications > 0 ? (
              <span className="bottom-nav__badge" aria-hidden="true">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            ) : null}
          </span>
          <span>Notifications</span>
        </NavLink>
      ) : (
        <button
          type="button"
          className="bottom-nav__tab"
          onClick={handleNotifications}
          aria-label="Log in to view notifications"
        >
          <span className="bottom-nav__bell-wrapper" aria-hidden="true">
            <Bell size={22} aria-hidden="true" />
          </span>
          <span>Notifications</span>
        </button>
      )}

      {isLoggedIn ? (
        <NavLink to="/profile" className={bottomNavLinkClass}>
          <ChefHat size={22} aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
      ) : (
        <button
          type="button"
          className="bottom-nav__tab"
          onClick={handleProfile}
          aria-label="Log in to view profile"
        >
          <ChefHat size={22} aria-hidden="true" />
          <span>Profile</span>
        </button>
      )}
    </nav>
  )
}
