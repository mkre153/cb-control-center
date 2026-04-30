const FOOTER_LINKS = [
  { label: 'How It Works', href: '/dental-advantage-plan/how-it-works' },
  { label: 'Find a Dentist', href: '/dental-advantage-plan/find-a-dentist' },
  { label: 'Compare Options', href: '/dental-advantage-plan/compare' },
  { label: 'For Practices', href: '/dental-advantage-plan/for-practices' },
  { label: 'Guide', href: '/dental-advantage-plan/guide' },
]

const DISCLAIMER =
  'Dental Advantage Plan is not dental insurance. Plan availability, pricing, included services, discounts, and treatment recommendations are determined by each participating dental practice. Dental Advantage Plan does not provide dental care, process insurance claims, make treatment decisions, or collect protected health information.'

export function DapSiteFooter() {
  return (
    <footer data-dap-footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                D
              </span>
              <span className="text-sm font-bold text-gray-900">Dental Advantage Plan</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              A directory of dental practices offering in-house membership plans for patients
              without traditional insurance.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Navigation
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Get started
            </p>
            <div className="space-y-2">
              <a
                href="/dental-advantage-plan/find-a-dentist"
                className="block text-xs font-semibold bg-blue-600 text-white rounded-lg px-3 py-2.5 text-center hover:bg-blue-700 transition-colors"
              >
                Find a participating dentist
              </a>
              <a
                href="/dental-advantage-plan/guide"
                className="block text-xs text-gray-600 hover:text-gray-900 transition-colors text-center"
              >
                Read the 5-minute guide →
              </a>
            </div>
          </div>
        </div>

        <div
          data-dap-disclaimer
          className="border-t border-gray-200 pt-6 space-y-2"
        >
          <p className="text-xs text-gray-400 leading-relaxed">{DISCLAIMER}</p>
          <p className="text-xs text-gray-400">
            © 2026 Dental Advantage Plan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
