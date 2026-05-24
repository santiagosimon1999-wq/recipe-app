import { useEffect, useState } from "react";
import "./index.css";
import RecipeGrid from "./components/RecipeGrid";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import RecipeModal from "./components/RecipeModal";
import RecipeForm from "./components/RecipeForm";
import { recipes as initialRecipes } from "./data/recipes";
import type { Recipe } from "./types/Recipe";

function App() {
  const [recipeList, setRecipeList] = useState<Recipe[]>(() => {
    try {
      const storedRecipes = localStorage.getItem("recipeList");

      if (storedRecipes) {
        return JSON.parse(storedRecipes);
      }
    } catch (error) {
      console.error("Failed to load recipes from localStorage:", error);
    }

    return initialRecipes;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [theme, setTheme] = useState("light");
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeBeingEdited, setRecipeBeingEdited] = useState<Recipe | null>(null);
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    try {
      const storedFavoriteRecipeIds = localStorage.getItem("favoriteRecipeIds");

      if (storedFavoriteRecipeIds) {
        setFavoriteRecipeIds(JSON.parse(storedFavoriteRecipeIds));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteRecipeIds", JSON.stringify(favoriteRecipeIds));
  }, [favoriteRecipeIds]);

  useEffect(() => {
    localStorage.setItem("recipeList", JSON.stringify(recipeList));
  }, [recipeList]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!formMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFormMessage("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [formMessage]);

  const filteredRecipes = recipeList.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || recipe.category === selectedCategory;

    const matchesFavorites =
      !showFavoritesOnly || favoriteRecipeIds.includes(recipe.id);

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const showClearFiltersButton =
    searchTerm !== "" || selectedCategory !== "All" || showFavoritesOnly;

  const handleAddRecipe = (recipeData: Recipe) => {
    if (recipeBeingEdited) {
      setRecipeList((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === recipeBeingEdited.id ? { ...recipeData, id: recipeBeingEdited.id } : recipe
        )
      );

      setSelectedRecipe({ ...recipeData, id: recipeBeingEdited.id });
      setFormMessage("Recipe updated successfully.");
    } else {
      const newRecipe = {
        ...recipeData,
        id: Date.now(),
      };

      setRecipeList((currentRecipes) => [newRecipe, ...currentRecipes]);
      setFormMessage("Recipe added successfully.");
    }

    setShowRecipeForm(false);
    setRecipeBeingEdited(null);
  };

  const handleStartCreateRecipe = () => {
    setRecipeBeingEdited(null);
    setShowRecipeForm(true);
    setSelectedRecipe(null);
    setFormMessage("");
  };

  const handleStartEditRecipe = (recipe: Recipe) => {
    setRecipeBeingEdited(recipe);
    setShowRecipeForm(true);
    setSelectedRecipe(null);
    setFormMessage("");
  };

  const handleCancelRecipeForm = () => {
    setShowRecipeForm(false);
    setRecipeBeingEdited(null);
  };

  const handleDeleteRecipe = (recipeId: number) => {
    const recipeToDelete = recipeList.find((recipe) => recipe.id === recipeId);
    const confirmed = window.confirm(
      `Delete "${recipeToDelete?.title ?? "this recipe"}"?`
    );

    if (!confirmed) {
      return;
    }

    setRecipeList((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId)
    );

    setFavoriteRecipeIds((currentIds) =>
      currentIds.filter((id) => id !== recipeId)
    );

    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe(null);
    }

    if (recipeBeingEdited?.id === recipeId) {
      setRecipeBeingEdited(null);
      setShowRecipeForm(false);
    }

    setFormMessage("Recipe deleted.");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setShowFavoritesOnly(false);
  };

  const handleToggleFavorite = (recipeId: number) => {
    const isAlreadyFavorite = favoriteRecipeIds.includes(recipeId);

    if (isAlreadyFavorite) {
      setFavoriteRecipeIds((currentIds) =>
        currentIds.filter((id) => id !== recipeId)
      );
    } else {
      setFavoriteRecipeIds((currentIds) => [...currentIds, recipeId]);
    }
  };

  const handleToggleShowFavoritesOnly = () => {
    setShowFavoritesOnly((currentValue) => !currentValue);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseModal = () => {
    setSelectedRecipe(null);
  };

  const handleToggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  };

  return (
    <main className={`app app--${theme}`}>
      <div className="app__container">
        <div className="app__header">
          <div>
            <h1 className="app__title">My Recipes</h1>
            <p className="app__favorites-count">
              Favorites: {favoriteRecipeIds.length}
            </p>
          </div>

          <button
            type="button"
            className="theme-toggle-button"
            onClick={handleToggleTheme}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>

        <p className="app__subtitle">
          A simple recipe app built with React + TypeScript
        </p>

        <button
          type="button"
          className="create-recipe-toggle-button"
          onClick={handleStartCreateRecipe}
        >
          Create recipe
        </button>

        {formMessage && <p className="form-message">{formMessage}</p>}

        {showRecipeForm && (
          <RecipeForm
            initialRecipe={recipeBeingEdited}
            onSaveRecipe={handleAddRecipe}
            onCancel={handleCancelRecipeForm}
          />
        )}

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <button
          type="button"
          className={
            showFavoritesOnly
              ? "favorites-toggle-button favorites-toggle-button--active"
              : "favorites-toggle-button"
          }
          onClick={handleToggleShowFavoritesOnly}
        >
          {showFavoritesOnly ? "Showing favorites only" : "Show favorites only"}
        </button>

        {showClearFiltersButton && (
          <button
            type="button"
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        )}

        <RecipeGrid
          recipes={filteredRecipes}
          favoriteRecipeIds={favoriteRecipeIds}
          onToggleFavorite={handleToggleFavorite}
          onSelectRecipe={handleSelectRecipe}
        />

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={handleCloseModal}
            onEdit={handleStartEditRecipe}
            onDelete={handleDeleteRecipe}
          />
        )}
      </div>
    </main>
  );
}

export default App;