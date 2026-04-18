"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getTeacherStats } from '@/services/adminService'
import { getTeacherClasses } from '@/services/classService'

function TeacherDashboardContent() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [s, c] = await Promise.all([
          getTeacherStats(user.id),
          getTeacherClasses(user.id),
        ])
        setStats(s)
        setClasses(c)
      } catch (err) {
        console.error('Teacher dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const name = profile?.name || 'Teacher'

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-white">
            Welcome, <span className="gradient-text">{name}</span> 👩‍🏫
          </h1>
          <p className="text-slate-400 mt-1">Manage your classes and quizzes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{loading ? '—' : stats?.totalClasses || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Classes</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{loading ? '—' : stats?.totalStudents || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Students</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{loading ? '—' : stats?.totalQuizzes || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Quizzes Created</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 stagger">
          <Link href="/teacher/classes" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ➕
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create New Class</h3>
                <p className="text-slate-400 text-sm">Set up a class with a join code & password</p>
              </div>
            </div>
          </Link>
          <Link href="/teacher/classes" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏫
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Manage Classes</h3>
                <p className="text-slate-400 text-sm">View classes, create quizzes, track scores</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Classes */}
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🏫 My Classes</h2>
            <Link href="/teacher/classes" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-3">No classes yet. Create your first class!</p>
              <Link href="/teacher/classes" className="btn-primary text-sm px-6 py-2">
                ➕ Create Class
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {classes.slice(0, 5).map((cls) => (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{cls.class_name}</p>
                    <p className="text-xs text-slate-500">Code: {cls.class_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-400">
                      {cls.enrollments?.[0]?.count || 0} students
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  return (
    <ProtectedRoute role="teacher">
      <TeacherDashboardContent />
    </ProtectedRoute>
  )
}
