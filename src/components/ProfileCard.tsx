type ProfileCardProps = {
  displayName: string
  email?: string | null
  userInitial: string
  totalRecipes: number
  savedCount: number
  averageCalories: number
}

export default function ProfileCard({
  displayName,
  email,
  userInitial,
  totalRecipes,
  savedCount,
  averageCalories,
}: ProfileCardProps) {
  return (
    <section className="profile-card">
      <div className="profile-card__main">
        <div className="profile-card__avatar">{userInitial}</div>

        <div>
          <p className="profile-card__label">Welcome back</p>
          <h2 className="profile-card__name">{displayName}</h2>
          <p className="profile-card__email">{email}</p>
        </div>
      </div>

      <div className="profile-card__stats">
        <div className="profile-stat">
          <span>{totalRecipes}</span>
          <p>Recipes</p>
        </div>

        <div className="profile-stat">
          <span>{savedCount}</span>
          <p>Saved</p>
        </div>

        <div className="profile-stat">
          <span>{averageCalories}</span>
          <p>Avg cal</p>
        </div>
      </div>
    </section>
  )
}
