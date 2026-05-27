export function mapAuthError(error: unknown, context: 'login' | 'signup'): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return 'Email or password is incorrect.'
  }

  if (message.includes('user already registered') || message.includes('already registered')) {
    return 'An account with this email already exists. Try logging in.'
  }

  if (
    message.includes('password') &&
    (message.includes('6') || message.includes('8') || message.includes('short'))
  ) {
    return 'Password must be at least 8 characters.'
  }

  if (message.includes('valid email') || message.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }

  if (context === 'login') {
    return 'Unable to log in. Please try again.'
  }

  return 'Unable to create account. Please try again.'
}
