import { DIFFICULTY_LEVELS } from '@/constants/difficultyLevels';

export default function DifficultySelector({ difficulty, onSelect }) {
  return (
    <div className="card mb-4 fade-in">
      <h2 className="text-lg font-bold mb-1">⚡ Step 3: Select Difficulty</h2>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTY_LEVELS.map((d) => (
          <button
            key={d.level}
            onClick={() => onSelect(d.level)}
            className={`p-4 rounded-xl text-center border-2 transition-all ${
              difficulty === d.level
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">{d.icon}</div>
            <div className="font-bold text-white">{d.level}</div>
            <div className="text-xs text-slate-400 mt-1">{d.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
