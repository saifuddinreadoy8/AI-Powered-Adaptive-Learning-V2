"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { createClass } from '@/services/classService'

function CreateClassContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [className, setClassName] = useState('')
  const [description, setDescription] = useState('')
  const [classPassword, setClassPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!className.trim() || !classPassword.trim()) {
      setError('Class name and password are required.')
      return
    }
    setLoading(true)
    setError('')

    const cls = await createClass(user.id, className.trim(), description.trim(), classPassword)
    if (cls) {
      router.push(`/teacher/classes/${cls.id}`)
    } else {
      setError('Failed to create class. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <button onClick={() => router.push('/teacher/classes')} className="text-slate-400 hover:text-white text-sm mb-3 inline-block">
            ← Back to Classes
          </button>
          <h1 className="text-3xl font-bold text-white">➕ Create New Class</h1>
          <p className="text-slate-400 mt-1">Students will use the generated code + your password to join</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleCreate} className="card space-y-4 fade-in">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Class Name *</label>
            <input className="input" type="text" placeholder="e.g. CS101 — Data Structures" value={className} onChange={e => setClassName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description</label>
            <textarea className="input min-h-[80px]" placeholder="Brief description of this class..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Join Password *</label>
            <input className="input" type="text" placeholder="Password students will use to join" value={classPassword} onChange={e => setClassPassword(e.target.value)} required />
            <p className="text-xs text-slate-600 mt-1">Share this with your students along with the class code</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating...
              </span>
            ) : '🚀 Create Class'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CreateClassPage() {
  return (
    <ProtectedRoute role="teacher">
      <CreateClassContent />
    </ProtectedRoute>
  )
}
