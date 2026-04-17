"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getClassById } from '@/services/classService'
import { getTopics } from '@/services/topicService'
import { createQuiz } from '@/services/quizService'
import { generateClassroomQuiz } from '@/lib/gemini'

function CreateQuizContent() {
  const { user } = useAuth()
  const { classId } = useParams()
  const router = useRouter()
  const [cls, setCls] = useState(null)
  const [topics, setTopics] = useState([])
  const [title, setTitle] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [customSubtopic, setCustomSubtopic] = useState('')
  const [useCustomSubtopic, setUseCustomSubtopic] = useState(false)
  const [difficulty, setDifficulty] = useState('Medium')
  const [timerMinutes, setTimerMinutes] = useState(20)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      const [classData, topicData] = await Promise.all([
        getClassById(classId),
        getTopics(),
      ])
      if (!classData || classData.teacher_id !== user?.id) {
        router.push('/teacher/classes')
        return
      }
      setCls(classData)
      setTopics(topicData)
      setLoading(false)
    }
    load()
  }, [classId, user])

  // Get subtopics for the currently selected topic
  const currentTopicObj = topics.find(t => t.topic_name === selectedTopic)
  const availableSubtopics = currentTopicObj?.subtopics || []

  // Resolve the final subtopic value
  const finalSubtopic = useCustomSubtopic ? customSubtopic.trim() : selectedSubtopic

  function handleTopicSelect(topicName) {
    setSelectedTopic(topicName)
    // Reset subtopic when topic changes
    setSelectedSubtopic('')
    setCustomSubtopic('')
    setUseCustomSubtopic(false)
  }

  function handleSubtopicSelect(subtopicName) {
    setSelectedSubtopic(subtopicName)
    setUseCustomSubtopic(false)
    setCustomSubtopic('')
  }

  function handleCustomToggle() {
    setUseCustomSubtopic(true)
    setSelectedSubtopic('')
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!selectedTopic || !title.trim()) {
      setError('Please enter a title and select a topic.')
      return
    }
    setError('')
    setGenerating(true)
    setSuccess('')

    try {
      // Generate 20 questions using Gemini AI (with optional subtopic)
      const questions = await generateClassroomQuiz(selectedTopic, difficulty, finalSubtopic)
      if (!Array.isArray(questions) || questions.length < 5) {
        throw new Error('AI returned insufficient questions. Try again.')
      }

      // Save quiz + questions to DB
      const quiz = await createQuiz({
        title: title.trim(),
        quizType: 'classroom',
        classId,
        topic: selectedTopic,
        subtopic: finalSubtopic,
        difficulty,
        creatorId: user.id,
        timerMinutes,
        isPublished: false,
      }, questions)

      if (quiz) {
        setSuccess(`✅ Quiz "${quiz.title}" created with ${questions.length} questions! It's unpublished — publish it when ready.`)
        setTitle('')
        setSelectedTopic('')
        setSelectedSubtopic('')
        setCustomSubtopic('')
        setUseCustomSubtopic(false)
      } else {
        setError('Failed to save quiz. Try again.')
      }
    } catch (err) {
      setError(`❌ ${err.message}`)
    }
    setGenerating(false)
  }

  if (loading) return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <button onClick={() => router.push(`/teacher/classes/${classId}`)} className="text-slate-400 hover:text-white text-sm mb-3 inline-block">
            ← Back to {cls?.class_name}
          </button>
          <h1 className="text-3xl font-bold text-white">🤖 Create AI Quiz</h1>
          <p className="text-slate-400 mt-1">Generate 20 MCQs using Gemini AI for your class</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 mb-4 text-sm">{success}</div>}

        <form onSubmit={handleGenerate} className="card space-y-5 fade-in">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Quiz Title *</label>
            <input className="input" type="text" placeholder="e.g. Week 3 — Data Structures Test" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          {/* Topic Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Topic *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {topics.map(t => (
                <button key={t.id} type="button" onClick={() => handleTopicSelect(t.topic_name)}
                  className={`p-3 rounded-xl text-sm font-medium text-left border-2 transition-all ${
                    selectedTopic === t.topic_name
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}>
                  <span className="mr-1">{t.icon}</span> {t.topic_name}
                </button>
              ))}
            </div>
          </div>

          {/* Subtopic Selection — shown only when a topic is selected */}
          {selectedTopic && (
            <div className="fade-in">
              <label className="block text-sm text-slate-400 mb-2">
                Subtopic <span className="text-slate-600">(optional — narrows question focus)</span>
              </label>

              {availableSubtopics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableSubtopics.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubtopicSelect(sub.subtopic_name)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        !useCustomSubtopic && selectedSubtopic === sub.subtopic_name
                          ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                          : 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub.subtopic_name}
                    </button>
                  ))}

                  {/* Custom subtopic chip */}
                  <button
                    type="button"
                    onClick={handleCustomToggle}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      useCustomSubtopic
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-dashed border-slate-600 hover:border-slate-500 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    ✏️ Custom
                  </button>
                </div>
              )}

              {/* Custom subtopic input — always show if no subtopics exist OR if custom is toggled */}
              {(useCustomSubtopic || availableSubtopics.length === 0) && (
                <input
                  className="input text-sm"
                  type="text"
                  placeholder="Type a custom subtopic, e.g. Binary Search Trees"
                  value={customSubtopic}
                  onChange={e => setCustomSubtopic(e.target.value)}
                  autoFocus
                />
              )}

              {/* Clear subtopic button */}
              {(selectedSubtopic || customSubtopic) && (
                <button
                  type="button"
                  onClick={() => { setSelectedSubtopic(''); setCustomSubtopic(''); setUseCustomSubtopic(false) }}
                  className="text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors"
                >
                  ✕ Clear subtopic (generate from full topic)
                </button>
              )}
            </div>
          )}

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Difficulty *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 'Easy', icon: '🟢', desc: 'Basic fundamentals' },
                { level: 'Medium', icon: '🟡', desc: 'Intermediate' },
                { level: 'Hard', icon: '🔴', desc: 'Advanced' },
              ].map(d => (
                <button key={d.level} type="button" onClick={() => setDifficulty(d.level)}
                  className={`p-4 rounded-xl text-center border-2 transition-all ${
                    difficulty === d.level ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}>
                  <div className="text-2xl mb-1">{d.icon}</div>
                  <div className="font-bold text-white text-sm">{d.level}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Timer (minutes)</label>
            <input className="input w-32" type="number" min={5} max={120} value={timerMinutes} onChange={e => setTimerMinutes(Number(e.target.value))} />
          </div>

          {/* Generate info */}
          {selectedTopic && (
            <div className="bg-slate-800/50 rounded-xl p-3 text-sm text-slate-400 fade-in">
              📋 Generating <b className="text-white">20 {difficulty}</b> questions on{' '}
              <b className="text-indigo-300">{selectedTopic}</b>
              {finalSubtopic && <> → <b className="text-purple-300">{finalSubtopic}</b></>}
            </div>
          )}

          <button type="submit" disabled={generating} className="btn-primary w-full py-4 text-lg font-bold">
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating 20 questions with AI...
              </span>
            ) : '🤖 Generate Quiz with AI'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CreateQuizPage() {
  return (
    <ProtectedRoute role="teacher">
      <CreateQuizContent />
    </ProtectedRoute>
  )
}

