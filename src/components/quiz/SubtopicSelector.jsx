export default function SubtopicSelector({ selectedTopic, selectedSubtopic, onSelect }) {
  if (!selectedTopic) return null;

  return (
    <div className="card mb-4 fade-in">
      <h2 className="text-lg font-bold mb-1">🎯 Step 2: Select Subtopic</h2>
      <p className="text-slate-400 text-sm mb-4">
        Pick a topic in <b>{selectedTopic.topic_name}</b>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {selectedTopic.subtopics?.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.subtopic_name)}
            className={`p-3 rounded-xl text-sm font-medium text-center border-2 transition-all ${
              selectedSubtopic === s.subtopic_name
                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                : 'border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            {s.subtopic_name}
          </button>
        ))}
      </div>
    </div>
  );
}
