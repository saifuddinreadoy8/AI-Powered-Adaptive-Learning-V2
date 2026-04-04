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
        <p className="text-slate-400">No attempt found for this student.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4 text-sm px-6 py-2">← Go Back</button>
      </div>
    </div>
  )

  const questions = attempt.questions || []
  const answers = attempt.answers || {}

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.push(`/teacher/classes/${classId}/quiz/${quizId}`)} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
          ← Back to Quiz Results
        </button>

        {/* Student Info */}
        <div className="card mb-6 fade-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
              {studentProfile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{studentProfile?.name || 'Unknown Student'}</h1>
              <p className="text-slate-400 text-sm">{studentProfile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
        </div>

        {/* Q&A Review */}
        {questions.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">📋 Answer Review</h2>
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
                    <div className="space-y-1 ml-6">
                      {(q.options || []).map((opt, j) => (
                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg flex justify-between ${
                          opt === q.answer ? 'bg-emerald-500/20 text-emerald-200 font-bold' :
                          opt === userAns && !isCorrect ? 'bg-red-500/20 text-red-200' :
                          'text-slate-600'
                        }`}>
                          <span>{['A','B','C','D'][j]}. {opt}</span>
                          {opt === q.answer && <span>✓</span>}
                          {opt === userAns && !isCorrect && <span>✗</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
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
