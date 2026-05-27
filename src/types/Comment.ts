/** UI shape for a recipe comment with joined author profile fields. */
export type RecipeComment = {
  id: string
  recipeId: number
  userId: string
  content: string
  createdAt: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}
