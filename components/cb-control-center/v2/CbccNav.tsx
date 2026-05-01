import Link from 'next/link'

export function CbccNav({ newProjectDisabled = false }: { newProjectDisabled?: boolean } = {}) {
  return (
    <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900">
      <Link href="/" className="text-blue-400 font-semibold tracking-tight hover:text-blue-300">
        CB Control Center
      </Link>
      <Link
        href="/projects/new"
        className={`px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md transition-colors ${
          newProjectDisabled ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-700'
        }`}
      >
        + New Project
      </Link>
    </nav>
  )
}
