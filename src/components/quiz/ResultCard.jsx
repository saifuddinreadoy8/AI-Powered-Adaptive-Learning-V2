/**
 * ResultCard component to show the final score and topic breakdown.
 */
export default function ResultCard({ results }) {
  if (!results) return null;

  return (
    <div className="card mb-6 text-center fade-in">
      <p className="text-6xl mb-3">
        {results.percentage >= 80 ? '🏆' : results.percentage >= 60 ? '👍' : results.percentage >= 40 ? '📚' : '💪'}
      </p>
      <h1 className="text-3xl font-bold mb-1">
        {results.percentage >= 80 ? 'Excellent!' : results.percentage >= 60 ? 'Good Job!' : results.percentage >= 40 ? 'Keep Practicing!' : 'Needs Improvement'}
      </h1>
      <p className="text-slate-400 text-sm mb-5">
        {results.subtopic} • {results.topic} • {results.difficulty}
      </p>
      {results.autoSubmit && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-3 py-2 text-sm mb-4 inline-block">
          ⏱️ Auto-submitted — timer reached zero
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="stat-card">
          <p className="text-3xl font-bold text-emerald-400">{results.percentage}%</p>
          <p className="text-xs text-slate-400 mt-1">Score</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-bold text-indigo-400">{results.score}/{results.total}</p>
          <p className="text-xs text-slate-400 mt-1">Correct</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-bold text-purple-400">
            {Math.floor((results.timeTaken || results.time_taken || 0) / 60)}m {(results.timeTaken || results.time_taken || 0) % 60}s
          </p>
          <p className="text-xs text-slate-400 mt-1">Time</p>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
        <div
          className={`h-3 rounded-full transition-all ${
            results.percentage >= 70 ? 'bg-emerald-500' : results.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${results.percentage}%` }}
        />
      </div>

      {/* Areas of Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <h3 className="font-bold text-emerald-400 text-sm mb-2">💪 Strong Areas</h3>
          {(results.strongAreas || []).length > 0 ? (
            results.strongAreas.map((a, i) => (
              <div key={i} className="flex justify-between text-xs text-emerald-300 py-1.5 border-b border-emerald-900/40 last:border-0">
                <span>{a.name}</span>
                <span className="font-bold">{a.percentage}%</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Keep practicing!</p>
          )}
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
          <h3 className="font-bold text-red-100 text-sm mb-2">📉 Weak Areas</h3>
          {(results.weakAreas || []).length > 0 ? (
            results.weakAreas.map((a, i) => (
              <div key={i} className="flex justify-between text-xs text-red-200 py-1.5 border-b border-red-900/40 last:border-0">
                <span>{a.name}</span>
                <span className="font-bold">{a.percentage}%</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No weak areas identified!</p>
          )}
        </div>
      </div>
    </div>
  );
}
