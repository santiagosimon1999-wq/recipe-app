export type CreatorDashboardKpis = {
  publicRecipesCount: number
  totalLikesReceived: number
  totalCommentsReceived: number
  followersCount: number
  newFollowers7d: number
  newFollowers30d: number
  recipesPublished7d: number
  recipesPublished30d: number
}

export type CreatorDashboardTopRecipe = {
  id: number
  title: string
  publishedAt: string
  likeCount: number
  commentCount: number
}

export type CreatorDashboardRecentComment = {
  id: string
  recipeId: number
  recipeTitle: string
  content: string
  createdAt: string
  authorDisplayName: string
  authorUsername: string | null
  authorAvatarUrl: string | null
}

export type CreatorProfileCompleteness = {
  score: number
  completedFields: number
  totalFields: number
}

export type CreatorDashboardData = {
  kpis: CreatorDashboardKpis
  topRecipes: CreatorDashboardTopRecipe[]
  recentComments: CreatorDashboardRecentComment[]
  profileCompleteness: CreatorProfileCompleteness
  hasPublicRecipes: boolean
}
