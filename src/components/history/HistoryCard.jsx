import Link from 'next/link'

export default function HistoryCard({ attempt }) {
  if (!attempt) return null

  return (
    <Link
      href={`/student/result/${attempt.id}`}
      className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">
          {attempt.percentage >= 70 ? '🏆' : attempt.percentage >= 40 ? '📚' : '💪'}
        </span>
        <div>
          <p className="text-sm font-medium text-white">
            {attempt.subtopic || attempt.topic || attempt.field || 'Quiz'}
          </p>
          <p className="text-xs text-slate-500">
            {attempt.difficulty} • {attempt.quiz_type === 'classroom' ? '🏫 Classroom' : '🧠 Self Practice'}
            {attempt.submitted_at && ` • ${new Date(attempt.submitted_at).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-lg font-bold ${
          attempt.percentage >= 70 ? 'text-emerald-400' :
          attempt.percentage >= 40 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {Math.round(attempt.percentage)}%
        </span>
        <p className="text-xs text-slate-500">{attempt.score}/{attempt.total}</p>
      </div>
    </Link>
  )
}
