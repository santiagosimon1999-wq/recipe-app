import { useEffect, useState } from "react";
import type { Recipe } from "../types/Recipe";

type RecipeFormProps = {
  initialRecipe: Recipe | null;
  onSaveRecipe: (recipe: Recipe) => void;
  onCancel: () => void;
};

function RecipeForm({
  initialRecipe,
  onSaveRecipe,
  onCancel,
}: RecipeFormProps) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Healthy");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title);
      setImage(initialRecipe.image);
      setDescription(initialRecipe.description);
      setCategory(initialRecipe.category);
      setCalories(String(initialRecipe.calories));
      setProtein(String(initialRecipe.protein));
      setCarbs(String(initialRecipe.carbs));
      setFat(String(initialRecipe.fat));
      setIngredients(initialRecipe.ingredients.join("\n"));
      setInstructions(initialRecipe.instructions);
    } else {
      setTitle("");
      setImage("");
      setDescription("");
      setCategory("Healthy");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setIngredients("");
      setInstructions("");
    }

    setErrorMessage("");
  }, [initialRecipe]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !title.trim() ||
      !image.trim() ||
      !description.trim() ||
      !ingredients.trim() ||
      !instructions.trim()
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (
      Number(calories) < 0 ||
      Number(protein) < 0 ||
      Number(carbs) < 0 ||
      Number(fat) < 0
    ) {
      setErrorMessage("Nutrition values cannot be negative.");
      return;
    }

    const recipeToSave: Recipe = {
      id: initialRecipe?.id ?? 0,
      title: title.trim(),
      image: image.trim(),
      description: description.trim(),
      category,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      ingredients: ingredients
        .split("\n")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient !== ""),
      instructions: instructions.trim(),
    };

    onSaveRecipe(recipeToSave);
    setErrorMessage("");
  };

  return (
    <section className="recipe-form-section">
      <h2 className="recipe-form__title">
        {initialRecipe ? "Edit Recipe" : "Create Recipe"}
      </h2>

      {errorMessage && <p className="recipe-form__error">{errorMessage}</p>}

      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="recipe-form__group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="image">Image URL</label>
          <input
            id="image"
            type="text"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Healthy">Healthy</option>
            <option value="Italian">Italian</option>
            <option value="Fast Food">Fast Food</option>
          </select>
        </div>

        <div className="recipe-form__row">
          <div className="recipe-form__group">
            <label htmlFor="calories">Calories</label>
            <input
              id="calories"
              type="number"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </div>

          <div className="recipe-form__group">
            <label htmlFor="protein">Protein</label>
            <input
              id="protein"
              type="number"
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
            />
          </div>

          <div className="recipe-form__group">
            <label htmlFor="carbs">Carbs</label>
            <input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(event) => setCarbs(event.target.value)}
            />
          </div>

          <div className="recipe-form__group">
            <label htmlFor="fat">Fat</label>
            <input
              id="fat"
              type="number"
              value={fat}
              onChange={(event) => setFat(event.target.value)}
            />
          </div>
        </div>

        <div className="recipe-form__group">
          <label htmlFor="ingredients">Ingredients (one per line)</label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="instructions">Instructions</label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </div>

        <div className="recipe-form__actions">
          <button type="submit" className="recipe-form__submit-button">
            {initialRecipe ? "Save changes" : "Add recipe"}
          </button>

          <button
            type="button"
            className="recipe-form__cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default RecipeForm;