export default function QuizCard({ question, index, total, selectedAnswer, onAnswer }) {
  const options = question.options || [];

  return (
    <div
      className={`rounded-2xl p-5 border-2 transition-all bg-slate-900/80 ${
        selectedAnswer ? 'border-indigo-600/50' : 'border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            selectedAnswer ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {index + 1}
        </span>
        <div>
          <p className="font-medium leading-relaxed text-white">{question.question}</p>
          <p className="text-xs text-slate-500 mt-1">📌 {question.subtopic}</p>
        </div>
      </div>
      <div className="space-y-2 sm:ml-11 ml-0 mt-3 sm:mt-0">
        {options.map((opt, j) => (
          <button
            key={j}
            onClick={() => onAnswer(opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
              selectedAnswer === opt
                ? 'border-indigo-500 bg-indigo-500/15 text-white font-semibold'
                : 'border-slate-700 hover:border-slate-600 text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-slate-500 font-bold mr-2">{['A', 'B', 'C', 'D'][j]}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
