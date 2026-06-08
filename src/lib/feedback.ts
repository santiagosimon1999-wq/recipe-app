export function getFeedbackEmail(): string | null {
  const configured = import.meta.env.VITE_FEEDBACK_EMAIL
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim()
  }
  return null
}

export function isFeedbackConfigured(): boolean {
  return getFeedbackEmail() !== null
}

export function getFeedbackMailto(subject = 'Savora beta feedback'): string | null {
  const email = getFeedbackEmail()
  if (!email) return null
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}
