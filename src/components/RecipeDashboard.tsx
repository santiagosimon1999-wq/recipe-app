import { NavLink } from 'react-router'
import type { Recipe } from '../types/Recipe'
import AuthPromptCard from './AuthPromptCard'
import RecipeSection from './RecipeSection'
import { useAuthNavigation } from '../hooks/useAuthNavigation'

type RecipeDashboardProps = {
  userRecipes: Recipe[]
  communityPreview: Recipe[]
  savoraInspirationPreview: Recipe[]
  savedRecipesPreview: Recipe[]
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  isLoggedIn: boolean
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartCreateRecipe: () => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
  onEdit?: (recipe: Recipe) => void
}

export default function RecipeDashboard({
  userRecipes,
  communityPreview,
  savoraInspirationPreview,
  savedRecipesPreview,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  isLoggedIn,
  onToggleSaved,
  onSelectRecipe,
  onStartCreateRecipe,
  onToggleLike,
  onViewAuthor,
  onEdit,
}: RecipeDashboardProps) {
  const { goToLogin, goToSignUp } = useAuthNavigation()

  return (
    <div className="home-dashboard" data-testid="home-dashboard">
      {isLoggedIn ? (
        <section className="home-dashboard__intro">
          <p className="app-eyebrow">Your kitchen</p>
          <h2 className="home-dashboard__title">Your cooking dashboard</h2>
          <p className="home-dashboard__copy">
            Create recipes, revisit what you have saved, and jump back into the
            community when you want fresh inspiration.
          </p>
          <div className="home-dashboard__actions">
            <button type="button" onClick={onStartCreateRecipe}>
              New recipe
            </button>
            <NavLink to="/saved" className="home-dashboard__link-button">
              Saved recipes
            </NavLink>
            <NavLink to="/community" className="home-dashboard__link-button">
              Explore community
            </NavLink>
          </div>
        </section>
      ) : (
        <section
          className="home-dashboard__intro home-dashboard__intro--guest"
          data-testid="home-dashboard-welcome"
        >
          <p className="app-eyebrow">Welcome</p>
          <h2 className="home-dashboard__title">Welcome to your kitchen</h2>
          <p className="home-dashboard__copy">
            Browse public recipes on Savora, then create a free account to save
            favorites, follow creators, comment, and share your own dishes.
          </p>
          <div className="home-dashboard__actions">
            <NavLink
              to="/community"
              className="auth-cta-button auth-cta-button--secondary"
            >
              Explore the community
            </NavLink>
            <NavLink
              to="/search"
              className="auth-cta-button auth-cta-button--primary"
            >
              Search recipes
            </NavLink>
          </div>
        </section>
      )}

      {isLoggedIn ? (
        userRecipes.length > 0 ? (
          <RecipeSection
            eyebrow="Your recipes"
            title="From your kitchen"
            countLabel="recipes"
            recipes={userRecipes}
            sampleSavedRecipeIds={sampleSavedRecipeIds}
            cloudSavedRecipeIds={cloudSavedRecipeIds}
            likedRecipeIds={likedRecipeIds}
            likeCountsByRecipeId={likeCountsByRecipeId}
            onToggleSaved={onToggleSaved}
            onSelectRecipe={onSelectRecipe}
            onToggleLike={onToggleLike}
            onViewAuthor={onViewAuthor}
            onEdit={onEdit}
          />
        ) : (
          <section className="empty-profile-state">
            <h2>Your recipe board is empty</h2>
            <p>
              Create your first recipe with ingredients, macros, instructions,
              and a real image.
            </p>
            <button type="button" onClick={onStartCreateRecipe}>
              Create your first recipe
            </button>
          </section>
        )
      ) : (
        <section className="empty-profile-state empty-profile-state--guest">
          <h2>Your personal recipe board lives here</h2>
          <p>
            Sign up to save favorites, publish your own recipes, and track what
            you cook.
          </p>
          <p className="empty-profile-state__guest-hint guest-cta-mobile-only">
            Create your free account from the hero above when you are ready.
          </p>
          <div className="guest-cta-desktop-only">
            <AuthPromptCard
              compact
              message="Create a free account to build your recipe collection."
              onLogin={() => goToLogin()}
              onSignUp={() =>
                goToSignUp('Create a free account to build your recipe collection.')
              }
            />
          </div>
        </section>
      )}

      {isLoggedIn && savedRecipesPreview.length > 0 ? (
        <RecipeSection
          eyebrow="Saved"
          title="Recently saved"
          countLabel="saved"
          recipes={savedRecipesPreview}
          sampleSavedRecipeIds={sampleSavedRecipeIds}
          cloudSavedRecipeIds={cloudSavedRecipeIds}
          likedRecipeIds={likedRecipeIds}
          likeCountsByRecipeId={likeCountsByRecipeId}
          onToggleSaved={onToggleSaved}
          onSelectRecipe={onSelectRecipe}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
        />
      ) : null}

      {communityPreview.length > 0 ? (
        <>
          <RecipeSection
            eyebrow="From the community"
            title="Recently shared"
            countLabel="preview"
            recipes={communityPreview}
            sampleSavedRecipeIds={sampleSavedRecipeIds}
            cloudSavedRecipeIds={cloudSavedRecipeIds}
            likedRecipeIds={likedRecipeIds}
            likeCountsByRecipeId={likeCountsByRecipeId}
            onToggleSaved={onToggleSaved}
            onSelectRecipe={onSelectRecipe}
            onToggleLike={onToggleLike}
            onViewAuthor={onViewAuthor}
          />
          <div className="home-dashboard__cta">
            <NavLink
              to="/community"
              className="auth-cta-button auth-cta-button--secondary"
            >
              Explore Community
            </NavLink>
          </div>
        </>
      ) : null}

      {savoraInspirationPreview.length > 0 ? (
        <RecipeSection
          eyebrow="Savora inspiration"
          title="Ideas to try next"
          countLabel="ideas"
          recipes={savoraInspirationPreview}
          sampleSavedRecipeIds={sampleSavedRecipeIds}
          cloudSavedRecipeIds={cloudSavedRecipeIds}
          likedRecipeIds={likedRecipeIds}
          likeCountsByRecipeId={likeCountsByRecipeId}
          onToggleSaved={onToggleSaved}
          onSelectRecipe={onSelectRecipe}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
        />
      ) : null}
    </div>
  )
}
