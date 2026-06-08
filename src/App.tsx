import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import './index.css'
import { AuthGate } from './components/auth/AuthGate'
import { AuthPromptProvider } from './context/AuthPromptProvider'
import AppShell from './AppShell'
import { useTheme } from './hooks/useTheme'

const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))

function AuthRouteFallback() {
  return (
    <section className="profile-page__state-screen" aria-busy="true">
      <p>Loading…</p>
    </section>
  )
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isStandaloneAuthRoute =
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'

  if (isStandaloneAuthRoute) {
    return (
      <AuthGate theme={theme} onToggleTheme={toggleTheme}>
        <Toaster theme={theme} richColors closeButton position="top-center" />
        <Suspense fallback={<AuthRouteFallback />}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </Suspense>
      </AuthGate>
    )
  }

  return (
    <AuthGate theme={theme} onToggleTheme={toggleTheme}>
      <AuthPromptProvider>
        <Toaster theme={theme} richColors closeButton position="top-center" />
        <AppShell theme={theme} onToggleTheme={toggleTheme} />
      </AuthPromptProvider>
    </AuthGate>
  )
}
