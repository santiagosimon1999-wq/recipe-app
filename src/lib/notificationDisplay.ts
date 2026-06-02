import { Heart, MessageSquareText, UserRoundPlus, type LucideIcon } from 'lucide-react'
import type { AppNotification, NotificationType } from '../services/notifications'

function getActorLabel(notification: AppNotification): string {
  if (notification.actorUsername) {
    return `@${notification.actorUsername}`
  }

  if (notification.actorDisplayName) {
    return notification.actorDisplayName
  }

  return 'Someone'
}

export function formatNotificationMessage(notification: AppNotification): string {
  const actor = getActorLabel(notification)

  switch (notification.type) {
    case 'like':
      return `${actor} liked your recipe`
    case 'comment':
      return `${actor} commented on your recipe`
    case 'follow':
      return `${actor} started following you`
    default:
      return notification.message
  }
}

export function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case 'like':
      return Heart
    case 'comment':
      return MessageSquareText
    case 'follow':
      return UserRoundPlus
  }
}
