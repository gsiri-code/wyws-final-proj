const legendItems = [
  ["S", "Sleep", "bg-indigo-200 text-indigo-950"],
  ["N", "Nap", "bg-violet-200 text-violet-950"],
  ["B", "In bed", "bg-blue-200 text-blue-950"],
  ["E", "Exercise", "bg-emerald-200 text-emerald-950"],
  ["C", "Caffeine", "bg-yellow-200 text-yellow-950"],
  ["A", "Alcohol", "bg-rose-200 text-rose-950"],
  ["M", "Medicine", "bg-sky-200 text-sky-950"],
] as const;

export function EventTypeLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {legendItems.map(([code, label, className]) => (
        <span
          key={code}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm"
        >
          <span
            className={`inline-flex size-5 items-center justify-center rounded-full font-bold ${className}`}
          >
            {code}
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}
