export type ActivityEventType =
  | 'recipe_post'
  | 'follow'
  | 'recipe_like'
  | 'recipe_comment'

export type ActivityActor = {
  id: string
  displayName: string
  username: string | null
  avatarUrl: string | null
}

export type ActivityRecipeRef = {
  id: number
  title: string
  authorId: string
  authorDisplayName: string
  authorUsername: string | null
}

export type ActivityUserRef = {
  id: string
  displayName: string
  username: string | null
}

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  createdAt: string
  groupCount: number
  actor: ActivityActor
  recipe: ActivityRecipeRef | null
  targetUser: ActivityUserRef | null
  commentPreview: string | null
}

export type ActivityFeedResult = {
  events: ActivityEvent[]
  followingCount: number
}
