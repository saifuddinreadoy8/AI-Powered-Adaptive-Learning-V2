"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from profiles table, gracefully fallback to auto-creating if missing
  async function fetchProfile(user) {
    if (!user) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    if (error) {
      console.error('fetchProfile error (attempting recovery):', error.message)
      // Attempt to auto-create profile if trigger failed
      const meta = user.user_metadata || {}
      const { data: newProfile, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: meta.full_name || meta.name || '',
          email: user.email || '',
          role: 'student',
          avatar_url: meta.avatar_url || null,
        }, { onConflict: 'id' })
        .select()
        .single()
        
      if (upsertErr) {
         console.error('fetchProfile recovery failed:', upsertErr.message)
         return null
      }
      return newProfile
    }
    return data
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u).then(p => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          const p = await fetchProfile(u)
          setProfile(p)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign out helper
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // Refresh profile (call after profile updates)
  async function refreshProfile() {
    if (user) {
      const p = await fetchProfile(user)
      setProfile(p)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      isStudent: profile?.role === 'student',
      isTeacher: profile?.role === 'teacher',
      isAdmin: profile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)