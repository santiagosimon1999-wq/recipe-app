import type { CategoryTag } from './Category'

export type RecipeSource = 'sample' | 'user' | 'community'

export type Recipe = {
  id: number
  title: string
  image: string
  imageFile?: File | null
  description: string
  category: string
  categories?: string[]
  categoryTags?: CategoryTag[]
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Cooking time in minutes. Null means not set (displays as —). */
  cookingTime?: number | null
  /** Number of servings. Null means not set (displays as —). */
  servings?: number | null
  ingredients: string[]
  instructions: string
  source?: RecipeSource
  userId?: string
  authorName?: string
  /** Profile username for linking to /users/:username (community/user recipes). */
  authorUsername?: string
  isPublic?: boolean
  likeCount: number
  liked: boolean
}
