import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/AppLayout'
import PageLoader from './components/PageLoader'

import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Onboarding     from './pages/Onboarding'
import Dashboard      from './pages/Dashboard'
import Weight         from './pages/Weight'
import Profile        from './pages/Profile'
import Workout        from './pages/Workout'
import WorkoutSession from './pages/WorkoutSession'
import Progress       from './pages/Progress'
import Nutrition      from './pages/Nutrition'
import Pregnancy      from './pages/Pregnancy'
import Baby           from './pages/Baby'
import Family         from './pages/Family'

// ─────────────────────────────────────────────────────────────────────────────
// Route guard helpers
//
// IMPORTANT: every guard must wait for BOTH `loading` (Firebase auth) AND
// `profileLoaded` (Firestore profile fetch) before making any redirect
// decision. Redirecting before either resolves causes the Landing →
// Onboarding → Dashboard flash that users reported.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root "/" — smart landing:
 *  - Auth not resolved yet          → show global loader
 *  - Not signed in                  → Landing page
 *  - Signed in, onboarding done     → /dashboard
 *  - Signed in, onboarding pending  → /onboarding
 */
function RootRoute() {
  const { user, profile, loading, profileLoaded } = useAuth()

  if (loading || (user && !profileLoaded)) return <PageLoader />

  if (!user) return <Landing />

  // User is authenticated — decide where to send them
  if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />
  return <Navigate to="/onboarding" replace />
}

/**
 * Public-only (login / register) — redirect away once authenticated.
 * Waits for both auth AND profile before deciding, so we never
 * flicker to /dashboard only to bounce back to /onboarding.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()

  if (loading || (user && !profileLoaded)) return <PageLoader />

  if (user) {
    // Already signed in — send to the correct destination
    if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

/**
 * Onboarding route — auth required, but explicitly NOT onboarded yet.
 * If the user has already completed onboarding, bounce them to /dashboard
 * so they never see the onboarding form again.
 */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()

  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" replace />

  // Wait for the profile fetch — avoids briefly showing onboarding to
  // returning users while Firestore is still loading their document.
  if (!profileLoaded) return <PageLoader />

  // Already done → go to dashboard
  if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

/**
 * Protected + onboarded route.
 * Full guard: auth resolved + profile loaded + onboarding complete.
 */
function OnboardedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()

  // Firebase auth still resolving
  if (loading) return <PageLoader />

  // Not signed in
  if (!user) return <Navigate to="/login" replace />

  // Auth resolved but profile fetch still in flight — wait, don't redirect
  if (!profileLoaded) return <PageLoader />

  // Profile fetched — null or incomplete means not onboarded yet
  if (!profile || !profile.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Root — smart redirect based on auth + onboarding state */}
      <Route path="/" element={<RootRoute />} />

      {/* Public — unauthenticated only */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Onboarding — authenticated but not yet onboarded */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Protected + onboarded */}
      <Route path="/dashboard" element={
        <OnboardedRoute><AppLayout><Dashboard /></AppLayout></OnboardedRoute>
      } />
      <Route path="/weight" element={
        <OnboardedRoute><AppLayout><Weight /></AppLayout></OnboardedRoute>
      } />
      <Route path="/nutrition" element={
        <OnboardedRoute><AppLayout><Nutrition /></AppLayout></OnboardedRoute>
      } />
      <Route path="/pregnancy" element={
        <OnboardedRoute><AppLayout><Pregnancy /></AppLayout></OnboardedRoute>
      } />
      <Route path="/baby" element={
        <OnboardedRoute><AppLayout><Baby /></AppLayout></OnboardedRoute>
      } />
      <Route path="/family" element={
        <OnboardedRoute><AppLayout><Family /></AppLayout></OnboardedRoute>
      } />
      <Route path="/workout" element={
        <OnboardedRoute><AppLayout><Workout /></AppLayout></OnboardedRoute>
      } />
      <Route path="/workout/session/:templateId" element={
        <OnboardedRoute><AppLayout><WorkoutSession /></AppLayout></OnboardedRoute>
      } />
      <Route path="/workout/detail/:id" element={
        <OnboardedRoute><AppLayout><Workout /></AppLayout></OnboardedRoute>
      } />
      <Route path="/progress" element={
        <OnboardedRoute><AppLayout><Progress /></AppLayout></OnboardedRoute>
      } />
      <Route path="/profile" element={
        <OnboardedRoute><AppLayout><Profile /></AppLayout></OnboardedRoute>
      } />

      {/* Catch-all → root (which will decide where to go) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
