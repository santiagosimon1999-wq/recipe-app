import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

type TrustPageLayoutProps = {
  title: string
  eyebrow?: string
  children: ReactNode
}

export default function TrustPageLayout({
  title,
  eyebrow = 'Savora',
  children,
}: TrustPageLayoutProps) {
  return (
    <article className="trust-page">
      <header className="trust-page__header">
        <p className="app-eyebrow">{eyebrow}</p>
        <h1 className="trust-page__title">{title}</h1>
      </header>

      <div className="trust-page__content">{children}</div>

      <footer className="trust-page__back">
        <NavLink to="/" className="trust-page__back-link">
          Back to Savora
        </NavLink>
      </footer>
    </article>
  )
}
