export default function EmptyState({ icon = '⚪', title = 'No data found', description = 'There is nothing to show here yet.', action }) {
  return (
    <div className="text-center py-16 fade-in">
      <p className="text-5xl mb-4">{icon}</p>
      <p className="text-xl text-slate-400 mb-2">{title}</p>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm px-6 py-2.5">
          {action.label}
        </button>
      )}
    </div>
  );
}
