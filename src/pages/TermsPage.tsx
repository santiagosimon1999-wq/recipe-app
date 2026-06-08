import TrustPageLayout from '../components/TrustPageLayout'

export default function TermsPage() {
  return (
    <TrustPageLayout title="Terms of use (beta)">
      <p className="trust-page__disclaimer">
        These terms are provided for beta testing only. This is not legal advice.
        These terms may be updated before public launch and should be reviewed
        by a qualified professional before public launch.
      </p>

      <h2>Using Savora</h2>
      <p>
        By using Savora during beta, you agree to use the app respectfully and
        follow these guidelines while we continue to improve the product.
      </p>

      <h2>Your content</h2>
      <ul>
        <li>You are responsible for the recipes, comments, and images you post.</li>
        <li>
          Do not post harmful, illegal, harassing, or misleading content.
        </li>
        <li>
          Do not post copyrighted material you do not have rights to share.
        </li>
        <li>
          Recipe instructions, nutrition estimates, and macros are informational
          only. Always use your own judgment for allergies, dietary needs, and
          food safety.
        </li>
      </ul>

      <h2>Moderation during beta</h2>
      <p>
        Savora may remove or hide content that appears inappropriate, abusive, or
        out of scope for the community while the product is in beta.
      </p>

      <h2>Service changes</h2>
      <p>
        Features, availability, and these terms may change as Savora moves
        toward a wider release. We will update this page when that happens.
      </p>
    </TrustPageLayout>
  )
}
