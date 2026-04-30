const NAV_LINKS = [
  { label: 'How It Works', href: '/dental-advantage-plan/how-it-works' },
  { label: 'Find a Dentist', href: '/dental-advantage-plan/find-a-dentist' },
  { label: 'Compare', href: '/dental-advantage-plan/compare' },
  { label: 'For Practices', href: '/dental-advantage-plan/for-practices' },
  { label: 'Guide', href: '/dental-advantage-plan/guide' },
]

export function DapSiteNav() {
  return (
    <nav
      data-dap-site-nav
      className="bg-white border-b border-gray-100 sticky top-0 z-50"
      aria-label="Dental Advantage Plan site navigation"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <a
          href="/dental-advantage-plan"
          className="flex items-center gap-1.5 shrink-0"
          aria-label="Dental Advantage Plan home"
        >
          <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            D
          </span>
          <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:block">
            Dental Advantage Plan
          </span>
          <span className="text-sm font-bold text-gray-900 tracking-tight sm:hidden">DAP</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="/dental-advantage-plan/find-a-dentist"
          className="shrink-0 text-xs font-semibold bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors"
        >
          Find a dentist
        </a>
      </div>
    </nav>
  )
}
