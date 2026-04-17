"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getStudentClasses, joinClass } from '@/services/enrollmentService'

function ClassesContent() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [classPassword, setClassPassword] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState('')

  useEffect(() => {
    if (!user) return
    loadClasses()
  }, [user])

  async function loadClasses() {
    const data = await getStudentClasses(user.id)
    setClasses(data)
    setLoading(false)
  }

  async function handleJoin(e) {
    e.preventDefault()
    setJoinLoading(true)
    setJoinError('')
    setJoinSuccess('')

    const result = await joinClass(user.id, classCode.trim(), classPassword)

    if (result.success) {
      setJoinSuccess('✅ Successfully joined the class!')
      setClassCode('')
      setClassPassword('')
      setShowJoin(false)
      await loadClasses()
    } else {
      setJoinError(result.error)
    }
    setJoinLoading(false)
  }

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">🏫 My Classes</h1>
            <p className="text-slate-400 mt-1">{classes.length} classes enrolled</p>
          </div>
          <button onClick={() => setShowJoin(!showJoin)} className="btn-primary text-sm px-5 py-2.5">
            {showJoin ? '✕ Cancel' : '➕ Join Class'}
          </button>
        </div>

        {joinSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 mb-4 text-sm fade-in">
            {joinSuccess}
          </div>
        )}

        {/* Join Class Form */}
        {showJoin && (
          <div className="card mb-6 fade-in">
            <h2 className="text-lg font-bold text-white mb-4">Join a Class</h2>
            {joinError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{joinError}</div>
            )}
            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Class Code</label>
                <input className="input" type="text" placeholder="e.g. X7KR3P"
                  value={classCode} onChange={e => setClassCode(e.target.value.toUpperCase())}
                  maxLength={6} required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Class Password</label>
                <input className="input" type="password" placeholder="Enter class password"
                  value={classPassword} onChange={e => setClassPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={joinLoading} className="btn-primary w-full py-3">
                {joinLoading ? 'Joining...' : '🔗 Join Class'}
              </button>
            </form>
          </div>
        )}

        {/* Classes List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏫</p>
            <p className="text-xl text-slate-400 mb-2">No classes yet</p>
            <p className="text-slate-500 text-sm mb-4">Join a class using the class code and password from your teacher</p>
            <button onClick={() => setShowJoin(true)} className="btn-primary text-sm px-6 py-2.5">
              ➕ Join Your First Class
            </button>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {classes.map((enrollment) => {
              const cls = enrollment.classes
              if (!cls) return null
              return (
                <Link key={enrollment.id} href={`/student/classes/${cls.id}`}
                  className="card-hover block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl">
                        🏫
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{cls.class_name}</h3>
                        <p className="text-slate-400 text-sm">
                          Teacher: {cls.profiles?.name || 'Unknown'} • Code: {cls.class_code}
                        </p>
                        {cls.description && (
                          <p className="text-slate-500 text-xs mt-0.5">{cls.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-500 text-sm">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentClasses() {
  return (
    <ProtectedRoute role="student">
      <ClassesContent />
    </ProtectedRoute>
  )
}
