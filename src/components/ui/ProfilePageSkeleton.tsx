import { Skeleton } from './Skeleton'

export function ProfilePageSkeleton() {
  return (
    <section
      className="profile-page"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="profile-page__layout">
        <aside className="profile-page__sidebar">
          <Skeleton className="profile-skeleton__avatar" />
          <div className="profile-page__info-card">
            <Skeleton className="profile-skeleton__line profile-skeleton__line--short" />
            <Skeleton className="profile-skeleton__line profile-skeleton__line--title" />
            <Skeleton className="profile-skeleton__line" />
            <Skeleton className="profile-skeleton__line profile-skeleton__line--half" />
          </div>
        </aside>

        <div className="profile-page__main">
          <div className="profile-page__stats-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="profile-page__stat-card">
                <Skeleton className="profile-skeleton__line profile-skeleton__line--short" />
                <Skeleton className="profile-skeleton__line profile-skeleton__line--stat" />
              </div>
            ))}
          </div>
          <Skeleton className="profile-skeleton__block" />
        </div>
      </div>
    </section>
  )
}
