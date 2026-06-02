import { Bell, ChefHat, Home, PlusCircle, Users2 } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'

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
  const navigate = useNavigate()

  function handleCreate() {
    if (!isLoggedIn) {
      void navigate('/auth')
      return
    }
    onStartCreateRecipe()
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
        aria-label="Create new recipe"
      >
        <PlusCircle size={26} aria-hidden="true" />
        <span>Create</span>
      </button>

      <NavLink to="/notifications" className={bottomNavLinkClass}>
        <span className="bottom-nav__bell-wrapper" aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}>
          <Bell size={22} aria-hidden="true" />
          {unreadNotifications > 0 ? (
            <span className="bottom-nav__badge" aria-hidden="true">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          ) : null}
        </span>
        <span>Alerts</span>
      </NavLink>

      <NavLink to="/profile" className={bottomNavLinkClass}>
        <ChefHat size={22} aria-hidden="true" />
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}
