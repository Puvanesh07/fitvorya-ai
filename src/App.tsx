import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/AppLayout'
import PageLoader from './components/PageLoader'

// ── Lazy page imports ─────────────────────────────────────────────────────────
// Each page is code-split into its own chunk. The browser only downloads a
// page's JS when the user navigates to it — initial bundle is Dashboard-only.
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const Onboarding     = lazy(() => import('./pages/Onboarding'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Weight         = lazy(() => import('./pages/Weight'))
const Profile        = lazy(() => import('./pages/Profile'))
const Workout        = lazy(() => import('./pages/Workout'))
const WorkoutSession = lazy(() => import('./pages/WorkoutSession'))
const Progress       = lazy(() => import('./pages/Progress'))
const Nutrition      = lazy(() => import('./pages/Nutrition'))
const Pregnancy      = lazy(() => import('./pages/Pregnancy'))
const Baby           = lazy(() => import('./pages/Baby'))
const Family         = lazy(() => import('./pages/Family'))

// ── Per-route fallback loaders ────────────────────────────────────────────────
// Each route gets a themed loader so the user sees something meaningful while
// its chunk is downloading for the first time.
const ROUTE_LOADERS: Record<string, React.ReactNode> = {
  '/':           <PageLoader />,
  '/dashboard':  <PageLoader variant="dashboard"  />,
  '/workout':    <PageLoader variant="workout"     />,
  '/nutrition':  <PageLoader variant="nutrition"   />,
  '/weight':     <PageLoader variant="weight"      />,
  '/progress':   <PageLoader variant="progress"    />,
  '/baby':       <PageLoader variant="baby"        />,
  '/pregnancy':  <PageLoader variant="pregnancy"   />,
  '/family':     <PageLoader variant="family"      />,
  '/profile':    <PageLoader variant="profile"     />,
}

/** Wraps a lazy component with the appropriate themed Suspense fallback. */
function LazyRoute({
  path,
  children,
}: {
  path: string
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={ROUTE_LOADERS[path] ?? <PageLoader />}>
      {children}
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Route guards — all wait for BOTH `loading` (Firebase auth) AND
// `profileLoaded` (Firestore fetch) before any redirect decision.
// ─────────────────────────────────────────────────────────────────────────────

function RootRoute() {
  const { user, profile, loading, profileLoaded } = useAuth()
  if (loading || (user && !profileLoaded)) return <PageLoader />
  if (!user) return (
    <LazyRoute path="/">
      <Landing />
    </LazyRoute>
  )
  if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />
  return <Navigate to="/onboarding" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()
  if (loading || (user && !profileLoaded)) return <PageLoader />
  if (user) {
    return profile?.onboardingComplete
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoaded } = useAuth()
  if (loading)      return <PageLoader />
  if (!user)        return <Navigate to="/login" replace />
  if (!profileLoaded) return <PageLoader />
  if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OnboardedRoute({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, profile, loading, profileLoaded } = useAuth()
  if (loading)        return <PageLoader />
  if (!user)          return <Navigate to="/login" replace />
  if (!profileLoaded) return <PageLoader />
  if (!profile || !profile.onboardingComplete) return <Navigate to="/onboarding" replace />
  // Wrap in a themed Suspense so the lazy chunk has a nice loader
  return (
    <LazyRoute path={path}>
      {children}
    </LazyRoute>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Root — smart redirect */}
      <Route path="/" element={<RootRoute />} />

      {/* Public only */}
      <Route path="/login" element={
        <PublicRoute>
          <LazyRoute path="/login"><Login /></LazyRoute>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <LazyRoute path="/register"><Register /></LazyRoute>
        </PublicRoute>
      } />

      {/* Onboarding — auth required, not yet onboarded */}
      <Route path="/onboarding" element={
        <OnboardingRoute>
          <LazyRoute path="/onboarding"><Onboarding /></LazyRoute>
        </OnboardingRoute>
      } />

      {/* Protected + onboarded — each gets its own chunk + themed loader */}
      <Route path="/dashboard" element={
        <OnboardedRoute path="/dashboard">
          <AppLayout><Dashboard /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/weight" element={
        <OnboardedRoute path="/weight">
          <AppLayout><Weight /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/nutrition" element={
        <OnboardedRoute path="/nutrition">
          <AppLayout><Nutrition /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/pregnancy" element={
        <OnboardedRoute path="/pregnancy">
          <AppLayout><Pregnancy /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/baby" element={
        <OnboardedRoute path="/baby">
          <AppLayout><Baby /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/family" element={
        <OnboardedRoute path="/family">
          <AppLayout><Family /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/workout" element={
        <OnboardedRoute path="/workout">
          <AppLayout><Workout /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/workout/session/:templateId" element={
        <OnboardedRoute path="/workout">
          <AppLayout><WorkoutSession /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/workout/detail/:id" element={
        <OnboardedRoute path="/workout">
          <AppLayout><Workout /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/progress" element={
        <OnboardedRoute path="/progress">
          <AppLayout><Progress /></AppLayout>
        </OnboardedRoute>
      } />
      <Route path="/profile" element={
        <OnboardedRoute path="/profile">
          <AppLayout><Profile /></AppLayout>
        </OnboardedRoute>
      } />

      {/* Catch-all */}
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
