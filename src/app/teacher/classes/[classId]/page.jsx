"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getClassById } from '@/services/classService'
import { getClassStudents } from '@/services/enrollmentService'
import { getClassQuizzes, publishQuiz, unpublishQuiz, deleteQuiz } from '@/services/quizService'

function TeacherClassDetailContent() {
  const { classId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [cls, setCls] = useState(null)
  const [students, setStudents] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('quizzes')

  useEffect(() => {
    if (!classId || !user) return
    loadAll()
  }, [classId, user])

  async function loadAll() {
    const [classData, studentData, quizData] = await Promise.all([
      getClassById(classId),
      getClassStudents(classId),
      getClassQuizzes(classId),
    ])
    setCls(classData)
    setStudents(studentData)
    setQuizzes(quizData)
    setLoading(false)
  }

  async function handleTogglePublish(quiz) {
    if (quiz.is_published) {
      await unpublishQuiz(quiz.id)
    } else {
      await publishQuiz(quiz.id)
    }
    await loadAll()
  }

  async function handleDeleteQuiz(quizId) {
    if (!confirm('Delete this quiz? This cannot be undone.')) return
    await deleteQuiz(quizId)
    await loadAll()
  }

  if (loading) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )

  if (!cls) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="text-center py-20">
        <p className="text-5xl mb-4">❌</p>
        <p className="text-xl text-slate-400">Class not found</p>
      </div>
    </div>
  )

  return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card mb-6 fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 flex items-center justify-center text-2xl">🏫</div>
              <div>
                <h1 className="text-2xl font-bold text-white">{cls.class_name}</h1>
                <p className="text-slate-400 text-sm">
                  Code: <b className="text-indigo-400">{cls.class_code}</b> • Password: <b className="text-slate-300">{cls.class_password}</b>
                </p>
                {cls.description && <p className="text-slate-500 text-xs mt-0.5">{cls.description}</p>}
              </div>
            </div>
            <Link href={`/teacher/classes/${classId}/create-quiz`} className="btn-primary text-sm px-5 py-2.5">
              🤖 Create Quiz
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{students.length}</p>
            <p className="text-slate-400 text-sm mt-1">Students</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{quizzes.length}</p>
            <p className="text-slate-400 text-sm mt-1">Quizzes</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{quizzes.filter(q => q.is_published).length}</p>
            <p className="text-slate-400 text-sm mt-1">Published</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['quizzes', 'students'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white border border-transparent'
              }`}>
              {t === 'quizzes' ? '📝 Quizzes' : '👥 Students'}
            </button>
          ))}
        </div>

        {/* Quizzes Tab */}
        {tab === 'quizzes' && (
          <div>
            {quizzes.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-slate-400 mb-3">No quizzes yet</p>
                <Link href={`/teacher/classes/${classId}/create-quiz`} className="btn-primary text-sm px-6 py-2.5">
                  🤖 Create First Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{quiz.title}</h3>
                          <span className={`badge ${quiz.is_published ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/20 text-slate-400'}`}>
                            {quiz.is_published ? '🟢 Published' : '⚪ Draft'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {quiz.topic} • {quiz.difficulty} • {quiz.timer_minutes} min
                          {quiz.quiz_attempts?.[0]?.count > 0 && ` • ${quiz.quiz_attempts[0].count} attempts`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTogglePublish(quiz)}
                          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
                            quiz.is_published
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          }`}>
                          {quiz.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link href={`/teacher/classes/${classId}/quiz/${quiz.id}`}
                          className="text-sm px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-medium transition-all">
                          View Results
                        </Link>
                        <button onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <div>
            {students.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-slate-400">No students enrolled yet</p>
                <p className="text-slate-500 text-sm mt-1">Share the class code <b className="text-indigo-400">{cls.class_code}</b> with your students</p>
              </div>
            ) : (
              <div className="card">
                <div className="space-y-2">
                  {students.map((enrollment, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {enrollment.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{enrollment.profiles?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{enrollment.profiles?.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Joined {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => router.push('/teacher/classes')} className="btn-secondary w-full py-3 mt-6">
          ← Back to Classes
        </button>
      </div>
    </div>
  )
}

export default function TeacherClassDetail() {
  return (
    <ProtectedRoute role="teacher">
      <TeacherClassDetailContent />
    </ProtectedRoute>
  )
}
