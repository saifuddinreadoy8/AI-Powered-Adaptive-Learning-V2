export default function TopicSelector({ topics, selectedTopic, onSelect }) {
  return (
    <div className="card mb-4 fade-in">
      <h2 className="text-lg font-bold mb-1">📚 Step 1: Select Topic</h2>
      <p className="text-slate-400 text-sm mb-4">Choose your subject area</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`p-3 rounded-xl text-sm font-medium text-left border-2 transition-all ${
              selectedTopic?.id === t.id
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <span className="mr-1">{t.icon}</span> {t.topic_name}
          </button>
        ))}
      </div>
    </div>
  );
}
