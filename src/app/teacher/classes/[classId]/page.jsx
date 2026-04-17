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
import { getClassAttempts } from '@/services/attemptService'

function TeacherClassDetailContent() {
  const { classId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [cls, setCls] = useState(null)
  const [students, setStudents] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [classAttempts, setClassAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('quizzes')

  useEffect(() => {
    if (!classId || !user) return
    loadAll()
  }, [classId, user])

  async function loadAll() {
    const [classData, studentData, quizData, attemptData] = await Promise.all([
      getClassById(classId),
      getClassStudents(classId),
      getClassQuizzes(classId),
      getClassAttempts(classId),
    ])
    setCls(classData)
    setStudents(studentData)
    setQuizzes(quizData)
    setClassAttempts(attemptData)
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
          {['quizzes', 'students', 'performance'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white border border-transparent'
              }`}>
              {t === 'quizzes' ? '📝 Quizzes' : t === 'students' ? '👥 Students' : '📊 Performance'}
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
                          View / Edit
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

        {/* Performance Tab */}
        {tab === 'performance' && (
          <div className="space-y-6">
            {classAttempts.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-400">No quiz attempts in this class yet</p>
                <p className="text-slate-500 text-sm mt-1">Student performance data will appear here after quizzes are taken</p>
              </div>
            ) : (() => {
              // Aggregate per student
              const studentMap = {}
              classAttempts.forEach(att => {
                const sid = att.student_id
                if (!studentMap[sid]) {
                  studentMap[sid] = {
                    id: sid,
                    name: att.profiles?.name || 'Unknown',
                    email: att.profiles?.email || '',
                    attempts: [],
                    totalScore: 0,
                    totalQuestions: 0,
                    strongMap: {},
                    weakMap: {},
                  }
                }
                const s = studentMap[sid]
                s.attempts.push(att)
                s.totalScore += Number(att.score) || 0
                s.totalQuestions += Number(att.total) || 0
                ;(att.strong_areas || []).forEach(a => {
                  const name = typeof a === 'string' ? a : a.name
                  if (!name) return
                  s.strongMap[name] = (s.strongMap[name] || 0) + 1
                })
                ;(att.weak_areas || []).forEach(a => {
                  const name = typeof a === 'string' ? a : a.name
                  if (!name) return
                  s.weakMap[name] = (s.weakMap[name] || 0) + 1
                })
              })

              const studentList = Object.values(studentMap).sort((a, b) => {
                const avgA = a.totalQuestions ? (a.totalScore / a.totalQuestions) * 100 : 0
                const avgB = b.totalQuestions ? (b.totalScore / b.totalQuestions) * 100 : 0
                return avgB - avgA
              })

              // Class-wide aggregation
              const classStrongMap = {}
              const classWeakMap = {}
              classAttempts.forEach(att => {
                ;(att.strong_areas || []).forEach(a => {
                  const name = typeof a === 'string' ? a : a.name
                  if (!name) return
                  classStrongMap[name] = (classStrongMap[name] || 0) + 1
                })
                ;(att.weak_areas || []).forEach(a => {
                  const name = typeof a === 'string' ? a : a.name
                  if (!name) return
                  classWeakMap[name] = (classWeakMap[name] || 0) + 1
                })
              })
              const topClassStrong = Object.entries(classStrongMap).sort((a,b) => b[1]-a[1]).slice(0,5)
              const topClassWeak = Object.entries(classWeakMap).sort((a,b) => b[1]-a[1]).slice(0,5)
              const totalAttempts = classAttempts.length

              return (
                <>
                  {/* Class-wide strength/weakness overview */}
                  <div className="card fade-in">
                    <h2 className="text-lg font-bold text-white mb-4">📈 Class-Wide Performance Trends</h2>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="stat-card">
                        <p className="text-3xl font-bold text-indigo-400">{totalAttempts}</p>
                        <p className="text-xs text-slate-400 mt-1">Total Attempts</p>
                      </div>
                      <div className="stat-card">
                        <p className="text-3xl font-bold text-purple-400">{studentList.length}</p>
                        <p className="text-xs text-slate-400 mt-1">Active Students</p>
                      </div>
                      <div className="stat-card">
                        <p className="text-3xl font-bold text-emerald-400">
                          {classAttempts.length > 0 ? Math.round(classAttempts.reduce((s,a) => s + Number(a.percentage), 0) / classAttempts.length) : 0}%
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Class Average</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                        <h3 className="font-bold text-emerald-400 text-sm mb-3">💪 Top Strong Areas (Class-Wide)</h3>
                        {topClassStrong.length > 0 ? topClassStrong.map(([name, count], i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-emerald-900/30 last:border-0">
                            <span className="text-sm text-emerald-200">{name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(count/totalAttempts)*100}%` }} />
                              </div>
                              <span className="text-xs text-emerald-400 font-bold">{count}x</span>
                            </div>
                          </div>
                        )) : <p className="text-xs text-slate-500">No data yet</p>}
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                        <h3 className="font-bold text-red-300 text-sm mb-3">📉 Top Weak Areas (Class-Wide)</h3>
                        {topClassWeak.length > 0 ? topClassWeak.map(([name, count], i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-red-900/30 last:border-0">
                            <span className="text-sm text-red-200">{name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(count/totalAttempts)*100}%` }} />
                              </div>
                              <span className="text-xs text-red-400 font-bold">{count}x</span>
                            </div>
                          </div>
                        )) : <p className="text-xs text-slate-500">No data yet</p>}
                      </div>
                    </div>
                  </div>

                  {/* Per-student cards */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">👤 Student-by-Student Breakdown</h2>
                    <div className="space-y-4 stagger">
                      {studentList.map(s => {
                        const avg = s.totalQuestions ? Math.round((s.totalScore / s.totalQuestions) * 100) : 0
                        const topStrong = Object.entries(s.strongMap).sort((a,b) => b[1]-a[1]).slice(0, 4)
                        const topWeak = Object.entries(s.weakMap).sort((a,b) => b[1]-a[1]).slice(0, 4)
                        return (
                          <div key={s.id} className="card hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{s.name}</p>
                                  <p className="text-xs text-slate-500">{s.email} • {s.attempts.length} quiz{s.attempts.length !== 1 ? 'zes' : ''} taken</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${avg >= 70 ? 'text-emerald-400' : avg >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {avg}%
                                </p>
                                <p className="text-xs text-slate-500">avg score</p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                              <div
                                className={`h-2 rounded-full transition-all ${avg >= 70 ? 'bg-emerald-500' : avg >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${avg}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-emerald-400 font-bold mb-1.5">💪 Strong Areas</p>
                                {topStrong.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {topStrong.map(([name, count], j) => (
                                      <span key={j} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                                        {name}
                                        <span className="font-bold text-emerald-400/60">×{count}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : <p className="text-xs text-slate-600 italic">None identified</p>}
                              </div>
                              <div>
                                <p className="text-xs text-red-400 font-bold mb-1.5">📉 Weak Areas</p>
                                {topWeak.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {topWeak.map(([name, count], j) => (
                                      <span key={j} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                                        {name}
                                        <span className="font-bold text-red-400/60">×{count}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : <p className="text-xs text-slate-600 italic">None identified</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )
            })()}
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
