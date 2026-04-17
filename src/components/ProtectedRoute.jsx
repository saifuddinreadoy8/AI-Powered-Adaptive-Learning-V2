"use client"
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * ProtectedRoute — wraps pages that require authentication + optional role check.
 * 
 * Usage:
 *   <ProtectedRoute>                     — any logged-in user
 *   <ProtectedRoute role="student">      — students only
 *   <ProtectedRoute role="teacher">      — teachers only
 *   <ProtectedRoute role="admin">        — admins only
 */
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not logged in → login page
    if (!user) {
      router.push('/login')
      return
    }

    // If role is specified and doesn't match → redirect to correct dashboard
    if (role && profile && profile.role !== role) {
      const dashboardMap = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        admin: '/admin/dashboard',
      }
      router.push(dashboardMap[profile.role] || '/login')
    }
  }, [user, profile, loading, role, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) return null

  // Profile corrupted/missing (Trigger crash)
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Corrupted Profile Detected</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The database failed to complete your account registration. To fix this, you must log out completely to clear the corrupted session, and then log in again.
        </p>
        <button 
          onClick={async () => {
            try { await supabase.auth.signOut() } catch (e) {}
            // Forcefully destruct the corrupted token from cache
            localStorage.clear()
            sessionStorage.clear()
            document.cookie.split(';').forEach(c => {
              document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
            })
            window.location.href = '/'
          }} 
          className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Destruct Ghost Session & Reset
        </button>
      </div>
    )
  }

  // Wrong role (failsafe)
  if (role && profile?.role !== role) return null

  return children
}
