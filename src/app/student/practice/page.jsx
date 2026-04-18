"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useQuizTimer } from '@/hooks/useQuizTimer'
import RoleGate from '@/components/RoleGate'
import Navbar from '@/components/Navbar'
import LoadingScreen from '@/components/LoadingScreen'

// Components
import TopicSelector from '@/components/quiz/TopicSelector'
import SubtopicSelector from '@/components/quiz/SubtopicSelector'
import DifficultySelector from '@/components/quiz/DifficultySelector'
import QuizCard from '@/components/quiz/QuizCard'
import Timer from '@/components/quiz/Timer'
import ResultCard from '@/components/quiz/ResultCard'
import QuizReview from '@/components/quiz/QuizReview'

// Services
import { getTopics } from '@/services/topicService'
import { saveQuizAttempt } from '@/services/attemptService'
import { generateFullQuiz } from '@/lib/gemini'

// Constants & Utils
import { calculatePercentage } from '@/lib/utils'
import { ROLES } from '@/constants/roles'
import { QUIZ_TYPES } from '@/constants/quizTypes'

function PracticeContent() {
  const { user } = useAuth()
  const router = useRouter()
  const topRef = useRef(null)

  const [step, setStep] = useState('setup')
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const submitRef = useRef(false)

  // Timer Hook
  const { timeLeft, isActive, resetTimer, stopTimer } = useQuizTimer(
    20 * 60, 
    () => { if (!submitRef.current) submitQuiz(true) },
    false
  )

  useEffect(() => {
    getTopics().then(setTopics)
  }, [])

  const generateQuiz = async () => {
    if (!selectedTopic || !selectedSubtopic || !difficulty) {
      setError('⚠️ Please select Topic, Subtopic, and Difficulty!')
      return
    }
    setError('')
    setStep('loading')

    try {
      const parsed = await generateFullQuiz(selectedTopic.topic_name, selectedSubtopic, difficulty)
      if (!Array.isArray(parsed) || parsed.length < 5) throw new Error('Not enough questions returned')
      
      setQuestions(parsed.slice(0, 20))
      setAnswers({})
      setSubmitted(false)
      submitRef.current = false
      setStep('quiz')
      resetTimer(20 * 60)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(`❌ Failed to generate quiz: ${err.message}`)
      setStep('setup')
    }
  }

  const submitQuiz = async (autoSubmit = false) => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitted(true)
    stopTimer()

    let score = 0
    const subtopicMap = {}

    questions.forEach((q, i) => {
      const st = q.subtopic || selectedSubtopic
      if (!subtopicMap[st]) subtopicMap[st] = { correct: 0, total: 0 }
      subtopicMap[st].total++
      if (answers[i] === q.answer) {
        score++
        subtopicMap[st].correct++
      }
    })

    const subtopicResults = Object.entries(subtopicMap).map(([name, d]) => ({
      name,
      correct: d.correct,
      total: d.total,
      percentage: calculatePercentage(d.correct, d.total),
    })).sort((a, b) => b.percentage - a.percentage)

    const strongAreas = subtopicResults.filter(s => s.percentage >= 70)
    const weakAreas = subtopicResults.filter(s => s.percentage < 70)
    const timeTaken = 20 * 60 - timeLeft
    const percentage = calculatePercentage(score, questions.length)

    const quizResult = {
      topic: selectedTopic.topic_name,
      subtopic: selectedSubtopic,
      difficulty,
      score,
      total: questions.length,
      percentage,
      strongAreas,
      weakAreas,
      timeTaken,
      autoSubmit,
      answers,
      questions,
      quizType: QUIZ_TYPES.SELF_PRACTICE,
      studentId: user.id,
    }

    const saved = await saveQuizAttempt(quizResult)
    setResults({ ...quizResult, id: saved?.id })
    setStep('results')
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  if (step === 'setup') return (
    <div className="page-container min-h-screen" ref={topRef}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <h1 className="text-3xl font-bold text-white">🧠 Practice Quiz</h1>
          <p className="text-slate-400 mt-1">20 AI-generated MCQs with timer & analysis</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}
        
        <TopicSelector topics={topics} selectedTopic={selectedTopic} onSelect={(t) => { setSelectedTopic(t); setSelectedSubtopic('') }} />
        <SubtopicSelector selectedTopic={selectedTopic} selectedSubtopic={selectedSubtopic} onSelect={setSelectedSubtopic} />
        {selectedSubtopic && <DifficultySelector difficulty={difficulty} onSelect={setDifficulty} />}
        
        <button onClick={generateQuiz} disabled={!selectedTopic || !selectedSubtopic || !difficulty} className="btn-primary w-full py-4 text-lg font-bold mb-3 mt-4">
          🚀 Generate & Start Quiz
        </button>
      </div>
    </div>
  )

  if (step === 'loading') return <LoadingScreen message={`Generating 20 ${difficulty} questions on ${selectedSubtopic}...`} />

  if (step === 'quiz') return (
    <div className="min-h-screen bg-slate-950" ref={topRef}>
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <p className="font-bold text-indigo-400 text-sm">{selectedSubtopic}</p>
            <p className="text-xs text-slate-500">{Object.keys(answers).length}/{questions.length} answered</p>
          </div>
          <Timer timeLeft={timeLeft} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-5 pb-32">
        {questions.map((q, i) => (
          <QuizCard key={i} question={q} index={i} total={questions.length} selectedAnswer={answers[i]} onAnswer={(ans) => setAnswers(prev => ({ ...prev, [i]: ans }))} />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-sm text-slate-400">{Object.keys(answers).length === questions.length ? '✅ All answered!' : `⏱️ ${questions.length - Object.keys(answers).length} left`}</p>
          <button onClick={() => submitQuiz(false)} className="btn-success px-8 py-3 font-bold">Submit Quiz</button>
        </div>
      </div>
    </div>
  )

  if (step === 'results') return (
    <div className="page-container min-h-screen" ref={topRef}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
        <ResultCard results={results} />
        <QuizReview questions={questions} answers={answers} />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <button
            onClick={() => {
              localStorage.setItem('roadmapData', JSON.stringify({
                subject: selectedSubtopic || selectedTopic.topic_name,
                field: selectedTopic.topic_name,
                difficulty,
                score: results.percentage,
                weakAreas: results.weakAreas || [],
                strongAreas: results.strongAreas || [],
              }))
              router.push('/student/roadmaps')
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20"
          >
            🗺️ Get AI Roadmap
          </button>
          <button onClick={() => setStep('setup')} className="btn-primary py-4 font-bold">🔄 New Quiz</button>
          <button onClick={() => router.push('/student/dashboard')} className="btn-secondary py-4 font-bold">🏠 Dashboard</button>
        </div>
      </div>
    </div>
  )

  return null
}

export default function PracticeQuiz() {
  return (
    <RoleGate role={ROLES.STUDENT}>
      <PracticeContent />
    </RoleGate>
  )
}
