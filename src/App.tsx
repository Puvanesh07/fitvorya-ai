import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/AppLayout'

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
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import Nutrition from './pages/Nutrition'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg"><LoadingSpinner size="lg" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OnboardedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg"><LoadingSpinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Auth only — onboarding */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Auth + onboarding complete — wrapped in AppLayout */}
      <Route path="/dashboard"                   element={<OnboardedRoute><AppLayout><Dashboard /></AppLayout></OnboardedRoute>} />
      <Route path="/weight"                      element={<OnboardedRoute><AppLayout><Weight /></AppLayout></OnboardedRoute>} />
      <Route path="/nutrition"                   element={<OnboardedRoute><AppLayout><Nutrition /></AppLayout></OnboardedRoute>} />
      <Route path="/workout"                     element={<OnboardedRoute><AppLayout><Workout /></AppLayout></OnboardedRoute>} />
      <Route path="/workout/session/:templateId" element={<OnboardedRoute><AppLayout><WorkoutSession /></AppLayout></OnboardedRoute>} />
      <Route path="/workout/detail/:id"          element={<OnboardedRoute><AppLayout><Workout /></AppLayout></OnboardedRoute>} />
      <Route path="/progress"                    element={<OnboardedRoute><AppLayout><Progress /></AppLayout></OnboardedRoute>} />
      <Route path="/profile"                     element={<OnboardedRoute><AppLayout><Profile /></AppLayout></OnboardedRoute>} />

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
