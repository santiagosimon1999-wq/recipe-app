import { supabase } from './supabaseClient'
import { createNotification } from '../services/notifications'

export async function notifyRecipeOwner(
  recipeId: number,
  actorId: string,
  type: 'comment' | 'like',
  message: string
): Promise<void> {
  const { data, error } = await supabase
    .from('recipes')
    .select('user_id, title')
    .eq('id', recipeId)
    .maybeSingle()

  if (error || !data) return

  const ownerId = (data as { user_id: string }).user_id
  if (!ownerId || ownerId === actorId) return

  await createNotification({
    userId: ownerId,
    type,
    actorId,
    recipeId,
    message,
  })
}
