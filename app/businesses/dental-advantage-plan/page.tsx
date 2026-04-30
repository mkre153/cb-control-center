import { CB_BUSINESS_PORTFOLIO } from '@/lib/cb-control-center/cbBusinessPortfolioData'
import { MockModeBanner } from '@/components/cb-control-center/MockModeBanner'

export default function DapBusinessDetailPage() {
  const business = CB_BUSINESS_PORTFOLIO.businesses.find(
    b => b.slug === 'dental-advantage-plan'
  )
  if (!business) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <MockModeBanner />
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <nav
            data-breadcrumb
            className="flex items-center gap-2 text-sm text-gray-500"
            aria-label="Breadcrumb"
          >
            <a href="/" className="hover:text-gray-800 transition-colors">
              CB Control Center
            </a>
            <span className="text-gray-300" aria-hidden="true">/</span>
            <span className="text-gray-800 font-medium" aria-current="page">
              Dental Advantage Plan
            </span>
          </nav>
          <span
            data-workspace-mode-badge
            className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5"
          >
            Simulation Preview
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{business.category}</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              {business.statusLabel}
            </span>
          </div>

          <p className="text-sm text-gray-600">{business.description}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Next action
            </p>
            <p className="text-sm text-amber-800">{business.nextAction}</p>
          </div>

          {business.buildPath && (
            <div className="pt-2">
              <a
                href={business.buildPath}
                data-open-build-pipeline
                className="inline-flex items-center gap-2 text-sm font-semibold bg-gray-900 text-white rounded-lg px-5 py-2.5 hover:bg-gray-700 transition-colors"
              >
                Open build pipeline →
              </a>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Business modules</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(
              [
                { label: 'Requests', href: '/preview/dap/requests' },
                { label: 'Onboarding', href: '/preview/dap/onboarding' },
                { label: 'Offer Terms', href: '/preview/dap/offer-terms' },
                { label: 'Members', href: '/preview/dap/member-admin-summary' },
                { label: 'Communications', href: '/preview/dap/communication-approvals' },
                { label: 'Admin Review', href: '/preview/dap/admin-review' },
              ] as const
            ).map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 hover:text-gray-900 transition-colors text-center"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
