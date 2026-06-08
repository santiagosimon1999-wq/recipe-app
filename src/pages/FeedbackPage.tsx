import { NavLink } from 'react-router'
import TrustPageLayout from '../components/TrustPageLayout'
import {
  getFeedbackEmail,
  getFeedbackMailto,
  isFeedbackConfigured,
} from '../lib/feedback'

export default function FeedbackPage() {
  const configured = isFeedbackConfigured()
  const email = getFeedbackEmail()
  const mailto = getFeedbackMailto()

  return (
    <TrustPageLayout title="Feedback">
      <p>
        Savora is in beta, and your feedback helps us improve the experience
        before a wider launch.
      </p>
      <p>
        Tell us what is working, what feels confusing, or what you would like to
        see next — bugs, ideas, and general impressions are all welcome.
      </p>

      {configured && mailto && email ? (
        <>
          <div className="trust-page__cta-row">
            <a
              href={mailto}
              className="auth-cta-button auth-cta-button--primary"
            >
              Email feedback
            </a>
          </div>

          <p className="trust-page__note">
            We read beta messages at{' '}
            <a href={mailto} className="trust-page__inline-link">
              {email}
            </a>
            . A dedicated in-app feedback form may come later.
          </p>
        </>
      ) : (
        <p className="trust-page__disclaimer" role="status">
          Feedback email is not configured yet. If you are testing a deployed
          build, the team can add a contact address soon.
        </p>
      )}

      <p>
        Prefer browsing first?{' '}
        <NavLink to="/community" className="trust-page__inline-link">
          Explore public recipes
        </NavLink>
      </p>
    </TrustPageLayout>
  )
}
