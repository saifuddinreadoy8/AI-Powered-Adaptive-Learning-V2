"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getQuizById } from '@/services/quizService'
import { getQuizQuestions } from '@/services/questionService'
import { saveQuizAttempt, getStudentAttemptForQuiz } from '@/services/attemptService'

function ClassroomQuizContent() {
  const { classId, quizId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const topRef = useRef(null)
  const submitRef = useRef(false)

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alreadyAttempted, setAlreadyAttempted] = useState(false)

  useEffect(() => {
    if (!quizId || !user) return
    async function load() {
      const [quizData, questionsData, existingAttempt] = await Promise.all([
        getQuizById(quizId),
        getQuizQuestions(quizId),
        getStudentAttemptForQuiz(quizId, user.id),
      ])
      setQuiz(quizData)
      setQuestions(questionsData)

      if (existingAttempt) {
        setAlreadyAttempted(true)
        setResults(existingAttempt)
      } else {
        setTimeLeft((quizData?.timer_minutes || 20) * 60)
        setTimerActive(true)
      }
      setLoading(false)
    }
    load()
  }, [quizId, user])

  // Timer
  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); if (!submitRef.current) submitQuiz(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive])

  const formatTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleAnswer = (index, option) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [index]: option }))
  }

  const submitQuiz = async (autoSubmit = false) => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitted(true)
    setTimerActive(false)

    let score = 0
    const subtopicMap = {}
    questions.forEach((q, i) => {
      const st = q.subtopic || quiz?.topic || 'General'
      if (!subtopicMap[st]) subtopicMap[st] = { correct: 0, total: 0 }
      subtopicMap[st].total++
      if (answers[i] === q.correct_answer) { score++; subtopicMap[st].correct++ }
    })

    const subtopicResults = Object.entries(subtopicMap)
      .map(([name, d]) => ({ name, correct: d.correct, total: d.total, percentage: Math.round((d.correct / d.total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)

    const timeTaken = (quiz?.timer_minutes || 20) * 60 - timeLeft
    const percentage = Math.round((score / questions.length) * 100)

    const attempt = {
      quizId: quiz.id,
      studentId: user.id,
      score, total: questions.length, percentage, timeTaken,
      autoSubmit, answers,
      strongAreas: subtopicResults.filter(s => s.percentage >= 70),
      weakAreas: subtopicResults.filter(s => s.percentage < 70),
      topic: quiz.topic, subtopic: quiz.subtopic || '',
      field: quiz.topic, difficulty: quiz.difficulty,
      quizType: 'classroom',
    }

    const saved = await saveQuizAttempt(attempt)
    setResults({ ...attempt, id: saved?.id })
  }

  if (loading) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )

  // Already attempted — show results
  if (alreadyAttempted && results) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card text-center fade-in">
          <p className="text-5xl mb-3">{results.percentage >= 70 ? '🏆' : results.percentage >= 40 ? '📚' : '💪'}</p>
          <h1 className="text-2xl font-bold text-white mb-2">Quiz Already Completed</h1>
          <p className="text-slate-400 mb-4">You scored <b className="text-emerald-400">{results.percentage}%</b> ({results.score}/{results.total})</p>
          <button onClick={() => router.push(`/student/classes/${classId}`)} className="btn-primary px-6 py-2.5">
            ← Back to Class
          </button>
        </div>
      </div>
    </div>
  )

  const answeredCount = Object.keys(answers).length
  const totalQ = questions.length

  // Quiz in progress
  if (!submitted && !results) return (
    <div className="min-h-screen bg-slate-950" ref={topRef}>
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <p className="font-bold text-indigo-400 text-sm">{quiz?.title}</p>
            <p className="text-xs text-slate-500">{quiz?.topic} • {quiz?.difficulty} • {answeredCount}/{totalQ}</p>
          </div>
          <div className={`text-xl font-bold font-mono px-4 py-2 rounded-xl border-2 ${
            timeLeft < 120 ? 'border-red-500 bg-red-500/10 text-red-300 animate-pulse' :
            timeLeft < 300 ? 'border-amber-500 bg-amber-500/10 text-amber-300' :
            'border-slate-700 bg-slate-800 text-emerald-400'
          }`}>⏱️ {formatTime(timeLeft)}</div>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-5 pb-32">
        {questions.map((q, i) => (
          <div key={i} className={`rounded-2xl p-5 border-2 bg-slate-900/80 ${answers[i] ? 'border-indigo-600/50' : 'border-slate-800'}`}>
            <div className="flex items-start gap-3 mb-4">
              <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                answers[i] ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{i + 1}</span>
              <div>
                <p className="font-medium leading-relaxed">{q.question_text}</p>
                {q.subtopic && <p className="text-xs text-slate-500 mt-1">📌 {q.subtopic}</p>}
              </div>
            </div>
            <div className="space-y-2 ml-11">
              {(q.options || []).map((opt, j) => (
                <button key={j} onClick={() => handleAnswer(i, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    answers[i] === opt
                      ? 'border-indigo-500 bg-indigo-500/15 text-white font-semibold'
                      : 'border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}>
                  <span className="text-slate-500 font-bold mr-2">{['A','B','C','D'][j]}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            {answeredCount < totalQ
              ? <p className="text-sm text-amber-400">⚠️ {totalQ - answeredCount} unanswered</p>
              : <p className="text-sm text-emerald-400">✅ All answered!</p>}
          </div>
          <button onClick={() => submitQuiz(false)}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              answeredCount === totalQ ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}>
            {answeredCount === totalQ ? '✅ Submit' : `Submit (${answeredCount}/${totalQ})`}
          </button>
        </div>
      </div>
    </div>
  )

  // Results after submission
  if (results) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card text-center mb-6 fade-in">
          <p className="text-6xl mb-3">{results.percentage >= 80 ? '🏆' : results.percentage >= 60 ? '👍' : results.percentage >= 40 ? '📚' : '💪'}</p>
          <h1 className="text-3xl font-bold mb-1">
            {results.percentage >= 80 ? 'Excellent!' : results.percentage >= 60 ? 'Good Job!' : results.percentage >= 40 ? 'Keep Practicing!' : 'Needs Improvement'}
          </h1>
          <p className="text-slate-400 text-sm mb-4">{quiz?.title}</p>
          {results.autoSubmit && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-3 py-2 text-sm mb-4 inline-block">
              ⏱️ Auto-submitted — timer reached zero
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="stat-card"><p className="text-3xl font-bold text-emerald-400">{results.percentage}%</p><p className="text-xs text-slate-400 mt-1">Score</p></div>
            <div className="stat-card"><p className="text-3xl font-bold text-indigo-400">{results.score}/{results.total}</p><p className="text-xs text-slate-400 mt-1">Correct</p></div>
            <div className="stat-card"><p className="text-3xl font-bold text-purple-400">{Math.floor(results.timeTaken / 60)}m</p><p className="text-xs text-slate-400 mt-1">Time</p></div>
          </div>
        </div>

        {/* Q&A Review */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">📋 Review</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const userAns = answers[i]
              const isCorrect = userAns === q.correct_answer
              return (
                <div key={i} className={`rounded-xl p-4 border-l-4 ${
                  !userAns ? 'border-slate-500 bg-slate-800/50' : isCorrect ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'
                }`}>
                  <p className="font-medium text-sm mb-2">{!userAns ? '⬜' : isCorrect ? '✅' : '❌'} {i + 1}. {q.question_text}</p>
                  <div className="space-y-1 ml-6 mb-2">
                    {(q.options || []).map((opt, j) => (
                      <div key={j} className={`text-xs px-3 py-1.5 rounded-lg ${
                        opt === q.correct_answer ? 'bg-emerald-500/20 text-emerald-200 font-bold' :
                        opt === userAns && !isCorrect ? 'bg-red-500/20 text-red-200' : 'text-slate-600'
                      }`}>{['A','B','C','D'][j]}. {opt}</div>
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

        <button onClick={() => router.push(`/student/classes/${classId}`)} className="btn-primary w-full py-3">
          ← Back to Class
        </button>
      </div>
    </div>
  )

  return null
}

export default function ClassroomQuiz() {
  return (
    <ProtectedRoute role="student">
      <ClassroomQuizContent />
    </ProtectedRoute>
  )
}
