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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}