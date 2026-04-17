import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PerformanceTable({ attempts, quizId }) {
  if (!attempts || attempts.length === 0) {
    return <p className="text-slate-500 italic text-center py-8">No results recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
            <th className="py-3 px-4 font-semibold">Student</th>
            <th className="py-3 px-4 font-semibold">Score</th>
            <th className="py-3 px-4 font-semibold">Percentage</th>
            <th className="py-3 px-4 font-semibold">Submitted</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {attempts.map((att) => (
            <tr key={att.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="py-4 px-4">
                <div className="font-bold text-white">{att.profiles?.name || 'Unknown'}</div>
                <div className="text-xs text-slate-500">{att.profiles?.email}</div>
              </td>
              <td className="py-4 px-4 font-mono text-indigo-400">
                {att.score}/{att.total}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${att.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {att.percentage}%
                  </span>
                  <div className="w-16 bg-slate-700 h-1 rounded-full hidden sm:block">
                    <div
                      className={`h-1 rounded-full ${att.percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${att.percentage}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-slate-400">{formatDate(att.submitted_at)}</td>
              <td className="py-4 px-4 text-right">
                <Link
                  href={`/teacher/classes/${att.quiz_id}/quiz/${att.quiz_id}/student/${att.student_id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  View Details →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
