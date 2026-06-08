import TrustFooterLinks from './TrustFooterLinks'

export default function AppFooter() {
  return (
    <footer className="app-footer" role="contentinfo" aria-label="Site footer">
      <div className="app-footer__brand">
        <p className="app-footer__name">Savora</p>
        <p className="app-footer__tagline">Discover, save, and share recipes.</p>
        <p className="app-footer__beta">Savora is currently in beta.</p>
      </div>

      <TrustFooterLinks />

      <p className="app-footer__fine-print">
        © {new Date().getFullYear()} Savora. Beta preview.
      </p>
    </footer>
  )
}
