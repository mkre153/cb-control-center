export function MockModeBanner() {
  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mock Mode</span>
      <span className="text-amber-300 text-xs">—</span>
      <span className="text-xs text-amber-600">
        No crawler, LLM, database, or publishing actions are connected. All data is static.
      </span>
    </div>
  )
}
