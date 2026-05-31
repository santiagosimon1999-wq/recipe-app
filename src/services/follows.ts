import { supabase } from '../lib/supabaseClient'

export type FollowCounts = {
  followers: number
  following: number
}

export type FollowListProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

function isRateLimitViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: string; message?: string }
  const message = record.message?.toLowerCase() ?? ''
  return record.code === 'P0001' || message.includes('too quickly')
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
    if (isRateLimitViolation(error)) {
      throw new Error('You are following too quickly. Please wait and try again.')
    }
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

async function getProfilesByIds(profileIds: string[]): Promise<FollowListProfile[]> {
  if (profileIds.length === 0) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', profileIds)

  if (error) throw error

  const profileById = new Map<string, FollowListProfile>()
  for (const row of (data ?? []) as FollowListProfile[]) {
    profileById.set(row.id, row)
  }

  const ordered: FollowListProfile[] = []
  for (const id of profileIds) {
    const profile = profileById.get(id)
    if (profile) ordered.push(profile)
  }
  return ordered
}

export async function getFollowersForUser(userId: string): Promise<FollowListProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const followerIds = (data ?? [])
    .map((row) => (row as { follower_id: string | null }).follower_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return getProfilesByIds(followerIds)
}

export async function getFollowingForUser(userId: string): Promise<FollowListProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const followingIds = (data ?? [])
    .map((row) => (row as { following_id: string | null }).following_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return getProfilesByIds(followingIds)
}
