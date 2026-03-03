"use client"
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="fade-in max-w-3xl">
        <div className="text-6xl mb-6">🎓</div>
        <h1 className="text-5xl font-bold text-white mb-4">
          AI Learning <span className="text-indigo-400">Companion</span>
        </h1>
        <p className="text-slate-300 text-lg mb-3">AI-Powered Adaptive Quiz System</p>
        <p className="text-slate-400 mb-10">
          Select Subject → Topic → Difficulty → Get 20 focused MCQs →
          Instant feedback → Personalized roadmap with YouTube resources
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-14">
          <Link href="/login"    className="btn-primary  text-lg px-10 py-3">Login</Link>
          <Link href="/register" className="btn-secondary text-lg px-10 py-3">Get Started Free</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {[
            { e:'🤖', t:'20 Focused MCQs',       d:'4 subtopics × 5 questions — only the most important concepts' },
            { e:'📊', t:'Weak Area Detection',    d:'AI identifies exactly which subtopics need more work' },
            { e:'🗺️', t:'Personalized Roadmap',  d:'Step-by-step plan + YouTube links saved in your history' },
          ].map((f,i) => (
            <div key={i} className="card">
              <div className="text-3xl mb-2">{f.e}</div>
              <h3 className="text-white font-bold mb-1">{f.t}</h3>
              <p className="text-slate-400 text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}