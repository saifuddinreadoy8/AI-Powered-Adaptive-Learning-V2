import { formatTime } from '@/lib/utils';

export default function Timer({ timeLeft }) {
  const isUrgent = timeLeft < 120; // < 2 minutes
  const isWarning = timeLeft < 300; // < 5 minutes

  return (
    <div
      className={`text-xl font-bold font-mono px-4 py-2 rounded-xl border-2 transition-all ${
        isUrgent
          ? 'border-red-500 bg-red-500/10 text-red-300 animate-pulse'
          : isWarning
          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
          : 'border-slate-700 bg-slate-800 text-emerald-400'
      }`}
    >
      ⏱️ {formatTime(timeLeft)}
    </div>
  );
}
