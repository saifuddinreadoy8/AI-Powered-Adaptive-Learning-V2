"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { joinClass } from '@/services/enrollmentService'

function JoinClassContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [classCode, setClassCode] = useState('')
  const [classPassword, setClassPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    if (!classCode.trim() || !classPassword.trim()) {
      setError('Please enter both class code and password.')
      return
    }
    setLoading(true)
    setError('')

    const result = await joinClass(user.id, classCode, classPassword)
    if (result.success) {
      router.push(`/student/classes/${result.classId}`)
    } else {
      setError(result.error || 'Failed to join class.')
    }
    setLoading(false)
  }

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <button onClick={() => router.push('/student/classes')} className="text-slate-400 hover:text-white text-sm mb-3 inline-block">
            ← Back to Classes
          </button>
          <h1 className="text-3xl font-bold text-white">🏫 Join a Class</h1>
          <p className="text-slate-400 mt-1">Enter the class code and password from your teacher</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleJoin} className="card space-y-4 fade-in">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Class Code</label>
            <input
              className="input uppercase tracking-widest text-center text-lg font-mono"
              type="text"
              placeholder="ABC123"
              maxLength={6}
              value={classCode}
              onChange={e => setClassCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Class Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter class password"
              value={classPassword}
              onChange={e => setClassPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Joining...
              </span>
            ) : '🔑 Join Class'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JoinClassPage() {
  return (
    <ProtectedRoute role="student">
      <JoinClassContent />
    </ProtectedRoute>
  )
}
