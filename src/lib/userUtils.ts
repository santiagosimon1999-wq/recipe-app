/** Fallback display name when profile.display_name is unset. */
export function getFallbackUserName(email: string | null | undefined): string {
  if (!email) return 'Savora'
  return email.split('@')[0]
}

/** Single initial for compact avatar chips (header profile card). */
export function getUserInitial(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return 'S'
  return nameOrEmail.charAt(0).toUpperCase()
}

/** Two-letter initials for profile avatar placeholders. */
export function getAvatarInitials(
  name: string | null | undefined,
  email?: string | null | undefined
): string {
  const source = (name?.trim() || email?.trim() || '')
    .replace(/[^a-zA-Z\s]/g, ' ')
  if (!source) return 'S'

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}
