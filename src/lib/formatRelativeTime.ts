export function formatRelativeTime(isoDate: string): string {
  const timestamp = Date.parse(isoDate)
  if (!Number.isFinite(timestamp)) {
    return 'Just now'
  }

  const diffMs = Date.now() - timestamp
  if (diffMs < 0) {
    return 'Just now'
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) {
    return 'Just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days === 1) {
    return 'Yesterday'
  }
  if (days < 7) {
    return `${days}d ago`
  }

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
