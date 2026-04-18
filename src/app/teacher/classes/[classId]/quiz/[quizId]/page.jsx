"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getQuizById, publishQuiz, unpublishQuiz, deleteQuiz } from '@/services/quizService'
import { getQuizQuestions, updateQuestion, deleteQuestion } from '@/services/questionService'
import { getQuizAttemptsByQuiz } from '@/services/attemptService'
import { getClassById } from '@/services/classService'

function QuizDetailContent() {
  const { user } = useAuth()
  const { classId, quizId } = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState(null)
  const [cls, setCls] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('questions')

  // Editing state
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [quizData, classData, attemptData, questionData] = await Promise.all([
        getQuizById(quizId),
        getClassById(classId),
        getQuizAttemptsByQuiz(quizId),
        getQuizQuestions(quizId),
      ])
      if (!classData || classData.teacher_id !== user?.id) {
        router.push('/teacher/classes')
        return
      }
      setQuiz(quizData)
      setCls(classData)
      setAttempts(attemptData)
      setQuestions(questionData)
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

  async function handleDeleteQuiz() {
    if (!confirm('Delete this quiz? All student attempts will be lost.')) return
    await deleteQuiz(quizId)
    router.push(`/teacher/classes/${classId}`)
  }

  // ── Question editing ──
  function startEdit(q) {
    setEditingId(q.id)
    setEditForm({
      question_text: q.question_text,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      subtopic: q.subtopic || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  function updateEditField(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function updateEditOption(index, value) {
    setEditForm(prev => {
      const options = [...prev.options]
      // If the old option was the correct answer, update correct_answer too
      if (prev.correct_answer === options[index]) {
        return { ...prev, options: options.map((o, i) => i === index ? value : o), correct_answer: value }
      }
      options[index] = value
      return { ...prev, options }
    })
  }

  async function handleSaveEdit() {
    if (!editForm || !editingId) return
    if (!editForm.question_text.trim()) return
    if (editForm.options.some(o => !o.trim())) return
    if (!editForm.options.includes(editForm.correct_answer)) {
      alert('Correct answer must match one of the options exactly.')
      return
    }
    setSaving(true)
    const updated = await updateQuestion(editingId, editForm)
    if (updated) {
      setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...updated } : q))
    }
    setEditingId(null)
    setEditForm(null)
    setSaving(false)
  }

  async function handleDeleteQuestion(questionId) {
    if (!confirm('Delete this question?')) return
    const ok = await deleteQuestion(questionId)
    if (ok) {
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    }
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
                {quiz.topic}{quiz.subtopic ? ` → ${quiz.subtopic}` : ''} • {quiz.difficulty} • {quiz.timer_minutes} min
              </p>
              <div className="flex gap-2 mt-3">
                <span className={quiz.is_published ? 'badge-student' : 'badge-admin'}>
                  {quiz.is_published ? '🟢 Published' : '🟡 Draft'}
                </span>
                <span className="text-xs text-slate-500 self-center">{questions.length} questions</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePublishToggle} className={quiz.is_published ? 'btn-secondary text-sm px-4 py-2' : 'btn-success text-sm px-4 py-2'}>
                {quiz.is_published ? 'Unpublish' : '🚀 Publish'}
              </button>
              <button onClick={handleDeleteQuiz} className="btn-danger text-sm px-4 py-2">Delete</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 stagger">
          <div className="stat-card">
            <p className="text-3xl font-bold text-indigo-400">{questions.length}</p>
            <p className="text-slate-400 text-sm mt-1">Questions</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-emerald-400">{attempts.length}</p>
            <p className="text-slate-400 text-sm mt-1">Submissions</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-bold text-purple-400">{avgScore}%</p>
            <p className="text-slate-400 text-sm mt-1">Avg Score</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['questions', 'results'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white border border-transparent'
              }`}>
              {t === 'questions' ? `📝 Questions (${questions.length})` : `📊 Results (${attempts.length})`}
            </button>
          ))}
        </div>

        {/* Questions Tab */}
        {tab === 'questions' && (
          <div>
            {questions.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-slate-400">No questions in this quiz</p>
              </div>
            ) : (
              <div className="space-y-4 stagger">
                {questions.map((q, idx) => (
                  <div key={q.id} className="card">
                    {editingId === q.id ? (
                      /* ── Edit Mode ── */
                      <div className="space-y-4 fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editing Q{idx + 1}</span>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} disabled={saving}
                              className="text-xs px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold transition-all">
                              {saving ? 'Saving...' : '✓ Save'}
                            </button>
                            <button onClick={cancelEdit}
                              className="text-xs px-4 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>

                        {/* Question text */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Question</label>
                          <textarea
                            className="input text-sm min-h-[70px]"
                            value={editForm.question_text}
                            onChange={e => updateEditField('question_text', e.target.value)}
                          />
                        </div>

                        {/* Options */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Options (click radio to set correct answer)</label>
                          <div className="space-y-2">
                            {editForm.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="correct_answer"
                                  checked={editForm.correct_answer === opt}
                                  onChange={() => updateEditField('correct_answer', opt)}
                                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                />
                                <input
                                  className="input text-sm flex-1 py-1.5"
                                  value={opt}
                                  onChange={e => updateEditOption(oi, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                />
                                {editForm.correct_answer === opt && (
                                  <span className="text-xs text-emerald-400 font-bold whitespace-nowrap">✓ Correct</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Explanation</label>
                          <textarea
                            className="input text-sm min-h-[50px]"
                            value={editForm.explanation}
                            onChange={e => updateEditField('explanation', e.target.value)}
                            placeholder="Why is this the correct answer?"
                          />
                        </div>

                        {/* Subtopic */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Subtopic</label>
                          <input
                            className="input text-sm py-1.5"
                            value={editForm.subtopic}
                            onChange={e => updateEditField('subtopic', e.target.value)}
                            placeholder="e.g. Binary Trees"
                          />
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-white leading-relaxed pt-1">{q.question_text}</p>
                          </div>
                          <div className="flex gap-1 ml-3 flex-shrink-0">
                            <button onClick={() => startEdit(q)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-all">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteQuestion(q.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              Del
                            </button>
                          </div>
                        </div>

                        {/* Options display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                          {q.options?.map((opt, oi) => (
                            <div key={oi} className={`px-3 py-2 rounded-lg text-sm border ${
                              opt === q.correct_answer
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                : 'border-slate-700/50 bg-slate-800/30 text-slate-400'
                            }`}>
                              <span className="font-bold mr-2 text-xs">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                              {opt === q.correct_answer && <span className="ml-1 text-xs">✓</span>}
                            </div>
                          ))}
                        </div>

                        {/* Explanation & subtopic */}
                        {(q.explanation || q.subtopic) && (
                          <div className="ml-11 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            {q.explanation && <p className="truncate max-w-md" title={q.explanation}>💡 {q.explanation}</p>}
                            {q.subtopic && <p>📂 {q.subtopic}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {tab === 'results' && (
          <div className="space-y-6">
            {attempts.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-500">{quiz.is_published ? 'No submissions yet. Students can now take this quiz.' : 'Publish this quiz to allow students to take it.'}</p>
              </div>
            ) : (
              <>
                {/* ── Class-Wide Analytics Summary ── */}
                {(() => {
                  // Aggregate strong/weak across all attempts
                  const strongMap = {}
                  const weakMap = {}
                  const scoreRanges = { excellent: 0, good: 0, average: 0, poor: 0 }
                  attempts.forEach(att => {
                    const pct = Number(att.percentage)
                    if (pct >= 80) scoreRanges.excellent++
                    else if (pct >= 60) scoreRanges.good++
                    else if (pct >= 40) scoreRanges.average++
                    else scoreRanges.poor++

                    ;(att.strong_areas || []).forEach(a => {
                      const name = typeof a === 'string' ? a : a.name
                      if (!name) return
                      strongMap[name] = (strongMap[name] || 0) + 1
                    })
                    ;(att.weak_areas || []).forEach(a => {
                      const name = typeof a === 'string' ? a : a.name
                      if (!name) return
                      weakMap[name] = (weakMap[name] || 0) + 1
                    })
                  })
                  const topStrong = Object.entries(strongMap).sort((a,b) => b[1]-a[1]).slice(0,5)
                  const topWeak = Object.entries(weakMap).sort((a,b) => b[1]-a[1]).slice(0,5)
                  const total = attempts.length

                  return (
                    <div className="card fade-in">
                      <h2 className="text-lg font-bold text-white mb-4">📈 Class Performance Overview</h2>

                      {/* Score Distribution */}
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{scoreRanges.excellent}</p>
                          <p className="text-xs text-emerald-300/70 mt-0.5">≥80% Excellent</p>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${total ? (scoreRanges.excellent/total)*100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-blue-400">{scoreRanges.good}</p>
                          <p className="text-xs text-blue-300/70 mt-0.5">60-79% Good</p>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${total ? (scoreRanges.good/total)*100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-amber-400">{scoreRanges.average}</p>
                          <p className="text-xs text-amber-300/70 mt-0.5">40-59% Average</p>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${total ? (scoreRanges.average/total)*100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-red-400">{scoreRanges.poor}</p>
                          <p className="text-xs text-red-300/70 mt-0.5">&lt;40% Needs Help</p>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${total ? (scoreRanges.poor/total)*100 : 0}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Top Strong & Weak Areas across all students */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                          <h3 className="font-bold text-emerald-400 text-sm mb-3 flex items-center gap-2">
                            💪 Class Strong Areas
                            <span className="text-xs font-normal text-slate-500">(most frequent)</span>
                          </h3>
                          {topStrong.length > 0 ? topStrong.map(([name, count], i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-emerald-900/30 last:border-0">
                              <span className="text-sm text-emerald-200">{name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(count/total)*100}%` }} />
                                </div>
                                <span className="text-xs text-emerald-400 font-bold w-12 text-right">{count}/{total}</span>
                              </div>
                            </div>
                          )) : (
                            <p className="text-xs text-slate-500">No strong area data yet</p>
                          )}
                        </div>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                          <h3 className="font-bold text-red-300 text-sm mb-3 flex items-center gap-2">
                            📉 Class Weak Areas
                            <span className="text-xs font-normal text-slate-500">(most frequent)</span>
                          </h3>
                          {topWeak.length > 0 ? topWeak.map(([name, count], i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-red-900/30 last:border-0">
                              <span className="text-sm text-red-200">{name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(count/total)*100}%` }} />
                                </div>
                                <span className="text-xs text-red-400 font-bold w-12 text-right">{count}/{total}</span>
                              </div>
                            </div>
                          )) : (
                            <p className="text-xs text-slate-500">No weak area data yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ── Per-Student Result Cards ── */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">👥 Individual Student Results</h2>
                  <div className="space-y-3 stagger">
                    {attempts.map(att => {
                      const strong = att.strong_areas || []
                      const weak = att.weak_areas || []
                      return (
                        <div key={att.id} className="card hover:border-slate-700 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                {att.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-white">{att.profiles?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-500">{att.profiles?.email} • {new Date(att.submitted_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`text-xl font-bold ${att.percentage >= 70 ? 'text-emerald-400' : att.percentage >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {Math.round(att.percentage)}%
                                </p>
                                <p className="text-xs text-slate-500 font-mono">{att.score}/{att.total}</p>
                              </div>
                              <button
                                onClick={() => router.push(`/teacher/classes/${classId}/quiz/${quizId}/student/${att.student_id}`)}
                                className="text-xs px-3 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 font-bold transition-all flex-shrink-0"
                              >
                                Details →
                              </button>
                            </div>
                          </div>

                          {/* Score bar */}
                          <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all ${att.percentage >= 70 ? 'bg-emerald-500' : att.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${att.percentage}%` }}
                            />
                          </div>

                          {/* Strong & Weak areas inline */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-emerald-400 font-bold mb-1.5">💪 Strong Areas</p>
                              {strong.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {strong.map((a, j) => (
                                    <span key={j} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                                      {typeof a === 'string' ? a : a.name}
                                      {typeof a !== 'string' && a.percentage != null && (
                                        <span className="font-bold text-emerald-400">{a.percentage}%</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 italic">None identified</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-red-400 font-bold mb-1.5">📉 Weak Areas</p>
                              {weak.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {weak.map((a, j) => (
                                    <span key={j} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                                      {typeof a === 'string' ? a : a.name}
                                      {typeof a !== 'string' && a.percentage != null && (
                                        <span className="font-bold text-red-400">{a.percentage}%</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 italic">None identified</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
