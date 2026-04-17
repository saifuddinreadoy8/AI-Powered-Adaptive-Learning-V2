"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getStudentAttemptForQuiz } from '@/services/attemptService'
import { getQuizById } from '@/services/quizService'
import { supabase } from '@/lib/supabase'

function StudentDetailContent() {
  const { user } = useAuth()
  const { classId, quizId, studentId } = useParams()
  const router = useRouter()
  const [attempt, setAttempt] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    async function load() {
      const [attemptData, quizData, profileData] = await Promise.all([
        getStudentAttemptForQuiz(quizId, studentId),
        getQuizById(quizId),
        supabase.from('profiles').select('name, email').eq('id', studentId).single().then(r => r.data),
      ])
      setAttempt(attemptData)
      setQuiz(quizData)
      setStudentProfile(profileData)
      setLoading(false)
    }
    load()
  }, [quizId, studentId])

  if (loading) return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  )

  if (!attempt) return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-slate-400">No attempt found for this student.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4 text-sm px-6 py-2">← Go Back</button>
      </div>
    </div>
  )

  const questions = attempt.questions || []
  const answers = attempt.answers || {}
  const strongAreas = attempt.strong_areas || []
  const weakAreas = attempt.weak_areas || []
  const pct = Math.round(attempt.percentage)
  const grade = pct >= 80 ? { label: 'Excellent', emoji: '🏆', color: 'emerald' }
    : pct >= 60 ? { label: 'Good', emoji: '👍', color: 'blue' }
    : pct >= 40 ? { label: 'Average', emoji: '📚', color: 'amber' }
    : { label: 'Needs Improvement', emoji: '💪', color: 'red' }

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.push(`/teacher/classes/${classId}/quiz/${quizId}`)} className="text-slate-400 hover:text-white text-sm mb-4 inline-block transition-colors">
          ← Back to Quiz Results
        </button>

        {/* ── Student Header Card ── */}
        <div className="card mb-6 fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                {studentProfile?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{studentProfile?.name || 'Unknown Student'}</h1>
                <p className="text-slate-400 text-sm">{studentProfile?.email}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {quiz?.title} • Submitted {new Date(attempt.submitted_at).toLocaleDateString()}
                  {attempt.auto_submit && <span className="ml-2 text-amber-400">⏱️ Auto-submitted</span>}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-4xl">{grade.emoji}</p>
              <p className={`text-xs font-bold text-${grade.color}-400 mt-1`}>{grade.label}</p>
            </div>
          </div>

          {/* Score Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="stat-card">
              <p className={`text-3xl font-bold text-${grade.color}-400`}>{pct}%</p>
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
              <p className="text-xs text-slate-400 mt-1">Time Taken</p>
            </div>
            <div className="stat-card">
              <p className="text-3xl font-bold text-slate-300">{attempt.difficulty || quiz?.difficulty || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">Difficulty</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all bg-${grade.color}-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Strong & Weak Areas Section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 stagger">
          {/* Strong Areas */}
          <div className="card border-emerald-500/20 fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">💪</div>
              <div>
                <h2 className="font-bold text-emerald-400">Strong Areas</h2>
                <p className="text-xs text-slate-500">{strongAreas.length} topic{strongAreas.length !== 1 ? 's' : ''} identified</p>
              </div>
            </div>
            {strongAreas.length > 0 ? (
              <div className="space-y-3">
                {strongAreas.map((area, i) => {
                  const name = typeof area === 'string' ? area : area.name
                  const areaPct = typeof area === 'string' ? null : area.percentage
                  return (
                    <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-emerald-200">{name}</span>
                        {areaPct != null && <span className="text-sm font-bold text-emerald-400">{areaPct}%</span>}
                      </div>
                      {areaPct != null && (
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${areaPct}%` }} />
                        </div>
                      )}
                      {typeof area !== 'string' && area.correct != null && (
                        <p className="text-xs text-emerald-300/50 mt-1.5">{area.correct}/{area.total} correct</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-600 text-sm italic">No strong areas identified</p>
                <p className="text-slate-700 text-xs mt-1">Student needs more practice</p>
              </div>
            )}
          </div>

          {/* Weak Areas */}
          <div className="card border-red-500/20 fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-lg">📉</div>
              <div>
                <h2 className="font-bold text-red-300">Weak Areas</h2>
                <p className="text-xs text-slate-500">{weakAreas.length} topic{weakAreas.length !== 1 ? 's' : ''} need attention</p>
              </div>
            </div>
            {weakAreas.length > 0 ? (
              <div className="space-y-3">
                {weakAreas.map((area, i) => {
                  const name = typeof area === 'string' ? area : area.name
                  const areaPct = typeof area === 'string' ? null : area.percentage
                  return (
                    <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-red-200">{name}</span>
                        {areaPct != null && <span className="text-sm font-bold text-red-400">{areaPct}%</span>}
                      </div>
                      {areaPct != null && (
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${areaPct}%` }} />
                        </div>
                      )}
                      {typeof area !== 'string' && area.correct != null && (
                        <p className="text-xs text-red-300/50 mt-1.5">{area.correct}/{area.total} correct</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-emerald-500 text-sm font-medium">✨ No weak areas!</p>
                <p className="text-slate-600 text-xs mt-1">Great performance across all topics</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Answer Review Section ── */}
        {questions.length > 0 && (
          <div className="card fade-in">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-between mb-1"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📋 Answer Review
                <span className="text-xs font-normal text-slate-500">({attempt.score} correct, {attempt.total - attempt.score} wrong)</span>
              </h2>
              <span className="text-slate-400 text-sm font-medium px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                {showReview ? 'Hide ▲' : 'Show ▼'}
              </span>
            </button>

            {showReview && (
              <div className="space-y-4 mt-4 stagger">
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
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-slate-800">{!userAns ? '⬜' : isCorrect ? '✅' : '❌'}</span>
                        <p className="font-medium text-sm text-white leading-relaxed pt-0.5">{i + 1}. {q.question}</p>
                      </div>
                      <div className="space-y-1.5 ml-9">
                        {(q.options || []).map((opt, j) => (
                          <div key={j} className={`text-xs px-3 py-2 rounded-lg flex justify-between items-center ${
                            opt === q.answer ? 'bg-emerald-500/15 text-emerald-200 font-semibold border border-emerald-500/20' :
                            opt === userAns && !isCorrect ? 'bg-red-500/15 text-red-200 border border-red-500/20' :
                            'text-slate-500 bg-slate-800/30 border border-transparent'
                          }`}>
                            <span>{['A','B','C','D'][j]}. {opt}</span>
                            <span>
                              {opt === q.answer && '✓ correct'}
                              {opt === userAns && !isCorrect && '✗ selected'}
                            </span>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="ml-9 mt-2 text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDetailPage() {
  return (
    <ProtectedRoute role="teacher">
      <StudentDetailContent />
    </ProtectedRoute>
  )
}

