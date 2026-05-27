import { Skeleton } from './Skeleton'

export function RecipeCardSkeleton() {
  return (
    <article className="recipe-card recipe-card--skeleton" aria-hidden="true">
      <Skeleton className="recipe-card-skeleton__image" />
      <div className="recipe-card-skeleton__body">
        <Skeleton className="recipe-card-skeleton__line recipe-card-skeleton__line--short" />
        <Skeleton className="recipe-card-skeleton__line recipe-card-skeleton__line--title" />
        <Skeleton className="recipe-card-skeleton__line" />
        <Skeleton className="recipe-card-skeleton__line recipe-card-skeleton__line--half" />
      </div>
    </article>
  )
}

export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="recipe-grid" aria-busy="true" aria-label="Loading recipes">
      {Array.from({ length: count }, (_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </section>
  )
}
