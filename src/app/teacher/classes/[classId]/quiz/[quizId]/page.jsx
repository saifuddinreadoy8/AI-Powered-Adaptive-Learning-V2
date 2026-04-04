"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getQuizById, publishQuiz, unpublishQuiz, deleteQuiz } from '@/services/quizService'
import { getQuizAttemptsByQuiz } from '@/services/attemptService'
import { getClassById } from '@/services/classService'

function QuizDetailContent() {
  const { user } = useAuth()
  const { classId, quizId } = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState(null)
  const [cls, setCls] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [quizData, classData, attemptData] = await Promise.all([
        getQuizById(quizId),
        getClassById(classId),
        getQuizAttemptsByQuiz(quizId),
      ])
      if (!classData || classData.teacher_id !== user?.id) {
        router.push('/teacher/classes')
        return
      }
      setQuiz(quizData)
      setCls(classData)
      setAttempts(attemptData)
      setLoading(false)
    }
    load()
  }, [classId, quizId, user])

  async function handlePublishToggle() {
    if (!quiz) return
    if (quiz.is_published) {
      await unpublishQuiz(quizId)
      setQuiz({ ...quiz, is_published: false })
    } else {
      await publishQuiz(quizId)
      setQuiz({ ...quiz, is_published: true })
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this quiz? All student attempts will be lost.')) return
    await deleteQuiz(quizId)
    router.push(`/teacher/classes/${classId}`)
  }

  if (loading) return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  )

  if (!quiz) return null

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / attempts.length)
    : 0

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.push(`/teacher/classes/${classId}`)} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
          ← Back to {cls?.class_name}
        </button>

        {/* Quiz Header */}
        <div className="card mb-6 fade-in">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {quiz.topic} • {quiz.difficulty} • {quiz.timer_minutes} min
              </p>
              <div className="flex gap-2 mt-3">
                <span className={quiz.is_published ? 'badge-student' : 'badge-admin'}>
                  {quiz.is_published ? '🟢 Published' : '🟡 Draft'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePublishToggle} className={quiz.is_published ? 'btn-secondary text-sm px-4 py-2' : 'btn-success text-sm px-4 py-2'}>
                {quiz.is_published ? 'Unpublish' : '🚀 Publish'}
              </button>
              <button onClick={handleDelete} className="btn-danger text-sm px-4 py-2">Delete</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{attempts.length}</p>
            <p className="text-slate-400 text-sm mt-1">Submissions</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{avgScore}%</p>
            <p className="text-slate-400 text-sm mt-1">Average Score</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{quiz.timer_minutes}m</p>
            <p className="text-slate-400 text-sm mt-1">Time Limit</p>
          </div>
        </div>

        {/* Student Results */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">📊 Student Results</h2>
          {attempts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">{quiz.is_published ? 'No submissions yet. Students can now take this quiz.' : 'Publish this quiz to allow students to take it.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Score</th>
                    <th className="py-3 px-4 font-semibold">Percentage</th>
                    <th className="py-3 px-4 font-semibold">Submitted</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {attempts.map(att => (
                    <tr key={att.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{att.profiles?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{att.profiles?.email}</p>
                      </td>
                      <td className="py-4 px-4 font-mono text-indigo-400">{att.score}/{att.total}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${att.percentage >= 70 ? 'text-emerald-400' : att.percentage >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(att.percentage)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{new Date(att.submitted_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => router.push(`/teacher/classes/${classId}/quiz/${quizId}/student/${att.student_id}`)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuizDetailPage() {
  return (
    <ProtectedRoute role="teacher">
      <QuizDetailContent />
    </ProtectedRoute>
  )
}
