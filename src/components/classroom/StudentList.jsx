import { formatDate } from '@/lib/utils';

export default function StudentList({ students, onRemove }) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
        <p className="text-slate-500 italic">No students enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((s) => (
        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              {s.profiles?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-white">{s.profiles?.name || 'Anonymous'}</p>
              <p className="text-xs text-slate-500">{s.profiles?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Joined</p>
              <p className="text-xs font-medium text-slate-400">{formatDate(s.enrolled_at)}</p>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(s.id)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Remove Student"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
