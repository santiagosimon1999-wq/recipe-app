import {
  Bell,
  Bookmark,
  ChefHat,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Newspaper,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useId } from 'react'
import { useMoreMenuActions } from '../hooks/useMoreMenuActions'
import {
  MORE_MENU_ACCOUNT_LOGGED_IN,
  MORE_MENU_ACCOUNT_SIGNED_OUT,
  MORE_MENU_APP_LINKS,
  type MoreMenuRouteItem,
} from '../lib/moreMenu'
import { Modal } from './ui/Modal'

type MoreMenuSheetProps = {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  unreadNotifications: number
}

type IconComponent = typeof ChefHat

const ACCOUNT_ICONS: Record<string, IconComponent> = {
  profile: ChefHat,
  saved: Bookmark,
  collections: FolderOpen,
  following: Users,
  notifications: Bell,
  creator: LayoutDashboard,
}

const APP_ICONS: Record<string, IconComponent> = {
  'whats-new': Sparkles,
  about: FileText,
  privacy: Shield,
  terms: FileText,
  feedback: MessageSquare,
}

export default function MoreMenuSheet({
  isOpen,
  onClose,
  isLoggedIn,
  unreadNotifications,
}: MoreMenuSheetProps) {
  const titleId = useId()
  const { handleRouteItem, handleLogin, handleSignUp } = useMoreMenuActions(onClose)

  function handleItemClick(item: MoreMenuRouteItem) {
    handleRouteItem(item, isLoggedIn)
  }

  const accountItems = isLoggedIn
    ? MORE_MENU_ACCOUNT_LOGGED_IN
    : MORE_MENU_ACCOUNT_SIGNED_OUT

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="more-sheet-overlay"
      contentClassName="more-sheet"
    >
      <div className="more-sheet__header">
        <h2 id={titleId} className="more-sheet__title">
          More
        </h2>
        <button
          type="button"
          className="more-sheet__close"
          onClick={onClose}
          aria-label="Close more menu"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <section className="more-sheet__section" aria-labelledby={`${titleId}-account`}>
        <h3 id={`${titleId}-account`} className="more-sheet__section-title">
          Account
        </h3>
        <div className="more-sheet__list">
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                className="more-sheet__item"
                onClick={handleLogin}
              >
                <LogIn size={18} aria-hidden="true" />
                <span>Log in</span>
              </button>
              <button
                type="button"
                className="more-sheet__item more-sheet__item--accent"
                onClick={handleSignUp}
              >
                <UserPlus size={18} aria-hidden="true" />
                <span>Sign up</span>
              </button>
            </>
          ) : null}

          {accountItems.map((item) => {
            const Icon = ACCOUNT_ICONS[item.id] ?? ChefHat
            const showBadge =
              item.id === 'notifications' && isLoggedIn && unreadNotifications > 0

            return (
              <button
                key={item.id}
                type="button"
                className="more-sheet__item"
                onClick={() => handleItemClick(item)}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="more-sheet__item-label">{item.label}</span>
                {showBadge ? (
                  <span className="more-sheet__badge" aria-hidden="true">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                ) : null}
                {!isLoggedIn ? (
                  <span className="more-sheet__item-hint">Sign in</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className="more-sheet__section" aria-labelledby={`${titleId}-app`}>
        <h3 id={`${titleId}-app`} className="more-sheet__section-title">
          App
        </h3>
        <div className="more-sheet__list">
          {MORE_MENU_APP_LINKS.map((item) => {
            const Icon = APP_ICONS[item.id] ?? Newspaper

            return (
              <button
                key={item.id}
                type="button"
                className="more-sheet__item"
                onClick={() => handleItemClick(item)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="more-sheet__beta-note">
        Savora is currently in beta. Thanks for helping us improve.
      </p>
    </Modal>
  )
}
