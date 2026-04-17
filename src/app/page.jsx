"use client"
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, profile } = useAuth()

  const dashboardLink = profile
    ? profile.role === 'admin' ? '/admin/dashboard'
      : profile.role === 'teacher' ? '/teacher/dashboard'
      : '/student/dashboard'
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 flex flex-col">
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="text-lg font-bold text-white">AI Learning</span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link href={dashboardLink || '/student/dashboard'} className="btn-primary text-sm px-6 py-2">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm px-6 py-2">Login</Link>
              <Link href="/register" className="btn-primary text-sm px-6 py-2">Get Started Free</Link>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="fade-in-up max-w-4xl">
          <div className="text-7xl mb-6 float">🎓</div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            AI Learning{' '}
            <span className="gradient-text">Companion</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-3 max-w-2xl mx-auto">
            AI-Powered Adaptive Quiz & Classroom Platform
          </p>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto">
            Practice quizzes independently or join teacher-led classrooms.
            AI generates questions, detects weak areas, and builds personalized roadmaps.
          </p>

          {!user && (
            <div className="flex gap-4 justify-center flex-wrap mb-16">
              <Link href="/register" className="btn-primary text-lg px-10 py-3.5 shadow-xl shadow-indigo-500/30">
                🚀 Start Learning Free
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-10 py-3.5">
                Sign In
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left stagger">
            {[
              { icon: '🤖', title: 'AI-Generated Quizzes', desc: 'Select topic, subtopic & difficulty — get 20 focused MCQs with explanations', color: 'from-blue-500/20 to-indigo-500/20' },
              { icon: '📊', title: 'Weak Area Detection', desc: 'AI analyzes your performance and identifies exactly which subtopics need work', color: 'from-purple-500/20 to-pink-500/20' },
              { icon: '🗺️', title: 'Learning Roadmaps', desc: 'Personalized step-by-step improvement plans with curated resources', color: 'from-emerald-500/20 to-teal-500/20' },
            ].map((f, i) => (
              <div key={i} className={`card hover:border-slate-700 transition-all duration-300 bg-gradient-to-br ${f.color}`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 mb-12">
            <h2 className="text-2xl font-bold text-white mb-8">Built for Everyone</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left stagger">
              {[
                { icon: '📖', role: 'Students', desc: 'Practice AI quizzes, join classes, track progress, and get personalized roadmaps', badge: 'badge-student' },
                { icon: '👩‍🏫', role: 'Teachers', desc: 'Create classes, generate AI quizzes, conduct exams, and monitor student scores', badge: 'badge-teacher' },
                { icon: '⚙️', role: 'Admins', desc: 'Manage topics, subtopics, and user accounts for the entire platform', badge: 'badge-admin' },
              ].map((r, i) => (
                <div key={i} className="card hover:border-slate-700 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{r.icon}</span>
                    <span className={r.badge}>{r.role}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-slate-600 text-sm border-t border-slate-800/50">
        © 2026 AI Learning Companion — Built with Next.js & Supabase
      </footer>
    </div>
  )
}