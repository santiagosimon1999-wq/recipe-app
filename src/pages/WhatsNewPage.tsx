import { NavLink } from 'react-router'
import TrustPageLayout from '../components/TrustPageLayout'

export default function WhatsNewPage() {
  return (
    <TrustPageLayout title="What's New" eyebrow="Savora Beta">
      <p>
        Thank you for helping us test Savora during closed beta. Here is a
        quick look at what is already in the app.
      </p>

      <h2>Recent improvements</h2>
      <ul>
        <li>Public recipe browsing for guests — discover and search without an account</li>
        <li>Clear Sign up and Log in prompts across the app</li>
        <li>Save, like, comment, and follow flows for signed-in users</li>
        <li>Mobile navigation polish with a bottom tab bar</li>
        <li>About, Privacy, Terms, and Feedback pages for beta transparency</li>
        <li>Post-login redirect back to the page you were viewing</li>
      </ul>

      <p className="trust-page__note">
        More updates are coming as we test with early users. Share feedback
        anytime from the{' '}
        <NavLink to="/feedback" className="trust-page__inline-link">
          Feedback
        </NavLink>{' '}
        page.
      </p>
    </TrustPageLayout>
  )
}
