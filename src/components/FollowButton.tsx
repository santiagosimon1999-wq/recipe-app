import { useCallback, useEffect, useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { notify } from '../lib/toast'
import {
  followUser,
  isFollowing,
  unfollowUser,
} from '../services/follows'
import { createNotification } from '../services/notifications'

type FollowButtonProps = {
  targetUserId: string
  targetDisplayName?: string
  className?: string
}

export default function FollowButton({
  targetUserId,
  targetDisplayName = 'this chef',
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const isSelf = Boolean(user && user.id === targetUserId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user || isSelf) {
        setFollowing(false)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const result = await isFollowing(user.id, targetUserId)
        if (!cancelled) setFollowing(result)
      } catch (error) {
        console.error('Failed to load follow status:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user, targetUserId, isSelf])

  const handleToggle = useCallback(async () => {
    if (!user || isSelf || busy) return

    setBusy(true)

    try {
      if (following) {
        await unfollowUser(user.id, targetUserId)
        setFollowing(false)
        notify.success(`Unfollowed ${targetDisplayName}.`)
      } else {
        await followUser(user.id, targetUserId)
        setFollowing(true)
        notify.success(`You are now following ${targetDisplayName}.`)

        void createNotification({
          userId: targetUserId,
          type: 'follow',
          actorId: user.id,
          message: 'Someone started following you.',
        })
      }
    } catch (error) {
      console.error('Follow toggle failed:', error)
      notify.error('Could not update follow status. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [user, isSelf, busy, following, targetUserId, targetDisplayName])

  if (isSelf) {
    return null
  }

  if (!user) {
    return (
      <button
        type="button"
        className={`follow-button ${className}`.trim()}
        onClick={() => notify.info('Sign in to follow chefs.')}
      >
        <UserPlus size={16} aria-hidden="true" />
        Follow
      </button>
    )
  }

  if (loading) {
    return (
      <button
        type="button"
        className={`follow-button follow-button--loading ${className}`.trim()}
        disabled
        aria-busy="true"
      >
        …
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`follow-button ${
        following ? 'follow-button--following' : ''
      } ${className}`.trim()}
      onClick={() => void handleToggle()}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? (
        <>
          <UserMinus size={16} aria-hidden="true" />
          Following
        </>
      ) : (
        <>
          <UserPlus size={16} aria-hidden="true" />
          Follow
        </>
      )}
    </button>
  )
}
