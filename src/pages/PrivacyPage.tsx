import TrustPageLayout from '../components/TrustPageLayout'

export default function PrivacyPage() {
  return (
    <TrustPageLayout title="Privacy notice (beta)">
      <p className="trust-page__disclaimer">
        This beta privacy notice is a plain-language summary. This is not legal
        advice. This beta notice may be updated before public launch and should
        be reviewed by a qualified professional before public launch.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account and authentication data</strong> — email and sign-in
          details handled by Supabase when you create an account or log in.
        </li>
        <li>
          <strong>Profile information you choose to add</strong> — display name,
          bio, avatar, and username.
        </li>
        <li>
          <strong>Recipe and social activity</strong> — recipes you create,
          comments, likes, follows, and saved recipes.
        </li>
        <li>
          <strong>Uploaded images</strong> — recipe photos and profile avatars
          you upload to Savora.
        </li>
        <li>
          <strong>Error monitoring (optional)</strong> — if Sentry is enabled
          in production, we may receive basic error reports to help fix bugs.
          We aim to avoid sending unnecessary personal data in those reports.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use this information to run Savora: authenticate you, show your
        profile and recipes, power social features, and improve stability during
        beta.
      </p>

      <h2>Your choices</h2>
      <p>
        You can browse public content without an account. Account holders can
        update profile details from their profile page and delete their account
        from profile settings.
      </p>

      <h2>Questions</h2>
      <p>
        For privacy questions during beta, use the Feedback link in the app
        footer.
      </p>
    </TrustPageLayout>
  )
}
