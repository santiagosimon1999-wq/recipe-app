import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export type AuthTabId = 'login' | 'signup'

type AuthTab = {
  id: AuthTabId
  label: string
}

type AuthTabsProps = {
  activeTab: AuthTabId
  onTabChange: (tab: AuthTabId) => void
  loginPanel: ReactNode
  signupPanel: ReactNode
}

const TABS: AuthTab[] = [
  { id: 'login', label: 'Login' },
  { id: 'signup', label: 'Sign Up' },
]

export function AuthTabs({
  activeTab,
  onTabChange,
  loginPanel,
  signupPanel,
}: AuthTabsProps) {
  const baseId = useId()
  const tabRefs = useRef<Record<AuthTabId, HTMLButtonElement | null>>({
    login: null,
    signup: null,
  })

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabId: AuthTabId) {
    const currentIndex = TABS.findIndex((tab) => tab.id === tabId)
    let nextIndex: number

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextIndex = (currentIndex + 1) % TABS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
    } else if (event.key === 'Home') {
      event.preventDefault()
      nextIndex = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      nextIndex = TABS.length - 1
    } else {
      return
    }

    const nextTab = TABS[nextIndex]
    onTabChange(nextTab.id)
    tabRefs.current[nextTab.id]?.focus()
  }

  return (
    <div className="auth-tabs">
      <div className="auth-tabs__list" role="tablist" aria-label="Authentication">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const tabId = `${baseId}-${tab.id}-tab`
          const panelId = `${baseId}-${tab.id}-panel`

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element
              }}
              type="button"
              role="tab"
              id={tabId}
              className={`auth-tabs__tab${isActive ? ' auth-tabs__tab--active' : ''}`}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-login-panel`}
        aria-labelledby={`${baseId}-login-tab`}
        hidden={activeTab !== 'login'}
        className="auth-panel"
      >
        {loginPanel}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-signup-panel`}
        aria-labelledby={`${baseId}-signup-tab`}
        hidden={activeTab !== 'signup'}
        className="auth-panel"
      >
        {signupPanel}
      </div>
    </div>
  )
}
