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

// ── Route guards ──────────────────────────────────────────────────────────────

/** Redirect authenticated users away from login/register */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/** Auth required. Does NOT require onboarding complete. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Auth + onboarding complete required.
 *  Waits for profileLoaded before making redirect decisions — prevents
 *  false /onboarding redirects while Firestore is still fetching the doc. */
function OnboardedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()

  // Firebase auth not resolved yet
  if (loading) return <PageLoader />

  // Not signed in
  if (!user) return <Navigate to="/login" replace />

  // Auth resolved but profile fetch still in flight — wait
  if (!profileLoaded) return <PageLoader />

  // Profile fetched — null means no doc yet (new user), so go to onboarding
  if (!profile || !profile.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Auth only — onboarding */}
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

      {/* Auth + onboarding complete */}
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
