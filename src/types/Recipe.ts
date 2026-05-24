export type Recipe = {
  id: number;
  title: string;
  image: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string | string[];
};