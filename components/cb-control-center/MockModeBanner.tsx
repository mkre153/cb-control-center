export function MockModeBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center gap-2">
      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mock Mode</span>
      <span className="text-amber-300 text-xs">·</span>
      <span className="text-xs text-amber-600">No crawler, LLM, database, or publishing actions connected.</span>
    </div>
  )
}
