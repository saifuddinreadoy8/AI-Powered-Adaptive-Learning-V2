export default function RoadmapCard({ roadmap, onClick }) {
  if (!roadmap) return null

  return (
    <div
      onClick={onClick}
      className="card-hover cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{roadmap.title || 'Learning Roadmap'}</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            {roadmap.subject} • {roadmap.field}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${
            roadmap.score >= 70 ? 'text-emerald-400' :
            roadmap.score >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {Math.round(roadmap.score || 0)}%
          </span>
          <p className="text-xs text-slate-500">quiz score</p>
        </div>
      </div>
      {roadmap.summary && (
        <p className="text-slate-500 text-sm leading-relaxed mb-3 line-clamp-2">{roadmap.summary}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span>📅 {new Date(roadmap.created_at).toLocaleDateString()}</span>
        {roadmap.phases && <span>• {roadmap.phases.length} phases</span>}
      </div>
    </div>
  )
}
