import { supabase } from '../lib/supabaseClient'

export type FollowCounts = {
  followers: number
  following: number
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: string; status?: number }
  return record.code === '23505' || record.status === 409
}

export async function followUser(
  followerId: string,
  followingId: string
): Promise<void> {
  if (followerId === followingId) {
    throw new Error('You cannot follow yourself.')
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  })

  if (error) {
    if (isUniqueViolation(error)) return
    throw error
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: followerId, following_id: followingId })

  if (error) throw error
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) throw error

  return (data ?? [])
    .map((row) => (row as { following_id: string }).following_id)
    .filter(Boolean)
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const { data, error } = await supabase.rpc('get_follow_counts', {
    p_profile_id: userId,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data

  if (!row || typeof row !== 'object') {
    return { followers: 0, following: 0 }
  }

  const record = row as { followers?: number; following?: number }

  return {
    followers: record.followers ?? 0,
    following: record.following ?? 0,
  }
}
