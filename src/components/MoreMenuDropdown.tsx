import { LogIn, UserPlus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useMoreMenuActions } from '../hooks/useMoreMenuActions'
import {
  getMoreMenuItemLabel,
  MORE_MENU_ACCOUNT_LOGGED_IN,
  MORE_MENU_ACCOUNT_SIGNED_OUT,
  MORE_MENU_APP_LINKS,
  type MoreMenuRouteItem,
} from '../lib/moreMenu'

function getDropdownItemLabel(item: MoreMenuRouteItem, isLoggedIn: boolean): string {
  if (!isLoggedIn) return item.label
  return getMoreMenuItemLabel(item)
}

type MoreMenuDropdownProps = {
  isLoggedIn: boolean
  unreadNotifications: number
  isActive: boolean
}

export default function MoreMenuDropdown({
  isLoggedIn,
  unreadNotifications,
  isActive,
}: MoreMenuDropdownProps) {
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const { handleRouteItem, handleLogin, handleSignUp } = useMoreMenuActions(() =>
    setOpen(false),
  )

  const accountItems = isLoggedIn
    ? MORE_MENU_ACCOUNT_LOGGED_IN
    : MORE_MENU_ACCOUNT_SIGNED_OUT

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const frameId = window.requestAnimationFrame(() => {
      const firstItem = containerRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]',
      )
      firstItem?.focus()
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [open])

  function handleItemClick(item: MoreMenuRouteItem) {
    handleRouteItem(item, isLoggedIn)
  }

  return (
    <div className="app-nav__more" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={
          isActive || open
            ? 'theme-toggle-button nav-btn--active'
            : 'theme-toggle-button'
        }
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label="Open more menu"
      >
        More
      </button>

      {open ? (
        <div
          id={menuId}
          className="more-dropdown"
          role="menu"
          aria-label="More menu"
        >
          <div className="more-dropdown__section">
            <p className="more-dropdown__section-title">Account</p>
            <div className="more-dropdown__list">
              {!isLoggedIn ? (
                <>
                  <button
                    type="button"
                    className="more-dropdown__item"
                    role="menuitem"
                    onClick={handleLogin}
                  >
                    <LogIn size={16} aria-hidden="true" />
                    <span>Log in</span>
                  </button>
                  <button
                    type="button"
                    className="more-dropdown__item more-dropdown__item--accent"
                    role="menuitem"
                    onClick={handleSignUp}
                  >
                    <UserPlus size={16} aria-hidden="true" />
                    <span>Sign up</span>
                  </button>
                </>
              ) : null}

              {accountItems.map((item) => {
                const showBadge =
                  item.id === 'notifications' &&
                  isLoggedIn &&
                  unreadNotifications > 0

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="more-dropdown__item"
                    role="menuitem"
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="more-dropdown__item-label">
                      {getDropdownItemLabel(item, isLoggedIn)}
                    </span>
                    {showBadge ? (
                      <span className="more-dropdown__badge" aria-hidden="true">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    ) : null}
                    {!isLoggedIn ? (
                      <span className="more-dropdown__item-hint">Sign in</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="more-dropdown__section">
            <p className="more-dropdown__section-title">App</p>
            <div className="more-dropdown__list">
              {MORE_MENU_APP_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="more-dropdown__item"
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                >
                  <span>{getDropdownItemLabel(item, isLoggedIn)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
