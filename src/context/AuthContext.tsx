import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange } from '../firebase/auth'
import type { UserProfile } from '../types/user'
import { getUserProfile } from '../firebase/firestore'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  /** True until Firebase has resolved the initial auth state */
  loading: boolean
  /** True once we've attempted to load the Firestore profile (may still be null if no doc) */
  profileLoaded: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  profileLoaded: false,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null)
  const [profile, setProfile]         = useState<UserProfile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)

  async function fetchProfile(uid: string): Promise<void> {
    setProfileLoaded(false)
    try {
      const p = await getUserProfile(uid)
      setProfile(p)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoaded(true)
    }
  }

  async function refreshProfile(): Promise<void> {
    if (user) await fetchProfile(user.uid)
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid)
      } else {
        setProfile(null)
        setProfileLoaded(true)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoaded, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
