import { supabase } from '../lib/supabaseClient'

export type NotificationType = 'comment' | 'like' | 'follow'

export type AppNotification = {
  id: string
  type: NotificationType
  message: string
  actorId: string | null
  recipeId: number | null
  readAt: string | null
  createdAt: string
}

export async function createNotification(input: {
  userId: string
  type: NotificationType
  actorId?: string | null
  recipeId?: number
  message: string
}): Promise<void> {
  void input.actorId

  const { error } = await supabase.rpc('create_notification_safe', {
    p_user_id: input.userId,
    p_type: input.type,
    p_message: input.message,
    p_recipe_id: input.recipeId,
  })

  if (error) {
    console.error('createNotification failed:', error)
    if (import.meta.env.DEV) {
      throw error
    }
  }
}

export async function getNotificationsForUser(
  userId: string,
  limit = 40
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, message, actor_id, recipe_id, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => {
    const record = row as {
      id: string
      type: NotificationType
      message: string
      actor_id: string | null
      recipe_id: number | null
      read_at: string | null
      created_at: string
    }

    return {
      id: record.id,
      type: record.type,
      message: record.message,
      actorId: record.actor_id,
      recipeId: record.recipe_id,
      readAt: record.read_at,
      createdAt: record.created_at,
    }
  })
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
  return count ?? 0
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', notificationId)

  if (error) throw error
}
