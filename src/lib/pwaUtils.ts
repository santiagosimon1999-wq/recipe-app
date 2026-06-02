const ANDROID_DISMISS_KEY = 'savora-pwa-android-install-dismissed'
const IOS_DISMISS_KEY = 'savora-pwa-ios-install-dismissed'

export function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosSafari(): boolean {
  const userAgent = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(userAgent)
  const isSafari =
    /safari/i.test(userAgent) && !/crios|fxios|edgios|opios/i.test(userAgent)
  return isIos && isSafari
}

export function wasAndroidInstallDismissed(): boolean {
  try {
    return localStorage.getItem(ANDROID_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function wasIosInstallDismissed(): boolean {
  try {
    return localStorage.getItem(IOS_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissAndroidInstallPrompt(): void {
  try {
    localStorage.setItem(ANDROID_DISMISS_KEY, '1')
  } catch {
    // Ignore storage failures.
  }
}

export function dismissIosInstallPrompt(): void {
  try {
    localStorage.setItem(IOS_DISMISS_KEY, '1')
  } catch {
    // Ignore storage failures.
  }
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export {
  ANDROID_DISMISS_KEY,
  IOS_DISMISS_KEY,
}
