import Link from 'next/link'
import type { CbBusinessInstance, CbBusinessStatus } from '@/lib/cb-control-center/cbBusinessPortfolioTypes'
import { CB_BUSINESS_PORTFOLIO } from '@/lib/cb-control-center/cbBusinessPortfolioData'
import { MockModeBanner } from '@/components/cb-control-center/MockModeBanner'

const SYSTEM_CONTRACTS = [
  { label: 'LLM Page Formatting Standard', href: '/preview/cbseoaeo/llm-page-format' },
  { label: 'Page Generation Contracts', href: '/preview/cbseoaeo/page-generation-contract' },
  { label: 'DAP Page Briefs', href: '/preview/dap/page-briefs' },
  { label: 'DAP Onboarding Preview', href: '/preview/dap/onboarding' },
  { label: 'DAP Member Status Preview', href: '/preview/dap/member-status' },
] as const

const STATUS_PILL: Record<CbBusinessStatus, string> = {
  blocked: 'bg-red-100 text-red-700 border border-red-200',
  foundation_active: 'bg-blue-100 text-blue-700 border border-blue-200',
  content_strategy_active: 'bg-amber-100 text-amber-700 border border-amber-200',
  go_to_market_active: 'bg-green-100 text-green-700 border border-green-200',
  concept: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function StatusPill({ status, label }: { status: CbBusinessStatus; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_PILL[status]}`}>
      {label}
    </span>
  )
}

function ReadinessBar({ percent }: { percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Readiness</span>
        <span className="text-gray-600 font-medium">{percent}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function BusinessCard({ business }: { business: CbBusinessInstance }) {
  const primaryHref = business.buildPath ?? business.detailPath
  const primaryLabel = business.buildPath ? 'Open build pipeline' : 'Open business'

  return (
    <div
      data-business-card
      data-business-slug={business.slug}
      className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:border-gray-300 transition-colors"
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{business.name}</h3>
          <StatusPill status={business.status} label={business.statusLabel} />
        </div>
        <p className="text-xs text-gray-400">{business.category}</p>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{business.description}</p>

      {business.readinessPercent !== null && (
        <ReadinessBar percent={business.readinessPercent} />
      )}

      <div className="bg-gray-50 rounded-lg px-3 py-2">
        <p className="text-xs font-medium text-gray-500 mb-0.5">Next action</p>
        <p className="text-xs text-gray-700">{business.nextAction}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <a
          href={primaryHref}
          data-build-pipeline-link={business.buildPath ? 'true' : undefined}
          className="flex-1 text-center text-xs font-semibold bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-700 transition-colors"
        >
          {primaryLabel}
        </a>
        <a
          href={business.detailPath}
          className="text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
        >
          Overview
        </a>
      </div>
    </div>
  )
}

export function CbHomeDashboard() {
  const { businesses, newBusinessAction } = CB_BUSINESS_PORTFOLIO
  const blockedBusinesses = businesses.filter(b => b.status === 'blocked')
  const dapBusiness = businesses.find(b => b.slug === 'dental-advantage-plan')

  return (
    <div data-cb-home-dashboard className="min-h-screen bg-gray-50">
      <MockModeBanner />

      {/* Dark command header */}
      <div className="bg-gray-900 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CB Control Center</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage markets, sites, directories, and business systems from one place.
              </p>
              <span
                data-workspace-mode-badge
                className="inline-block mt-2 text-xs font-mono font-semibold text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded px-2 py-0.5"
              >
                Workspace Mock Mode
              </span>
            </div>
            <div className="flex items-center gap-3">
              {dapBusiness?.buildPath && (
                <a
                  href={dapBusiness.buildPath}
                  data-resume-dap-link
                  className="text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Resume Dental Advantage Plan →
                </a>
              )}
              <Link
                href="/preview/dap/page-briefs"
                data-view-system-contracts
                className="text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                View System Contracts ↗
              </Link>
              <a
                href={newBusinessAction.path}
                data-start-new-business
                className="text-xs font-semibold bg-white text-gray-900 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                {newBusinessAction.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Needs attention */}
        {blockedBusinesses.length > 0 && (
          <div data-needs-attention className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 space-y-2">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Needs Attention
            </p>
            {blockedBusinesses.map(b => (
              <div key={b.slug} className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-red-800">{b.name}</span>
                  <span className="text-xs text-red-600 ml-2">{b.nextAction}</span>
                </div>
                {b.buildPath && (
                  <a
                    href={b.buildPath}
                    className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors whitespace-nowrap"
                  >
                    Resolve blockers →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Business grid */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Businesses &amp; Markets ({businesses.length})
          </h2>
          <div
            data-business-list
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {businesses.map(b => (
              <BusinessCard key={b.slug} business={b} />
            ))}

            {/* Start new business card */}
            <div
              data-new-business-card
              className="bg-white border border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:border-gray-400 transition-colors min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xl leading-none">+</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">{newBusinessAction.label}</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                  {newBusinessAction.description}
                </p>
              </div>
              <a
                href={newBusinessAction.path}
                className="text-xs font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                Create new business
              </a>
            </div>
          </div>
        </div>

        {/* System Contracts */}
        <div data-system-contracts>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              System Contracts
            </h2>
            <Link
              href="/preview/dap/page-briefs"
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              View System Contracts ↗
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {SYSTEM_CONTRACTS.map(c => (
              <a
                key={c.href}
                href={c.href}
                data-system-contract-link
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                {c.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
