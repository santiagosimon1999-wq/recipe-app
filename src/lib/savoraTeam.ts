/** Public username for seeded inspiration recipes (see db/migrations/012). */
export const SAVORA_TEAM_USERNAME = 'savora-team'

export function isSavoraTeamRecipe(recipe: {
  authorUsername?: string
  authorName?: string
}): boolean {
  if (recipe.authorUsername?.toLowerCase() === SAVORA_TEAM_USERNAME) {
    return true
  }

  // Fallback when author_id was not synced yet (see migration 013).
  return recipe.authorName === 'Savora Chef'
}
