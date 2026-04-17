/**
 * QuizReview component to display questions with answers and explanations.
 */
export default function QuizReview({ questions, answers }) {
  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">📋 Review & Explanations</h2>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.answer;
          return (
            <div
              key={i}
              className={`rounded-xl p-4 border-l-4 ${
                !userAns
                  ? 'border-slate-500 bg-slate-800/50'
                  : isCorrect
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-red-500 bg-red-500/5'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span>{!userAns ? '⬜' : isCorrect ? '✅' : '❌'}</span>
                <p className="font-medium text-sm">
                  {i + 1}. {q.question}
                </p>
              </div>
              <div className="space-y-1 mb-2 ml-6">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`text-xs px-3 py-1.5 rounded-lg flex justify-between ${
                      opt === q.answer
                        ? 'bg-emerald-500/20 text-emerald-200 font-bold'
                        : opt === userAns && !isCorrect
                        ? 'bg-red-500/20 text-red-200'
                        : 'text-slate-600'
                    }`}
                  >
                    <span>
                      {['A', 'B', 'C', 'D'][j]}. {opt}
                    </span>
                    {opt === q.answer && <span>✓ Correct</span>}
                    {opt === userAns && !isCorrect && <span>✗ Your answer</span>}
                  </div>
                ))}
              </div>
              <div className="ml-6 bg-slate-800/80 rounded-lg p-2 text-xs text-slate-300 border-l-2 border-amber-500">
                💡 {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
