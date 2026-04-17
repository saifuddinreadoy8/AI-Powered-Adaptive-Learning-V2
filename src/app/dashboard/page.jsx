"use client"
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }

    // Safely check for intended role cookie
    const cookies = document.cookie.split('; ')
    const intendedCookie = cookies.find(c => c.startsWith('intended_role='))
    const intendedRole = intendedCookie ? intendedCookie.split('=')[1] : null

    if (intendedRole && profile && intendedRole !== profile.role) {
      // Execute the role upgrade natively on the client using the active session
      supabase.from('profiles').update({ role: intendedRole }).eq('id', user.id).then(() => {
        document.cookie = 'intended_role=; path=/; max-age=0' // clear cookie
        window.location.href = intendedRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      })
      return
    }

    // Clear it anyway just in case it matched
    if (intendedCookie) {
      document.cookie = 'intended_role=; path=/; max-age=0'
    }

    const routes = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    }
    router.push(routes[profile?.role] || '/student/dashboard')
  }, [user, profile, loading, router])

  return (
    <div className="page-container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
