import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  dismissAndroidInstallPrompt,
  dismissIosInstallPrompt,
  isIosSafari,
  isStandaloneMode,
  wasAndroidInstallDismissed,
  wasIosInstallDismissed,
  type BeforeInstallPromptEvent,
} from '../lib/pwaUtils'

export default function InstallPrompt() {
  const [androidPrompt, setAndroidPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIos, setShowIos] = useState(
    () =>
      !isStandaloneMode() && isIosSafari() && !wasIosInstallDismissed(),
  )

  useEffect(() => {
    if (isStandaloneMode()) {
      return
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      const installEvent = event as BeforeInstallPromptEvent
      setAndroidPrompt(installEvent)
      if (!wasAndroidInstallDismissed()) {
        setShowAndroid(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function handleAndroidInstall() {
    if (!androidPrompt) {
      return
    }

    await androidPrompt.prompt()
    const choice = await androidPrompt.userChoice
    setShowAndroid(false)
    setAndroidPrompt(null)

    if (choice.outcome === 'dismissed') {
      dismissAndroidInstallPrompt()
    }
  }

  function handleDismissAndroid() {
    dismissAndroidInstallPrompt()
    setShowAndroid(false)
  }

  function handleDismissIos() {
    dismissIosInstallPrompt()
    setShowIos(false)
  }

  if (isStandaloneMode()) {
    return null
  }

  if (showAndroid) {
    return (
      <aside className="install-prompt" role="dialog" aria-label="Install Savora">
        <div className="install-prompt__content">
          <Download size={18} aria-hidden="true" />
          <div>
            <p className="install-prompt__title">Install Savora</p>
            <p className="install-prompt__body">
              Add Savora to your home screen for quick access.
            </p>
          </div>
        </div>
        <div className="install-prompt__actions">
          <button
            type="button"
            className="install-prompt__primary"
            onClick={() => void handleAndroidInstall()}
          >
            Install
          </button>
          <button
            type="button"
            className="install-prompt__dismiss"
            onClick={handleDismissAndroid}
            aria-label="Dismiss install prompt"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>
    )
  }

  if (showIos) {
    return (
      <aside className="install-prompt" role="dialog" aria-label="Add Savora to Home Screen">
        <div className="install-prompt__content">
          <Share size={18} aria-hidden="true" />
          <div>
            <p className="install-prompt__title">Add Savora to Home Screen</p>
            <p className="install-prompt__body">
              Tap Share → Add to Home Screen for an app-like experience.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="install-prompt__dismiss"
          onClick={handleDismissIos}
          aria-label="Dismiss install hint"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </aside>
    )
  }

  return null
}
