export default function GuestWelcomeCard() {
  return (
    <section className="guest-welcome-card">
      <div>
        <p className="guest-welcome-card__eyebrow">Welcome to Savora</p>
        <h2 className="guest-welcome-card__title">Browse recipes for free</h2>
        <p className="guest-welcome-card__body">
          Create a free account to save favorites, comment on recipes, follow
          creators, and share your own dishes.
        </p>
      </div>
      <p className="guest-welcome-card__hint guest-cta-mobile-only">
        Use the buttons above to log in or sign up.
      </p>
    </section>
  )
}
