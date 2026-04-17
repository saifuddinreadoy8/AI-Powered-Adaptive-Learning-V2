"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getAdminStats } from '@/services/adminService'

function AdminDashboardContent() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const s = await getAdminStats()
        setStats(s)
      } catch (err) {
        console.error('Admin dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-white">
            Admin <span className="gradient-text">Control Panel</span> ⚙️
          </h1>
          <p className="text-slate-400 mt-1">Manage topics, subtopics, and user accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-amber-400">{loading ? '—' : stats?.totalUsers || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Total Users</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{loading ? '—' : stats?.totalTopics || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Topics</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{loading ? '—' : stats?.totalClasses || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Classes</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{loading ? '—' : stats?.totalQuizAttempts || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Quiz Attempts</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
          <Link href="/admin/topics" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📚
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Manage Topics & Subtopics</h3>
                <p className="text-slate-400 text-sm">Add, edit, or delete topics and their subtopics</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/users" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Manage Users</h3>
                <p className="text-slate-400 text-sm">View all users, change passwords, delete accounts</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute role="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
