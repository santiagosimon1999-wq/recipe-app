import type { Recipe } from "../types/Recipe";

export const recipes: Recipe[] = [
  {
    id: 1,
    title: "Chicken Bowl",
    description: "Healthy grilled chicken with rice and vegetables.",
    category: "Healthy",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    ingredients: [
      "Chicken breast",
      "Rice",
      "Broccoli",
      "Carrots"
    ],
    instructions: [
      "Cook the rice",
      "Grill the chicken",
      "Steam vegetables",
      "Serve together"
    ],
    calories: 520,
    protein: 42,
    carbs: 48,
    fat: 14,
  },

  {
    id: 2,
    title: "Classic Burger",
    description: "Juicy beef burger with fries.",
    category: "Fast Food",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    ingredients: [
      "Beef patty",
      "Burger buns",
      "Cheese",
      "Fries"
    ],
    instructions: [
      "Cook beef patty",
      "Toast buns",
      "Assemble burger",
      "Serve with fries"
    ],
    calories: 890,
    protein: 45,
    carbs: 70,
    fat: 48,
  },

  {
    id: 3,
    title: "Pasta Alfredo",
    description: "Creamy Alfredo pasta with parmesan cheese.",
    category: "Italian",
    image:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a",
    ingredients: [
      "Pasta",
      "Cream",
      "Parmesan",
      "Butter"
    ],
    instructions: [
      "Boil pasta",
      "Prepare Alfredo sauce",
      "Mix together",
      "Serve hot"
    ],
    calories: 760,
    protein: 24,
    carbs: 82,
    fat: 36,
  },
];