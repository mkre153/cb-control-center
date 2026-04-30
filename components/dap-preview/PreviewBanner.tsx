import Link from 'next/link'

export function PreviewBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wide">Preview Layer</span>
        <span className="text-amber-600">—</span>
        <span>This is a functional prototype inside CB Control Center. Not the production DAP site.</span>
      </div>
      <Link href="/" className="shrink-0 font-medium underline hover:text-amber-900">
        ← Control Center
      </Link>
    </div>
  )
}
