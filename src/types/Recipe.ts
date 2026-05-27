export type RecipeSource = 'sample' | 'user' | 'community'

export type Recipe = {
  id: number
  title: string
  image: string
  imageFile?: File | null
  description: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
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
