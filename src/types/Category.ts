export type CategoryGroupKey =
  | 'meal_type'
  | 'cuisine'
  | 'diet'
  | 'cooking_method'

export type CategoryTag = {
  id?: number
  name: string
  slug: string
  icon?: string | null
  groupKey: CategoryGroupKey
  groupLabel: string
}
