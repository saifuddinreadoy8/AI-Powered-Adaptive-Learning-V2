"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { saveRoadmap, getRoadmapHistory } from '@/services/roadmapService'
import { generateRoadmapAI } from '@/lib/gemini'

function RoadmapsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentRoadmap, setCurrentRoadmap] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [manualTopic, setManualTopic] = useState('')
  const [error, setError] = useState('')
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
    if (!user) return
    loadRoadmaps()
    // Check for quiz-triggered roadmap
    const saved = localStorage.getItem('roadmapData')
    if (saved) {
      const data = JSON.parse(saved)
      setQuizData(data)
      localStorage.removeItem('roadmapData')
      handleGenerate(data)
    }
  }, [user])

  async function loadRoadmaps() {
    const data = await getRoadmapHistory(user.id)
    setRoadmaps(data)
    setLoading(false)
  }

  async function handleGenerate(data = null) {
    const d = data || quizData
    const subject = d?.subject || manualTopic
    const field = d?.field || 'General'
    if (!subject) { setError('⚠️ Please enter a topic!'); return }

    setError('')
    setGenerating(true)
    try {
      const result = await generateRoadmapAI(
        subject, field, d?.weakAreas || [], d?.strongAreas || [],
        d?.score || 0, d?.difficulty || 'Medium'
      )
      setCurrentRoadmap(result)
      setActivePhase(0)

      // Save to Supabase
      await saveRoadmap(user.id, {
        ...result, subject, field,
        score: d?.score || 0,
        weakAreas: d?.weakAreas || [],
        strongAreas: d?.strongAreas || [],
      })
      await loadRoadmaps()
    } catch (err) {
      setError(`❌ ${err.message}`)
    }
    setGenerating(false)
  }

  const getIcon = (type) => ({ youtube: '▶️', article: '📄', docs: '📚', practice: '💻' }[type] || '🔗')

  // Loading
  if (generating) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="text-center fade-in">
          <div className="text-7xl mb-6 float">🗺️</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Building your roadmap...</h2>
          {quizData?.weakAreas?.length > 0 && (
            <div className="mt-3 space-y-2">
              {quizData.weakAreas.slice(0, 3).map((a, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-300">
                  📉 Targeting: <b>{a.name}</b> ({a.percentage}%)
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // View Roadmap
  if (currentRoadmap) return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card mb-5 fade-in">
          <h1 className="text-2xl font-bold gradient-text mb-2">🗺️ {currentRoadmap.title}</h1>
          <p className="text-slate-300 text-sm mb-3">{currentRoadmap.summary}</p>
          {currentRoadmap.focusMessage && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-300 text-sm">⚡ <b>Focus:</b> {currentRoadmap.focusMessage}</p>
            </div>
          )}
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {currentRoadmap.phases?.map((p, i) => (
            <button key={i} onClick={() => setActivePhase(i)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activePhase === i ? 'border-purple-500 bg-purple-500/15 text-purple-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              Phase {p.phase} {p.priority === 'high' ? '🔴' : p.priority === 'medium' ? '🟡' : '🟢'}
            </button>
          ))}
        </div>

        {/* Phase Detail */}
        {currentRoadmap.phases?.[activePhase] && (() => {
          const phase = currentRoadmap.phases[activePhase]
          return (
            <div className={`card mb-5 border-l-4 ${
              phase.priority === 'high' ? 'border-l-red-500' : phase.priority === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{phase.title}</h2>
                  <p className="text-slate-400 text-sm">⏱️ {phase.duration}</p>
                </div>
                <span className={`badge ${
                  phase.priority === 'high' ? 'bg-red-500/20 text-red-300' : phase.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>{phase.priority?.toUpperCase()}</span>
              </div>

              <div className="space-y-3 mb-4">
                {phase.topics?.map((t, j) => (
                  <div key={j} className={`rounded-xl p-4 ${t.isWeak ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{t.isWeak ? '📉' : '📖'}</span>
                      <h3 className="font-bold text-sm text-white">{t.name}</h3>
                      {t.isWeak && <span className="text-xs bg-red-500/20 text-red-300 px-2 rounded-full">Weak Area</span>}
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{t.description}</p>
                    {t.tips?.map((tip, k) => <p key={k} className="text-xs text-amber-300">💡 {tip}</p>)}
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-sm text-slate-300 mb-2">📚 Resources</h3>
              <div className="space-y-2">
                {phase.resources?.map((r, j) => {
                  const isYouTube = r.type === 'youtube' || (r.url && (r.url.includes('youtube.com') || r.url.includes('youtu.be')))
                  const safeUrl = isYouTube 
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(r.title + ' ' + (currentRoadmap.subject || ''))}`
                    : r.url

                  return (
                    <a key={j} href={safeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl p-3 transition-colors">
                      <span className="text-xl">{getIcon(r.type)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-indigo-400">{r.title}</p>
                        <p className="text-xs text-slate-400">{r.description}</p>
                      </div>
                      <span className="text-slate-500 text-sm">↗</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Daily Plan */}
        {currentRoadmap.dailyPlan && (
          <div className="card mb-5">
            <h2 className="text-lg font-bold mb-1">📅 Daily Study Plan</h2>
            <p className="text-slate-400 text-sm mb-4">⏰ {currentRoadmap.dailyPlan.studyTime}</p>
            <div className="space-y-2">
              {currentRoadmap.dailyPlan.schedule?.map((item, i) => (
                <div key={i} className="flex gap-3 bg-slate-800/50 rounded-xl p-3">
                  <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2 py-1 rounded-lg shrink-0">{item.day}</span>
                  <p className="text-sm text-slate-300">{item.task}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentRoadmap.motivationalTip && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-5">
            <p className="text-purple-200 text-sm">✨ <b>Note:</b> {currentRoadmap.motivationalTip}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/student/practice')} className="btn-primary py-3 font-bold">🧠 New Quiz</button>
          <button onClick={() => { setCurrentRoadmap(null); setQuizData(null) }} className="btn-secondary py-3 font-bold">🔄 New Roadmap</button>
        </div>
      </div>
    </div>
  )

  // Main: manual entry + history
  return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <h1 className="text-3xl font-bold text-white">🗺️ Learning Roadmaps</h1>
          <p className="text-slate-400 mt-1">AI-generated personalized improvement plans</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <div className="card mb-6 fade-in">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
            <p className="text-amber-300 text-sm">💡 <b>Tip:</b> Take a quiz first! Your roadmap will be personalized from your weak areas.</p>
          </div>
          <input type="text" placeholder="e.g. React.js, Algorithms, Organic Chemistry..."
            value={manualTopic} onChange={e => setManualTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="input mb-3" />
          <button onClick={() => handleGenerate()} disabled={!manualTopic}
            className="btn-primary w-full py-3 font-bold">🚀 Generate Roadmap</button>
        </div>

        {/* Previous Roadmaps */}
        {roadmaps.length > 0 && (
          <div className="fade-in">
            <h2 className="text-lg font-bold text-white mb-4">📚 Previous Roadmaps</h2>
            <div className="space-y-3 stagger">
              {roadmaps.map((rm) => (
                <button key={rm.id} onClick={() => setCurrentRoadmap(rm)}
                  className="w-full card-hover text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{rm.title || rm.subject}</h3>
                      <p className="text-slate-500 text-xs">
                        {rm.subject} • Score: {rm.score}% • {new Date(rm.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-slate-500">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Roadmaps() {
  return (
    <ProtectedRoute role="student">
      <RoadmapsContent />
    </ProtectedRoute>
  )
}
