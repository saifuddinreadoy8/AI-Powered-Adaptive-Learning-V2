"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getQuizAttemptById } from '@/services/attemptService'

function ResultContent() {
  const { user } = useAuth()
  const { attemptId } = useParams()
  const router = useRouter()
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attemptId) return
    async function load() {
      const data = await getQuizAttemptById(attemptId)
      if (!data || data.student_id !== user?.id) {
        router.push('/student/quiz-history')
        return
      }
      setAttempt(data)
      setLoading(false)
    }
    load()
  }, [attemptId, user])

  if (loading) return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  )

  if (!attempt) return null

  const questions = attempt.questions || []
  const answers = attempt.answers || {}

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Header */}
        <div className="card mb-6 text-center fade-in">
          <p className="text-6xl mb-3">
            {attempt.percentage >= 80 ? '🏆' : attempt.percentage >= 60 ? '👍' : attempt.percentage >= 40 ? '📚' : '💪'}
          </p>
          <h1 className="text-3xl font-bold mb-1">Quiz Result</h1>
          <p className="text-slate-400 text-sm mb-5">
            {attempt.subtopic || attempt.topic} • {attempt.difficulty}
          </p>
          {attempt.auto_submit && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-3 py-2 text-sm mb-4 inline-block">
              ⏱️ Auto-submitted — timer reached zero
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="stat-card">
              <p className="text-3xl font-bold text-emerald-400">{Math.round(attempt.percentage)}%</p>
              <p className="text-xs text-slate-400 mt-1">Score</p>
            </div>
            <div className="stat-card">
              <p className="text-3xl font-bold text-indigo-400">{attempt.score}/{attempt.total}</p>
              <p className="text-xs text-slate-400 mt-1">Correct</p>
            </div>
            <div className="stat-card">
              <p className="text-3xl font-bold text-purple-400">
                {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s
              </p>
              <p className="text-xs text-slate-400 mt-1">Time</p>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${
              attempt.percentage >= 70 ? 'bg-emerald-500' : attempt.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`} style={{ width: `${attempt.percentage}%` }} />
          </div>
        </div>

        {/* Strong / Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-emerald-400 mb-3">💪 Strong Areas</h2>
            {(attempt.strong_areas || []).length > 0 ? attempt.strong_areas.map((a, i) => (
              <div key={i} className="bg-emerald-500/10 rounded-xl px-3 py-2 mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-emerald-200">{a.name}</span>
                  <span className="text-emerald-300 font-bold text-sm">{a.percentage}%</span>
                </div>
              </div>
            )) : <p className="text-emerald-800 text-sm">Keep practicing!</p>}
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-red-400 mb-3">📉 Weak Areas</h2>
            {(attempt.weak_areas || []).length > 0 ? attempt.weak_areas.map((a, i) => (
              <div key={i} className="bg-red-500/10 rounded-xl px-3 py-2 mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-red-200">{a.name}</span>
                  <span className="text-red-300 font-bold text-sm">{a.percentage}%</span>
                </div>
              </div>
            )) : <p className="text-red-800 text-sm">No weak areas! 🎉</p>}
          </div>
        </div>

        {/* Q&A Review */}
        {questions.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">📋 Question Review</h2>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const userAns = answers[i]
                const isCorrect = userAns === q.answer
                return (
                  <div key={i} className={`rounded-xl p-4 border-l-4 ${
                    !userAns ? 'border-slate-500 bg-slate-800/50' :
                    isCorrect ? 'border-emerald-500 bg-emerald-500/5' :
                    'border-red-500 bg-red-500/5'
                  }`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span>{!userAns ? '⬜' : isCorrect ? '✅' : '❌'}</span>
                      <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                    </div>
                    <div className="space-y-1 mb-2 ml-6">
                      {(q.options || []).map((opt, j) => (
                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg flex justify-between ${
                          opt === q.answer ? 'bg-emerald-500/20 text-emerald-200 font-bold' :
                          opt === userAns && !isCorrect ? 'bg-red-500/20 text-red-200' :
                          'text-slate-600'
                        }`}>
                          <span>{['A','B','C','D'][j]}. {opt}</span>
                          {opt === q.answer && <span>✓ Correct</span>}
                          {opt === userAns && !isCorrect && <span>✗ Your answer</span>}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="ml-6 bg-slate-800/80 rounded-lg p-2 text-xs text-slate-300 border-l-2 border-amber-500">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/student/practice')} className="btn-primary py-4 font-bold">🔄 New Quiz</button>
          <button onClick={() => router.push('/student/quiz-history')} className="btn-secondary py-4 font-bold">📋 History</button>
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <ProtectedRoute role="student">
      <ResultContent />
    </ProtectedRoute>
  )
}
