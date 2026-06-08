import { useCallback, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import AuthPromptCard from '../components/AuthPromptCard'
import { Modal } from '../components/ui/Modal'
import { useAuthNavigation } from '../hooks/useAuthNavigation'
import { DEFAULT_AUTH_PROMPT_MESSAGE } from '../lib/authNavigation'
import { AuthPromptContext } from './auth-prompt-context'

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const { goToLogin, goToSignUp } = useAuthNavigation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(DEFAULT_AUTH_PROMPT_MESSAGE)

  const promptAuth = useCallback((options?: { reason?: string }) => {
    setMessage(options?.reason ?? DEFAULT_AUTH_PROMPT_MESSAGE)
    setOpen(true)
  }, [])

  function handleLogin() {
    setOpen(false)
    goToLogin(message)
  }

  function handleSignUp() {
    setOpen(false)
    goToSignUp(message)
  }

  return (
    <AuthPromptContext.Provider value={{ promptAuth }}>
      {children}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Join Savora"
        contentClassName="auth-prompt-modal"
        overlayClassName="recipe-modal-overlay"
      >
        <div className="auth-prompt-modal__header">
          <button
            type="button"
            className="auth-prompt-modal__close"
            onClick={() => setOpen(false)}
            aria-label="Close Join Savora dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <AuthPromptCard
          message={message}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          variant="modal"
        />
      </Modal>
    </AuthPromptContext.Provider>
  )
}
