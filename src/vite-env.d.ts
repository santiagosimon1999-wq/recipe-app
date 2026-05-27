/// <reference types="vite/client" />

declare module '*.PNG' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Optional. When set, Sentry browser SDK initializes and captures errors. */
  readonly VITE_SENTRY_DSN?: string
  /** Optional. Production site origin for Open Graph / Twitter meta tags (no trailing slash). */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}