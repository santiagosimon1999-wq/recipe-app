import { Home, Menu, PlusCircle, Search, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useAuthNavigation } from '../hooks/useAuthNavigation'
import { buildAuthReturnPath } from '../lib/authNavigation'
import MoreMenuSheet from './MoreMenuSheet'

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
  const [moreOpen, setMoreOpen] = useState(false)
  const currentPath = buildAuthReturnPath(
    location.pathname,
    location.search,
    location.hash,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 761px)')

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMoreOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

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

  return (
    <>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={bottomNavLinkClass}>
          <Home size={22} aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" className={bottomNavLinkClass}>
          <Search size={22} aria-hidden="true" />
          <span>Search</span>
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

        <NavLink to="/community" className={bottomNavLinkClass}>
          <Users2 size={22} aria-hidden="true" />
          <span>Community</span>
        </NavLink>

        <button
          type="button"
          className={
            moreOpen
              ? 'bottom-nav__tab bottom-nav__tab--active'
              : 'bottom-nav__tab'
          }
          onClick={() => setMoreOpen(true)}
          aria-label="Open more menu"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <Menu size={22} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <MoreMenuSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
      />
    </>
  )
}
