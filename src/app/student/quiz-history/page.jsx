"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getQuizHistory } from '@/services/attemptService'

function QuizHistoryContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) return
    getQuizHistory(user.id).then(data => { setHistory(data); setLoading(false) })
  }, [user])

  const topics = ['All', ...new Set(history.map(h => h.topic).filter(Boolean))]
  const filtered = filter === 'All' ? history : history.filter(h => h.topic === filter)

  if (loading) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )

  // Detail View
  if (selected) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setSelected(null)} className="btn-secondary text-sm px-4 py-2 mb-5">← Back to History</button>

        <div className="card text-center mb-6 fade-in">
          <p className="text-5xl mb-2">{selected.percentage >= 80 ? '🏆' : selected.percentage >= 60 ? '👍' : '📚'}</p>
          <h1 className="text-2xl font-bold">{selected.topic || 'Quiz'}</h1>
          <p className="text-slate-400 text-sm mb-4">
            {selected.field} • {selected.difficulty} • {new Date(selected.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="stat-card"><p className="text-2xl font-bold text-emerald-400">{selected.percentage}%</p><p className="text-xs text-slate-400">Score</p></div>
            <div className="stat-card"><p className="text-2xl font-bold text-indigo-400">{selected.score}/{selected.total}</p><p className="text-xs text-slate-400">Correct</p></div>
            <div className="stat-card"><p className="text-2xl font-bold text-purple-400">{Math.floor((selected.time_taken || 0) / 60)}m</p><p className="text-xs text-slate-400">Time</p></div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className={`h-2 rounded-full ${selected.percentage >= 70 ? 'bg-emerald-500' : selected.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${selected.percentage}%` }} />
          </div>
        </div>

        {/* Strong & Weak */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <h3 className="font-bold text-emerald-400 text-sm mb-2">💪 Strong Areas</h3>
            {(selected.strong_areas || []).length > 0
              ? selected.strong_areas.map((a, i) => (
                <div key={i} className="flex justify-between text-xs text-emerald-300 py-1.5 border-b border-emerald-900/50">
                  <span>{a.name}</span><span className="font-bold">{a.percentage}%</span>
                </div>
              ))
              : <p className="text-xs text-emerald-800">None identified</p>}
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
            <h3 className="font-bold text-red-400 text-sm mb-2">📉 Weak Areas</h3>
            {(selected.weak_areas || []).length > 0
              ? selected.weak_areas.map((a, i) => (
                <div key={i} className="flex justify-between text-xs text-red-300 py-1.5 border-b border-red-900/50">
                  <span>{a.name}</span><span className="font-bold">{a.percentage}%</span>
                </div>
              ))
              : <p className="text-xs text-red-800">No weak areas!</p>}
          </div>
        </div>

        {/* Q&A Review */}
        {selected.questions && selected.questions.length > 0 && (
          <div className="card mb-6 text-left">
            <h2 className="text-xl font-bold mb-4">📋 Review & Explanations</h2>
            <div className="space-y-4">
              {selected.questions.map((q, i) => {
                const userAns = selected.answers?.[i]
                const isCorrect = userAns === q.answer || userAns === q.correct_answer
                const actualAnswer = q.answer || q.correct_answer
                
                return (
                  <div key={i} className={`rounded-xl p-4 border-l-4 ${
                    !userAns ? 'border-slate-500 bg-slate-800/50' :
                    isCorrect ? 'border-emerald-500 bg-emerald-500/5' :
                    'border-red-500 bg-red-500/5'
                  }`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span>{!userAns ? '⬜' : isCorrect ? '✅' : '❌'}</span>
                      <p className="font-medium text-sm text-white">{i + 1}. {q.question || q.question_text}</p>
                    </div>
                    <div className="space-y-1 mb-2 ml-6">
                      {q.options.map((opt, j) => (
                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg flex justify-between ${
                          opt === actualAnswer ? 'bg-emerald-500/20 text-emerald-200 font-bold' :
                          opt === userAns && !isCorrect ? 'bg-red-500/20 text-red-200' :
                          'text-slate-600'
                        }`}>
                          <span>{['A','B','C','D'][j]}. {opt}</span>
                          {opt === actualAnswer && <span>✓ Correct</span>}
                          {opt === userAns && !isCorrect && <span>✗ Your answer</span>}
                        </div>
                      ))}
                    </div>
                    <div className="ml-6 bg-slate-800/80 rounded-lg p-3 text-sm text-slate-300 border-l-2 border-amber-500 mt-3">
                      <span className="font-bold text-amber-500 block mb-1">💡 Explanation:</span> 
                      {q.explanation}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => {
            localStorage.setItem('roadmapData', JSON.stringify({
              subject: selected.subtopic || selected.topic, field: selected.field || selected.topic,
              difficulty: selected.difficulty, score: selected.percentage,
              weakAreas: selected.weak_areas || [], strongAreas: selected.strong_areas || [],
            }))
            router.push('/student/roadmaps')
          }} className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-sm transition-all">
            🗺️ Get Roadmap
          </button>
          <button onClick={() => router.push('/student/practice')} className="btn-primary py-3 text-sm font-bold">
            🔄 Retake Quiz
          </button>
        </div>
      </div>
    </div>
  )

  // History List
  return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">📋 Quiz History</h1>
            <p className="text-slate-400 mt-1">{history.length} quizzes completed</p>
          </div>
          <button onClick={() => router.push('/student/practice')} className="btn-primary text-sm px-5 py-2.5">
            + New Quiz
          </button>
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-5 stagger">
            <div className="stat-card"><p className="text-2xl font-bold text-indigo-400">{history.length}</p><p className="text-xs text-slate-400 mt-1">Total</p></div>
            <div className="stat-card"><p className="text-2xl font-bold text-emerald-400">{Math.round(history.reduce((s, h) => s + Number(h.percentage || 0), 0) / history.length)}%</p><p className="text-xs text-slate-400 mt-1">Avg Score</p></div>
            <div className="stat-card"><p className="text-2xl font-bold text-amber-400">{history.filter(h => h.percentage >= 70).length}</p><p className="text-xs text-slate-400 mt-1">Passed</p></div>
            <div className="stat-card"><p className="text-2xl font-bold text-purple-400">{Math.max(...history.map(h => h.percentage || 0), 0)}%</p><p className="text-xs text-slate-400 mt-1">Best</p></div>
          </div>
        )}

        {/* Filter */}
        {topics.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {topics.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>{t}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-xl text-slate-400 mb-2">No quizzes yet!</p>
            <button onClick={() => router.push('/student/practice')} className="btn-primary mt-4 text-sm px-6 py-2.5">
              🚀 Take Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {filtered.map((quiz, i) => (
              <button key={i} onClick={() => setSelected(quiz)}
                className="w-full card-hover text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>{quiz.percentage >= 80 ? '🏆' : quiz.percentage >= 60 ? '👍' : '📚'}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-sm">{quiz.topic || 'Quiz'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          quiz.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' :
                          quiz.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>{quiz.difficulty}</span>
                        {quiz.quiz_type === 'classroom' && <span className="badge-teacher text-xs">Classroom</span>}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(quiz.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${quiz.percentage >= 70 ? 'text-emerald-400' : quiz.percentage >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {quiz.percentage}%
                    </p>
                    <p className="text-slate-500 text-xs">{quiz.score}/{quiz.total}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuizHistory() {
  return (
    <ProtectedRoute role="student">
      <QuizHistoryContent />
    </ProtectedRoute>
  )
}
