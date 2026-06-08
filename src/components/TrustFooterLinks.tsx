import { NavLink } from 'react-router'

type TrustFooterLinksProps = {
  compact?: boolean
  className?: string
}

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'trust-footer-links__link trust-footer-links__link--active'
    : 'trust-footer-links__link'
}

export default function TrustFooterLinks({
  compact = false,
  className = '',
}: TrustFooterLinksProps) {
  return (
    <nav
      className={`trust-footer-links${compact ? ' trust-footer-links--compact' : ''}${className ? ` ${className}` : ''}`}
      aria-label="About and legal"
    >
      <NavLink to="/about" className={linkClass}>
        About
      </NavLink>
      <NavLink to="/whats-new" className={linkClass}>
        What&apos;s New
      </NavLink>
      <NavLink to="/privacy" className={linkClass}>
        Privacy
      </NavLink>
      <NavLink to="/terms" className={linkClass}>
        Terms
      </NavLink>
      <NavLink to="/feedback" className={linkClass}>
        Feedback
      </NavLink>
    </nav>
  )
}
