"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getStudentStats, getQuizHistory, getStudentClasses } from '@/lib/db'

function StudentDashboardContent() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentQuizzes, setRecentQuizzes] = useState([])
  const [classCount, setClassCount] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [s, history, classes] = await Promise.all([
        getStudentStats(user.id),
        getQuizHistory(user.id),
        getStudentClasses(user.id),
      ])
      setStats(s)
      setRecentQuizzes(history.slice(0, 5))
      setClassCount(classes.length)
      setLoadingStats(false)
    }
    load()
  }, [user])

  const name = profile?.name || user?.email?.split('@')[0] || 'Student'

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{name}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Ready to learn something new today?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{loadingStats ? '—' : stats?.totalQuizzes || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Quizzes Taken</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{loadingStats ? '—' : `${stats?.avgScore || 0}%`}</p>
            <p className="text-slate-400 text-sm mt-1">Average Score</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{loadingStats ? '—' : stats?.topicsCompleted || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Topics Covered</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-amber-400">{loadingStats ? '—' : classCount}</p>
            <p className="text-slate-400 text-sm mt-1">Classes Joined</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 stagger">
          <Link href="/student/practice" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🧠
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Practice Quiz</h3>
                <p className="text-slate-400 text-sm">AI-generated 20 MCQs with timer & analysis</p>
              </div>
            </div>
          </Link>
          <Link href="/student/classes" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏫
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">My Classes</h3>
                <p className="text-slate-400 text-sm">Join a class or take classroom quizzes</p>
              </div>
            </div>
          </Link>
          <Link href="/student/quiz-history" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📋
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quiz History</h3>
                <p className="text-slate-400 text-sm">Review past quizzes with explanations</p>
              </div>
            </div>
          </Link>
          <Link href="/student/roadmaps" className="card-hover group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🗺️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Learning Roadmaps</h3>
                <p className="text-slate-400 text-sm">Personalized improvement plans & resources</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card fade-in">
          <h2 className="text-lg font-bold text-white mb-4">📊 Recent Activity</h2>
          {recentQuizzes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-3">No quizzes yet. Take your first quiz!</p>
              <Link href="/student/practice" className="btn-primary text-sm px-6 py-2">
                🚀 Start Practice Quiz
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuizzes.map((q, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span>{q.percentage >= 70 ? '🏆' : q.percentage >= 40 ? '📚' : '💪'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{q.topic || q.field || 'Quiz'}</p>
                      <p className="text-xs text-slate-500">
                        {q.difficulty} • {new Date(q.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${
                    q.percentage >= 70 ? 'text-emerald-400' : q.percentage >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {q.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute role="student">
      <StudentDashboardContent />
    </ProtectedRoute>
  )
}
