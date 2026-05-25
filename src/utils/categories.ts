export const RECIPE_CATEGORIES = [
  'Mediterranean',
  'Asian',
  'Mexican',
  'Italian',
  'Indian',
  'Vegan',
  'Vegetarian',
  'Desserts',
  'Fast Food',
  'Party Food',
  'Kids Food',
  'Soups and Stews',
  'Salads',
  'Main Courses',
  'Appetizers',
  'International',
  'Breakfast',
  'Grilled',
  'Low Carb',
  'High Protein',
] as const

export const RECIPE_FILTER_CATEGORIES = ['All', ...RECIPE_CATEGORIES] as const