"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getClassById } from '@/services/classService'
import { getClassQuizzes } from '@/services/quizService'
import { getStudentAttemptForQuiz } from '@/services/attemptService'

function ClassDetailContent() {
  const { classId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [cls, setCls] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId || !user) return
    async function load() {
      const [classData, quizData] = await Promise.all([
        getClassById(classId),
        getClassQuizzes(classId),
      ])
      setCls(classData)
      // Only show published quizzes to students
      const published = quizData.filter(q => q.is_published)
      setQuizzes(published)

      // Check which quizzes student already attempted
      const attemptMap = {}
      for (const quiz of published) {
        const attempt = await getStudentAttemptForQuiz(quiz.id, user.id)
        if (attempt) attemptMap[quiz.id] = attempt
      }
      setAttempts(attemptMap)
      setLoading(false)
    }
    load()
  }, [classId, user])

  if (loading) return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )

  if (!cls) return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="text-center py-20">
        <p className="text-5xl mb-4">❌</p>
        <p className="text-xl text-slate-400">Class not found</p>
        <button onClick={() => router.push('/student/classes')} className="btn-primary mt-4 text-sm px-6 py-2">
          ← Back to Classes
        </button>
      </div>
    </div>
  )

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Class Header */}
        <div className="card mb-6 fade-in">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 flex items-center justify-center text-2xl">🏫</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{cls.class_name}</h1>
              <p className="text-slate-400 text-sm">
                Teacher: {cls.profiles?.name || 'Unknown'} • Code: {cls.class_code}
              </p>
            </div>
          </div>
          {cls.description && <p className="text-slate-500 text-sm">{cls.description}</p>}
        </div>

        {/* Quizzes */}
        <div className="mb-4 fade-in">
          <h2 className="text-xl font-bold text-white mb-4">📝 Available Quizzes</h2>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">No quizzes available yet</p>
            <p className="text-slate-500 text-sm mt-1">Your teacher hasn't published any quizzes</p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {quizzes.map(quiz => {
              const attempt = attempts[quiz.id]
              return (
                <div key={quiz.id} className="card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        attempt ? 'bg-emerald-500/15' : 'bg-indigo-500/15'
                      }`}>
                        {attempt ? '✅' : '📝'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{quiz.title}</h3>
                        <p className="text-slate-400 text-sm">
                          {quiz.topic} • {quiz.difficulty} • {quiz.timer_minutes} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {attempt ? (
                        <div>
                          <p className={`text-2xl font-bold ${
                            attempt.percentage >= 70 ? 'text-emerald-400' : attempt.percentage >= 40 ? 'text-amber-400' : 'text-red-400'
                          }`}>{attempt.percentage}%</p>
                          <p className="text-xs text-slate-500">Completed</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push(`/student/classes/${classId}/quiz/${quiz.id}`)}
                          className="btn-primary text-sm px-5 py-2"
                        >
                          Start Quiz →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button onClick={() => router.push('/student/classes')}
          className="btn-secondary w-full py-3 mt-6">
          ← Back to Classes
        </button>
      </div>
    </div>
  )
}

export default function StudentClassDetail() {
  return (
    <ProtectedRoute role="student">
      <ClassDetailContent />
    </ProtectedRoute>
  )
}
