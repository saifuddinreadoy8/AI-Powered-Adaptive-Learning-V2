"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import RoleGate from '@/components/RoleGate'
import Navbar from '@/components/Navbar'
import ClassCard from '@/components/classroom/ClassCard'
import EmptyState from '@/components/EmptyState'
import { getTeacherClasses, createClass } from '@/services/classService'
import { ROLES } from '@/constants/roles'

function TeacherClassesContent() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [className, setClassName] = useState('')
  const [classDesc, setClassDesc] = useState('')
  const [classPassword, setClassPassword] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  useEffect(() => {
    if (user) loadClasses()
  }, [user])

  async function loadClasses() {
    const data = await getTeacherClasses(user.id)
    setClasses(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!className.trim() || !classPassword.trim()) {
      setCreateError('Class name and password are required.')
      return
    }
    setCreateLoading(true)
    setCreateError('')
    
    const result = await createClass(user.id, className.trim(), classDesc.trim(), classPassword)
    if (result) {
      setCreateSuccess(`✅ Class created! Code: ${result.class_code}`)
      setClassName(''); setClassDesc(''); setClassPassword('')
      setShowCreate(false)
      await loadClasses()
    } else {
      setCreateError('Failed to create class. Try again.')
    }
    setCreateLoading(false)
  }

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">🏫 My Classes</h1>
            <p className="text-slate-400 mt-1">{classes.length} classes created</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm px-5 py-2.5">
            {showCreate ? '✕ Cancel' : '➕ Create Class'}
          </button>
        </div>

        {createSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 mb-4 text-sm fade-in">{createSuccess}</div>
        )}

        {showCreate && (
          <div className="card mb-6 fade-in">
            <h2 className="text-lg font-bold text-white mb-4">Create New Class</h2>
            {createError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{createError}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Class Name *</label>
                <input className="input" type="text" placeholder="e.g. CS101 - Intro to Programming" value={className} onChange={e => setClassName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description (optional)</label>
                <textarea className="input min-h-[100px]" placeholder="Brief description of the class" value={classDesc} onChange={e => setClassDesc(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Class Password *</label>
                <input className="input" type="text" placeholder="Students will need this to join" value={classPassword} onChange={e => setClassPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={createLoading} className="btn-success w-full py-3 font-bold">
                {createLoading ? 'Creating...' : '🚀 Create Class'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div></div>
        ) : classes.length === 0 ? (
          <EmptyState icon="🏫" title="No classes yet" description="Create your first class to start conducting quizzes." action={{ label: '➕ Create First Class', onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {classes.map(cls => <ClassCard key={cls.id} cls={cls} role="teacher" />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeacherClasses() {
  return (
    <RoleGate role={ROLES.TEACHER}>
      <TeacherClassesContent />
    </RoleGate>
  )
}
