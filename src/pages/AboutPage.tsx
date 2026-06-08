import { NavLink } from 'react-router'
import TrustPageLayout from '../components/TrustPageLayout'

export default function AboutPage() {
  return (
    <TrustPageLayout title="About Savora">
      <p>
        Savora is a social recipe app for discovering, saving, and sharing
        recipes with a food-loving community.
      </p>
      <p>
        Browse public recipes, search the community feed, and explore creator
        profiles without an account. When you are ready to do more, create a
        free account to save favorites, comment on recipes, follow creators, and
        publish your own dishes.
      </p>
      <p>
        Savora helps you keep recipes in one place, track basic nutrition
        details, and share what you cook with friends and fellow home chefs.
      </p>
      <p className="trust-page__note">
        Savora is currently in beta. Features and policies may evolve as we
        learn from early users. See{' '}
        <NavLink to="/whats-new" className="trust-page__inline-link">
          What&apos;s New
        </NavLink>{' '}
        for recent updates.
      </p>
    </TrustPageLayout>
  )
}
